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
- Custom Instructions: {custom_instructions}

**PLATFORM-SPECIFIC GUIDELINES:**

**Instagram:**
- Caption: 150-300 characters, engaging hook in first line
- Focus on visual appeal and storytelling
- Use 5-10 relevant hashtags
- Include call-to-action (save, share, try)
- Emojis to break up text

**Twitter/X:**
- Keep under 280 characters
- Punchy, attention-grabbing
- 2-3 hashtags max
- Include question or CTA to drive engagement

**Threads:**
- Conversational tone, 1-3 short paragraphs
- Can be slightly longer than Twitter
- 3-5 hashtags
- Encourage discussion

**Facebook:**
- Longer, story-driven caption (300-500 chars)
- Personal touch, relatable
- 3-5 hashtags
- Ask questions to drive comments

**LinkedIn:**
- Professional yet approachable
- Focus on health benefits, cooking tips, or cultural aspects
- 2-3 professional hashtags
- Educational angle

**Pinterest:**
- SEO-focused description
- Include key ingredients and benefits
- 5-8 descriptive hashtags
- Clear recipe type in first line

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
                "custom_instructions": custom_instructions or "None"
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
