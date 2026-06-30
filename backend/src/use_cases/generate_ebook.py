# src/use_cases/generate_ebook.py
"""Generate AI-assisted recipe e-books from the WPRM recipe database.
 
Covers WBS items:
  4.1  Content topic mapping  -> suggest_topics() (holiday-aware)
  4.2  AI content drafting     -> LLM-drafted foreword + per-recipe headnotes
  4.3  Structuring/formatting   -> EbookPdfRenderer (PDF output)
  4.4  Funnel integration prep  -> funnel metadata returned with the result
 
The LLM is optional: if it is unavailable (no API key, network error, bad
response) the use case degrades gracefully to template/recipe-derived prose so
an e-book is always produced.
"""
 
import json
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Optional
 
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
 
from src.config import GOOGLE_API_KEY
from src.infrastructure.repository.wprm_recipe_repo import WPRMRecipeRepository
from src.infrastructure.ebook.pdf_renderer import EbookPdfRenderer
from src.services.holiday_service import HolidayService
 
logger = logging.getLogger(__name__)
 
# Output directory for generated e-books (overridable via env). The download
# endpoint serves files from here.
EBOOK_OUTPUT_DIR = os.getenv("EBOOK_OUTPUT_DIR", "generated_ebooks")
 
# Map of recognised holiday names (lowercase substring) -> e-book topic. Used by
# topic mapping (4.1) to turn upcoming holidays into themed e-book ideas.
_HOLIDAY_TOPIC_MAP = {
    "hanukkah": "Hanukkah",
    "chanukah": "Hanukkah",
    "passover": "Passover",
    "pesach": "Passover",
    "rosh hashanah": "Rosh Hashanah",
    "yom kippur": "Yom Kippur Break-Fast",
    "sukkot": "Sukkot",
    "purim": "Purim",
    "shavuot": "Shavuot",
    "thanksgiving": "Thanksgiving",
    "christmas": "Christmas",
    "easter": "Easter",
}
 
# Evergreen topics always worth offering.
_EVERGREEN_TOPICS = ["Shabbat Dinner", "Weeknight Favorites"]
 
_lazy_llm = None
 
 
def get_ebook_llm():
    """Return a cached ChatGoogleGenerativeAI client, built on first use."""
    global _lazy_llm
    if _lazy_llm is None:
        _lazy_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7,
        )
    return _lazy_llm
 
 
def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "ebook").lower()).strip("-")
    return slug or "ebook"
 
 
class GenerateEbookUseCase:
    """Builds recipe e-books by combining WPRM recipe data with AI-drafted prose."""
 
    def __init__(self, output_dir: str = EBOOK_OUTPUT_DIR):
        self._llm = None
        self.recipe_repo = WPRMRecipeRepository()
        self.holiday_service = HolidayService()
        self.renderer = EbookPdfRenderer()
        self.output_dir = output_dir
 
    @property
    def llm(self):
        if self._llm is None:
            self._llm = get_ebook_llm()
        return self._llm
 
    # ------------------------------------------------------------------ #
    # 4.1 Topic mapping
    # ------------------------------------------------------------------ #
    def suggest_topics(self, days: int = 60) -> List[Dict[str, Any]]:
        """Suggest e-book topics, prioritising upcoming holidays."""
        suggestions: List[Dict[str, Any]] = []
        seen = set()
 
        try:
            holidays = self.holiday_service.get_upcoming_holidays(days=days)
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Holiday lookup failed, using evergreen topics only: {e}")
            holidays = []
 
        for h in holidays:
            name = (h.get("name") or "").lower()
            topic = next((t for key, t in _HOLIDAY_TOPIC_MAP.items() if key in name), None)
            if not topic or topic in seen:
                continue
            seen.add(topic)
            suggestions.append({
                "topic": topic,
                "reason": f"{h.get('name')} is coming up on {h.get('date')}.",
                "holiday_date": h.get("date"),
                "holiday_type": h.get("type"),
                "estimated_recipe_matches": self._safe_match_count(topic),
            })
 
        for topic in _EVERGREEN_TOPICS:
            if topic in seen:
                continue
            seen.add(topic)
            suggestions.append({
                "topic": topic,
                "reason": "Evergreen collection that sells year-round.",
                "holiday_date": None,
                "holiday_type": None,
                "estimated_recipe_matches": self._safe_match_count(topic),
            })
 
        return suggestions
 
    def _safe_match_count(self, topic: str) -> Optional[int]:
        try:
            return len(self.recipe_repo.search_recipes(topic, limit=50))
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Recipe match count failed for '{topic}': {e}")
            return None
 
    # ------------------------------------------------------------------ #
    # Recipe selection
    # ------------------------------------------------------------------ #
    def _select_recipes(self, topic: Optional[str], recipe_ids: Optional[List[int]],
                        max_recipes: int) -> List[Dict[str, Any]]:
        if recipe_ids:
            recipes = self.recipe_repo.get_recipes_by_ids(recipe_ids[:max_recipes])
        elif topic:
            recipes = self.recipe_repo.search_recipes(topic, limit=max_recipes)
        else:
            listing = self.recipe_repo.get_all_recipes(limit=max_recipes, offset=0)
            ids = [r.get("id") for r in listing.get("recipes", []) if r.get("id")]
            # get_all_recipes omits ingredients/instructions, so hydrate full data.
            recipes = self.recipe_repo.get_recipes_by_ids(ids) if ids else []
        return recipes[:max_recipes]
 
    # ------------------------------------------------------------------ #
    # 4.2 AI drafting (with graceful fallback)
    # ------------------------------------------------------------------ #
    async def _draft_front_matter(self, topic: Optional[str], author: str, tone: str,
                                  recipe_titles: List[str]) -> Dict[str, str]:
        fallback = {
            "title": (f"{topic} Recipes" if topic else "A Recipe Collection"),
            "subtitle": "A curated collection of tested, beloved recipes.",
            "foreword": (
                "Welcome to this collection. Each recipe here has been tested and "
                "loved. I hope these dishes bring warmth to your table.\n\n"
                "Cook with joy, and share generously."
            ),
            "closing": (
                "Thank you for cooking along. For more recipes and stories, "
                "visit the website and join the community."
            ),
        }
        prompt_text = (
            "You are a cookbook editor. Write front matter for a recipe e-book.\n"
            "Topic: {topic}\nAuthor: {author}\nTone: {tone}\n"
            "Recipes included: {titles}\n\n"
            "Return ONLY a JSON object with keys: title (string, catchy book title), "
            "subtitle (string), foreword (2 short paragraphs separated by a blank line), "
            "closing (1 short paragraph). No markdown, no preamble."
        )
        try:
            parser = JsonOutputParser()
            chain = ChatPromptTemplate.from_template(prompt_text) | self.llm | parser
            result = await chain.ainvoke({
                "topic": topic or "general", "author": author, "tone": tone,
                "titles": ", ".join(recipe_titles) or "various recipes",
            })
            if isinstance(result, dict):
                return {**fallback, **{k: v for k, v in result.items() if v}}
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Front-matter LLM draft failed, using fallback: {e}")
        return fallback
 
    async def _draft_headnote(self, recipe: Dict[str, Any], tone: str) -> str:
        title = recipe.get("title", "this dish")
        description = (recipe.get("description") or "").strip()
        fallback = description or f"A wonderful recipe for {title}."
        prompt_text = (
            "Write a short, warm 2-3 sentence headnote (intro) for a recipe in a "
            "cookbook. Tone: {tone}. Recipe title: {title}. "
            "Description/context: {description}. "
            "Return ONLY the headnote text, no title, no markdown."
        )
        try:
            chain = ChatPromptTemplate.from_template(prompt_text) | self.llm
            resp = await chain.ainvoke({
                "tone": tone, "title": title,
                "description": description[:800] or "n/a",
            })
            text = getattr(resp, "content", None) or str(resp)
            text = text.strip()
            if text:
                return text
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Headnote LLM draft failed for '{title}', using fallback: {e}")
        return fallback
 
    # ------------------------------------------------------------------ #
    # Orchestration
    # ------------------------------------------------------------------ #
    async def generate(
        self,
        topic: Optional[str] = None,
        recipe_ids: Optional[List[int]] = None,
        title: Optional[str] = None,
        author: str = "Tori Avey",
        tone: str = "warm, personal, and story-driven",
        max_recipes: int = 10,
        include_nutrition: bool = True,
    ) -> Dict[str, Any]:
        """Generate an e-book and return result metadata including the file path."""
        recipes = self._select_recipes(topic, recipe_ids, max_recipes)
        if not recipes:
            raise ValueError(
                "No recipes found for the given topic/IDs. "
                "Try a different topic or provide explicit recipe_ids."
            )
 
        recipe_titles = [r.get("title", "Untitled") for r in recipes]
        front = await self._draft_front_matter(topic, author, tone, recipe_titles)
 
        ebook_title = title or front.get("title") or "A Recipe Collection"
 
        rendered_recipes: List[Dict[str, Any]] = []
        for r in recipes:
            headnote = await self._draft_headnote(r, tone)
            rendered_recipes.append({
                "title": r.get("title", "Untitled"),
                "headnote": headnote,
                "image_url": r.get("image_url"),
                "ingredients": r.get("ingredients") or [],
                "instructions": r.get("instructions") or [],
                "prep_time": r.get("prep_time"),
                "cook_time": r.get("cook_time"),
                "total_time": r.get("total_time"),
                "servings": r.get("servings"),
                "notes": r.get("notes"),
                "nutrition": r.get("nutrition") or {},
            })
 
        draft = {
            "title": ebook_title,
            "subtitle": front.get("subtitle"),
            "author": author,
            "foreword": front.get("foreword"),
            "closing": front.get("closing"),
            "cover_image_url": recipes[0].get("image_url"),
            "cta_url": None,  # filled by funnel integration (4.4)
            "recipes": rendered_recipes,
        }
 
        filename = f"{_slugify(ebook_title)}-{uuid.uuid4().hex[:8]}.pdf"
        output_path = os.path.join(self.output_dir, filename)
        self.renderer.render(draft, output_path, include_nutrition=include_nutrition)
 
        file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
 
        return {
            "success": True,
            "message": f"Generated e-book with {len(rendered_recipes)} recipe(s).",
            "title": ebook_title,
            "filename": filename,
            "output_path": output_path,
            "download_url": f"/api/ebooks/download/{filename}",
            "format": "pdf",
            "recipe_count": len(rendered_recipes),
            "file_size_bytes": file_size,
            # 4.4 Funnel integration seam: metadata for a downstream sales flow.
            "funnel": {
                "product_title": ebook_title,
                "lead_magnet": True,
                "price_usd": None,        # TODO: set when funnel pricing is defined
                "checkout_url": None,     # TODO: wire to funnel/web checkout
                "delivery": "download",
            },
        }
 