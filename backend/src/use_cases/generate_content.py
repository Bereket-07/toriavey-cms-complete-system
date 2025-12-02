# src/use_cases/generate_content.py

import logging
import json
from typing import List, Dict, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from src.config import GOOGLE_API_KEY
from src.domain.schemas.content_schemas import (
    ScrapedRecipeData,
    ContentGenerationContext,
    GeneratedContentData,
    ContentPlatform
)
from src.services.holiday_service import HolidayService

logger = logging.getLogger(__name__)


# Initialize LLM
content_generator_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # Better analysis and understanding
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)


CONTENT_GENERATION_PROMPT = """
You are an expert social media content creator specializing in food and recipe content.
Your task is to create engaging, platform-optimized social media posts from recipe data.

**RECIPE INFORMATION:**
Title: {recipe_title}
Description: {recipe_description}
Cuisine: {recipe_cuisine}
Ingredients: {recipe_ingredients}
Instructions: {recipe_instructions}
Prep Time: {prep_time}
Cook Time: {cook_time}
Servings: {servings}

**TARGET PLATFORM:** {platform}

**CONTENT REQUIREMENTS:**
- Tone: {tone}
- Include Emojis: {include_emojis}
- Max Hashtags: {max_hashtags}
- Max Hashtags: {max_hashtags}
- Custom Instructions: {custom_instructions}

**UPCOMING HOLIDAYS (US & JEWISH):**
{upcoming_holidays}

**PLATFORM-SPECIFIC GUIDELINES (2025 BEST PRACTICES):**

**Instagram:**
- Caption: Hook in first sentence (bold statement/value). Use line breaks for readability.
- CTA: Clear call-to-action at the end (Save, Share, Comment).
- Hashtags: 9-15 mixed size tags (3-5 broad, 4-6 medium, 3-5 niche).
- Tone: Visual storytelling, authentic.

**Twitter/X:**
- Caption: Short, punchy, strong opinion or value.
- Keywords: Use real keywords naturally in text instead of hashtags.
- Hashtags: 0-2 MAX. Only use if highly relevant/trending.
- CTA: One max (e.g., "Thoughts?").

**Facebook:**
- Caption: Simple, short, human tone. First 2 lines are critical.
- Hashtags: 0-1 MAX (Facebook doesn't reward hashtag spam).
- CTA: Clear action (Save this, Comment below).
- Avoid "salesy" language; sound like a friend.

**Pinterest:**
- Caption: SEO-focused description. Write like answering a search query.
- Keywords: Include 3-5 relevant keywords naturally (e.g., "minimalist bedroom ideas").
- Hashtags: DO NOT USE HASHTAGS (or max 0-2 niche ones). Focus on keywords.
- CTA: "Save this pin", "Read more".

**LinkedIn:**
- Professional yet approachable.
- Focus on health benefits, cooking tips, or cultural aspects.
- 2-3 professional hashtags.
- Educational angle.

**OUTPUT FORMAT (JSON):**
{{
    "caption": "Main post text optimized for the platform",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
    "platform_specific": {{
        "hook": "Attention-grabbing first line (for Instagram/Facebook)",
        "cta": "Call to action",
        "key_highlight": "Main selling point of the recipe"
    }},
    "image_suggestions": [
        "Suggestion 1 for what image to use",
        "Suggestion 2"
    ],
    "alternative_captions": [
        "Alternative version 1",
        "Alternative version 2"
    ]
}}

**IMPORTANT RULES:**
1. Adapt language and style to the platform
2. Make it authentic and engaging, not salesy
3. Highlight what makes this recipe special
4. Use emojis naturally if requested
5. Include relevant trending hashtags when appropriate
6. Keep hashtags relevant to food, cooking, and the specific cuisine/dish
7. Make the caption actionable - inspire people to cook it

Generate the content now:
"""


class GenerateContentUseCase:
    """
    Use case for generating social media content from recipes using LLM.
    """
    
    def __init__(self):
        self.llm = content_generator_llm
        self.holiday_service = HolidayService()
    
    async def generate_from_recipe_data(
        self,
        recipe_data: Dict[str, Any],
        target_platforms: List[ContentPlatform],
        tone: str = "engaging and friendly",
        include_emojis: bool = True,
        max_hashtags: int = 10,
        custom_instructions: str = None
    ) -> Dict[str, Any]:
        """
        Generate social media content from recipe data (from database).
        
        Args:
            recipe_data: Dictionary containing recipe information from database
                Expected keys: title, description, ingredients, instructions, 
                              prep_time, cook_time, servings, cuisine, image_url
            target_platforms: List of platforms to generate content for
            tone: Tone of the content
            include_emojis: Whether to include emojis
            max_hashtags: Maximum number of hashtags
            custom_instructions: Additional instructions
            
        Returns:
            Dictionary with recipe data and generated contents
        """
        logger.info(f"Generating content for {len(target_platforms)} platforms from recipe: {recipe_data.get('title')}")
        
        # Step 1: Convert recipe data to ScrapedRecipeData format
        recipe = ScrapedRecipeData(
            title=recipe_data.get('title', 'Untitled Recipe'),
            description=recipe_data.get('description'),
            url=recipe_data.get('url', ''),
            image_url=recipe_data.get('image_url'),
            ingredients=recipe_data.get('ingredients', []),
            instructions=recipe_data.get('instructions', []),
            prep_time=recipe_data.get('prep_time'),
            cook_time=recipe_data.get('cook_time'),
            total_time=recipe_data.get('total_time'),
            servings=recipe_data.get('servings'),
            cuisine=recipe_data.get('cuisine'),
            category=recipe_data.get('category'),
            tags=recipe_data.get('tags', [])
        )
        
        # Step 2: Generate content for each platform
        generated_contents = []
        
        for platform in target_platforms:
            try:
                content = await self._generate_content_for_platform(
                    recipe=recipe,
                    platform=platform,
                    tone=tone,
                    include_emojis=include_emojis,
                    max_hashtags=max_hashtags,
                    custom_instructions=custom_instructions
                )
                generated_contents.append({
                    "platform": platform,
                    "content": content
                })
                logger.info(f"Generated content for {platform.value}")
            except Exception as e:
                logger.error(f"Failed to generate content for {platform.value}: {e}")
                generated_contents.append({
                    "platform": platform,
                    "error": str(e)
                })
        
        return {
            "recipe": recipe,
            "generated_contents": generated_contents
        }
    
    async def _generate_content_for_platform(
        self,
        recipe: ScrapedRecipeData,
        platform: ContentPlatform,
        tone: str,
        include_emojis: bool,
        max_hashtags: int,
        custom_instructions: str
    ) -> GeneratedContentData:
        """Generate content for a specific platform using LLM"""
        
        # Prepare context
        context = ContentGenerationContext(
            recipe=recipe,
            target_platform=platform,
            tone=tone,
            include_emojis=include_emojis,
            max_hashtags=max_hashtags,
            custom_instructions=custom_instructions
        )
        
        # Build prompt
        prompt = ChatPromptTemplate.from_template(CONTENT_GENERATION_PROMPT)
        parser = JsonOutputParser(pydantic_object=GeneratedContentData)
        chain = prompt | self.llm | parser
        
        # Format ingredients and instructions for prompt
        ingredients_str = "\n".join([f"- {ing}" for ing in recipe.ingredients[:10]])  # Limit to 10
        instructions_str = "\n".join([f"{i+1}. {inst}" for i, inst in enumerate(recipe.instructions[:5])])  # Limit to 5
        
        # Get upcoming holidays
        holidays = self.holiday_service.get_upcoming_holidays(days=45)
        if holidays:
            holidays_str = "\n".join([f"- {h['date']}: {h['name']} ({h['type']})" for h in holidays])
        else:
            holidays_str = "None in the next 45 days."

        # Generate content
        try:
            result = await chain.ainvoke({
                "recipe_title": recipe.title,
                "recipe_description": recipe.description or "No description available",
                "recipe_cuisine": recipe.cuisine or "Various",
                "recipe_ingredients": ingredients_str,
                "recipe_instructions": instructions_str,
                "prep_time": recipe.prep_time or "N/A",
                "cook_time": recipe.cook_time or "N/A",
                "servings": recipe.servings or "N/A",
                "platform": platform.value.upper(),
                "tone": tone,
                "include_emojis": "Yes" if include_emojis else "No",
                "max_hashtags": max_hashtags,
                "custom_instructions": custom_instructions or "None",
                "upcoming_holidays": holidays_str
            })
            
            return GeneratedContentData(**result)
            
        except Exception as e:
            logger.error(f"LLM generation failed for {platform.value}: {e}")
            # Fallback to basic template
            return self._generate_fallback_content(recipe, platform, include_emojis)
    
    def _generate_fallback_content(
        self,
        recipe: ScrapedRecipeData,
        platform: ContentPlatform,
        include_emojis: bool
    ) -> GeneratedContentData:
        """Generate basic fallback content if LLM fails"""
        
        emoji = "🍽️ " if include_emojis else ""
        
        caption = f"{emoji}{recipe.title}\n\n"
        
        if recipe.description:
            caption += f"{recipe.description[:100]}...\n\n"
        
        if recipe.prep_time or recipe.cook_time:
            caption += f"⏱️ Prep: {recipe.prep_time or 'N/A'} | Cook: {recipe.cook_time or 'N/A'}\n\n"
        
        caption += "Try this recipe today! Link in bio 👆"
        
        # Basic hashtags
        hashtags = ["recipe", "cooking", "food", "homemade", "delicious"]
        if recipe.cuisine:
            hashtags.append(recipe.cuisine.lower().replace(" ", ""))
        
        return GeneratedContentData(
            caption=caption,
            hashtags=hashtags[:10],
            platform_specific={
                "hook": f"Try this amazing {recipe.title}!",
                "cta": "Save this recipe for later!",
                "key_highlight": recipe.title
            },
            image_suggestions=[
                "Use the main recipe image",
                "Show finished dish plated beautifully"
            ]
        )
    
    async def regenerate_content(
        self,
        recipe: ScrapedRecipeData,
        platform: ContentPlatform,
        tone: str = None,
        include_emojis: bool = None,
        max_hashtags: int = None,
        custom_instructions: str = None
    ) -> GeneratedContentData:
        """
        Regenerate content with different parameters.
        Useful for the edit/regenerate workflow.
        """
        return await self._generate_content_for_platform(
            recipe=recipe,
            platform=platform,
            tone=tone or "engaging and friendly",
            include_emojis=include_emojis if include_emojis is not None else True,
            max_hashtags=max_hashtags or 10,
            custom_instructions=custom_instructions
        )
