# src/infrastructure/ebook/pdf_renderer.py
"""Render a recipe e-book draft to a PDF using ReportLab (Platypus).
 
Pure-Python, no system dependencies, so it runs unchanged inside the backend
Docker image. The renderer takes a plain ``EbookDraft``-shaped dict (built by
GenerateEbookUseCase) and writes a styled PDF to disk.
"""
 
import io
import logging
import os
from typing import Any, Dict, List, Optional
 
import requests
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)
 
logger = logging.getLogger(__name__)
 
# Brand palette (kept neutral/warm; adjust to match Tori Avey branding).
_ACCENT = colors.HexColor("#8C3B2B")      # warm terracotta
_INK = colors.HexColor("#2B2B2B")
_MUTED = colors.HexColor("#6B6B6B")
 
 
def _xml_escape(text: Optional[str]) -> str:
    """Escape characters that would otherwise break ReportLab paragraph markup."""
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
 
 
class EbookPdfRenderer:
    """Builds a PDF from an e-book draft dict."""
 
    def __init__(self):
        self.styles = self._build_styles()
 
    def _build_styles(self):
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="EbookCoverTitle", parent=styles["Title"], fontSize=34,
            leading=40, textColor=_ACCENT, alignment=TA_CENTER, spaceAfter=18,
        ))
        styles.add(ParagraphStyle(
            name="EbookCoverSubtitle", parent=styles["Normal"], fontSize=15,
            leading=20, textColor=_MUTED, alignment=TA_CENTER, spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="EbookAuthor", parent=styles["Normal"], fontSize=13,
            textColor=_INK, alignment=TA_CENTER,
        ))
        styles.add(ParagraphStyle(
            name="EbookH1", parent=styles["Heading1"], fontSize=22,
            leading=26, textColor=_ACCENT, spaceBefore=6, spaceAfter=12,
        ))
        styles.add(ParagraphStyle(
            name="EbookH2", parent=styles["Heading2"], fontSize=14,
            leading=18, textColor=_INK, spaceBefore=12, spaceAfter=6,
        ))
        styles.add(ParagraphStyle(
            name="EbookBody", parent=styles["Normal"], fontSize=11,
            leading=16, textColor=_INK, alignment=TA_LEFT, spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="EbookHeadnote", parent=styles["Normal"], fontSize=11,
            leading=16, textColor=_INK, alignment=TA_LEFT, spaceAfter=10,
            fontName="Helvetica-Oblique",
        ))
        styles.add(ParagraphStyle(
            name="EbookMeta", parent=styles["Normal"], fontSize=10,
            leading=14, textColor=_MUTED, spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="EbookListItem", parent=styles["Normal"], fontSize=11,
            leading=15, textColor=_INK,
        ))
        styles.add(ParagraphStyle(
            name="EbookTOCItem", parent=styles["Normal"], fontSize=12,
            leading=20, textColor=_INK,
        ))
        return styles
 
    # ------------------------------------------------------------------ #
    # Image handling
    # ------------------------------------------------------------------ #
    def _fetch_image(self, url: Optional[str], max_width: float) -> Optional[Image]:
        """Download an image and return a scaled ReportLab Image, or None on failure."""
        if not url:
            return None
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            data = io.BytesIO(resp.content)
            img = Image(data)
            # Scale to max_width preserving aspect ratio.
            if img.imageWidth and img.imageWidth > max_width:
                ratio = max_width / float(img.imageWidth)
                img.drawWidth = max_width
                img.drawHeight = img.imageHeight * ratio
            return img
        except Exception as e:  # noqa: BLE001 - image is optional, never fatal
            logger.warning(f"Could not load recipe image '{url}': {e}")
            return None
 
    # ------------------------------------------------------------------ #
    # Section builders
    # ------------------------------------------------------------------ #
    def _cover(self, draft: Dict[str, Any], content_width: float) -> List[Any]:
        story: List[Any] = [Spacer(1, 1.6 * inch)]
        story.append(Paragraph(_xml_escape(draft.get("title", "Recipe Collection")),
                               self.styles["EbookCoverTitle"]))
        if draft.get("subtitle"):
            story.append(Paragraph(_xml_escape(draft["subtitle"]),
                                   self.styles["EbookCoverSubtitle"]))
        story.append(Spacer(1, 0.3 * inch))
        cover_img = self._fetch_image(draft.get("cover_image_url"), content_width * 0.7)
        if cover_img:
            story.append(cover_img)
            story.append(Spacer(1, 0.3 * inch))
        story.append(Spacer(1, 0.4 * inch))
        story.append(Paragraph(f"by {_xml_escape(draft.get('author', 'Tori Avey'))}",
                               self.styles["EbookAuthor"]))
        story.append(PageBreak())
        return story
 
    def _foreword(self, draft: Dict[str, Any]) -> List[Any]:
        story: List[Any] = []
        foreword = draft.get("foreword")
        if foreword:
            story.append(Paragraph("Foreword", self.styles["EbookH1"]))
            for para in str(foreword).split("\n\n"):
                if para.strip():
                    story.append(Paragraph(_xml_escape(para.strip()), self.styles["EbookBody"]))
            story.append(PageBreak())
        return story
 
    def _toc(self, recipes: List[Dict[str, Any]]) -> List[Any]:
        story: List[Any] = [Paragraph("Recipes", self.styles["EbookH1"])]
        for i, recipe in enumerate(recipes, start=1):
            story.append(Paragraph(
                f"{i}. {_xml_escape(recipe.get('title', 'Untitled'))}",
                self.styles["EbookTOCItem"],
            ))
        story.append(PageBreak())
        return story
 
    def _recipe(self, index: int, recipe: Dict[str, Any], content_width: float,
                include_nutrition: bool) -> List[Any]:
        story: List[Any] = []
        story.append(Paragraph(
            f"{index}. {_xml_escape(recipe.get('title', 'Untitled'))}",
            self.styles["EbookH1"],
        ))
 
        img = self._fetch_image(recipe.get("image_url"), content_width)
        if img:
            story.append(img)
            story.append(Spacer(1, 0.15 * inch))
 
        if recipe.get("headnote"):
            story.append(Paragraph(_xml_escape(recipe["headnote"]), self.styles["EbookHeadnote"]))
 
        meta_bits = []
        for label, key in (("Prep", "prep_time"), ("Cook", "cook_time"),
                           ("Total", "total_time"), ("Serves", "servings")):
            val = recipe.get(key)
            if val:
                meta_bits.append(f"<b>{label}:</b> {_xml_escape(val)}")
        if meta_bits:
            story.append(Paragraph("&nbsp;&nbsp;|&nbsp;&nbsp;".join(meta_bits),
                                   self.styles["EbookMeta"]))
 
        ingredients = recipe.get("ingredients") or []
        if ingredients:
            story.append(Paragraph("Ingredients", self.styles["EbookH2"]))
            story.append(ListFlowable(
                [ListItem(Paragraph(_xml_escape(ing), self.styles["EbookListItem"]))
                 for ing in ingredients],
                bulletType="bullet", leftIndent=14,
            ))
 
        instructions = recipe.get("instructions") or []
        if instructions:
            story.append(Paragraph("Instructions", self.styles["EbookH2"]))
            story.append(ListFlowable(
                [ListItem(Paragraph(_xml_escape(step), self.styles["EbookListItem"]))
                 for step in instructions],
                bulletType="1", leftIndent=14,
            ))
 
        if recipe.get("notes"):
            story.append(Paragraph("Notes", self.styles["EbookH2"]))
            story.append(Paragraph(_xml_escape(recipe["notes"]), self.styles["EbookBody"]))
 
        if include_nutrition:
            nutrition = recipe.get("nutrition") or {}
            present = {k: v for k, v in nutrition.items() if v}
            if present:
                parts = [f"<b>{_xml_escape(k.title())}:</b> {_xml_escape(v)}"
                         for k, v in present.items()]
                story.append(Paragraph("Nutrition", self.styles["EbookH2"]))
                story.append(Paragraph("&nbsp;&nbsp;|&nbsp;&nbsp;".join(parts),
                                       self.styles["EbookMeta"]))
 
        story.append(PageBreak())
        return story
 
    def _closing(self, draft: Dict[str, Any]) -> List[Any]:
        story: List[Any] = [Spacer(1, 1.5 * inch)]
        closing = draft.get("closing") or (
            "Thank you for cooking with us. For more recipes, stories, and "
            "seasonal collections, visit the website."
        )
        story.append(Paragraph("Until Next Time", self.styles["EbookH1"]))
        story.append(Paragraph(_xml_escape(closing), self.styles["EbookBody"]))
        cta = draft.get("cta_url")
        if cta:
            story.append(Spacer(1, 0.2 * inch))
            story.append(Paragraph(
                f'<link href="{_xml_escape(cta)}" color="#8C3B2B">'
                f'{_xml_escape(cta)}</link>',
                self.styles["EbookBody"],
            ))
        return story
 
    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def render(self, draft: Dict[str, Any], output_path: str,
               include_nutrition: bool = True) -> str:
        """Render the draft to ``output_path`` and return the path."""
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
 
        doc = SimpleDocTemplate(
            output_path, pagesize=letter,
            leftMargin=inch, rightMargin=inch, topMargin=inch, bottomMargin=inch,
            title=draft.get("title", "Recipe E-Book"),
            author=draft.get("author", "Tori Avey"),
        )
        content_width = doc.width
 
        recipes = draft.get("recipes") or []
        story: List[Any] = []
        story += self._cover(draft, content_width)
        story += self._foreword(draft)
        story += self._toc(recipes)
        for i, recipe in enumerate(recipes, start=1):
            story += self._recipe(i, recipe, content_width, include_nutrition)
        story += self._closing(draft)
 
        doc.build(story)
        logger.info(f"Rendered e-book PDF to {output_path}")
        return output_path
 