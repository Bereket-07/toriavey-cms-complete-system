# src/use_cases/batch_generate_content.py

import logging
from typing import List, Dict, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from src.config import GOOGLE_API_KEY
from src.infrastructure.repository.recipe_repo import RecipeRepository
from src.domain.schemas.content_schemas import (
    ScrapedRecipeData,
    ContentGenerationContext,
    GeneratedContentData,
    ContentPlatform
)

logger = logging.getLogger(__name__)


# Initialize LLM
batch_content_generator_llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)


CONTENT_GENERATION_PROMPT = """
You are an expert social media content creator specializing in food and recipe content.
Your task is to create engaging, platform-optimized social media posts from recipe data.

**RECIPE INFORMATION:**
Title: {recipe_title}
Description: {recipe_description}
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
        "hook": "Attention-grabbing first line",
        "cta": "Call to action",
        "key_highlight": "Main selling point of the recipe"
    }},
    "image_suggestions": [
        "Suggestion 1 for what image to use",
        "Suggestion 2"
    ]
}}

**IMPORTANT RULES:**
1. Adapt language and style to the platform
2. Make it authentic and engaging, not salesy
3. Highlight what makes this recipe special
4. Use emojis naturally if requested
5. Include relevant trending hashtags when appropriate
6. Keep hashtags relevant to food, cooking, and the specific dish
7. Make the caption actionable - inspire people to cook it

Generate the content now:
"""


class BatchGenerateContentUseCase:
    """
    Use case for batch generating social media content from unprocessed recipes.
    """
    
    def __init__(self):
        self.llm = batch_content_generator_llm
        self.recipe_repo = RecipeRepository()
    
    async def generate_from_unprocessed_recipes(
        self,
        target_platforms: List[ContentPlatform],
        limit: int = None,
        tone: str = "engaging and friendly",
        include_emojis: bool = True,
        max_hashtags: int = 10
    ) -> Dict[str, Any]:
        """
        Generate content for all unprocessed recipes.
        
        Args:
            target_platforms: List of platforms to generate content for
            limit: Maximum number of recipes to process (None for all)
            tone: Tone of the content
            include_emojis: Whether to include emojis
            max_hashtags: Maximum number of hashtags
            
        Returns:
            Dictionary with batch processing results
        """
        logger.info(f"Starting batch content generation for unprocessed recipes (limit={limit})")
        
        # Fetch unprocessed recipes
        unprocessed_recipes = self.recipe_repo.fetch_unprocessed_recipes(limit=limit)
        
        if not unprocessed_recipes:
            logger.info("No unprocessed recipes found")
            return {
                "success": True,
                "message": "No unprocessed recipes to generate content for",
                "total_recipes": 0,
                "processed": 0,
                "successful": 0,
                "failed": 0,
                "results": []
            }
        
        logger.info(f"Found {len(unprocessed_recipes)} unprocessed recipes")
        
        # Process each recipe
        results = []
        successful_count = 0
        failed_count = 0
        
        for recipe_data in unprocessed_recipes:
            try:
                logger.info(f"Processing recipe {recipe_data['id']}: {recipe_data['title']}")
                
                # Generate content for this recipe
                generation_result = await self._generate_content_for_recipe(
                    recipe_data=recipe_data,
                    target_platforms=target_platforms,
                    tone=tone,
                    include_emojis=include_emojis,
                    max_hashtags=max_hashtags
                )
                
                # Mark recipe as processed
                self.recipe_repo.mark_content_generated(recipe_data['id'])
                
                results.append({
                    "recipe_id": recipe_data['id'],
                    "recipe_title": recipe_data['title'],
                    "success": True,
                    "generated_contents": generation_result['generated_contents']
                })
                
                successful_count += 1
                logger.info(f"✅ Successfully generated content for recipe {recipe_data['id']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to generate content for recipe {recipe_data['id']}: {e}")
                results.append({
                    "recipe_id": recipe_data['id'],
                    "recipe_title": recipe_data['title'],
                    "success": False,
                    "error": str(e)
                })
                failed_count += 1
        
        return {
            "success": successful_count > 0,
            "message": f"Processed {len(unprocessed_recipes)} recipes: {successful_count} successful, {failed_count} failed",
            "total_recipes": len(unprocessed_recipes),
            "processed": len(results),
            "successful": successful_count,
            "failed": failed_count,
            "results": results
        }
    
    async def _generate_content_for_recipe(
        self,
        recipe_data: Dict[str, Any],
        target_platforms: List[ContentPlatform],
        tone: str,
        include_emojis: bool,
        max_hashtags: int
    ) -> Dict[str, Any]:
        """Generate content for a single recipe across multiple platforms"""
        
        # Convert to ScrapedRecipeData format
        recipe = ScrapedRecipeData(
            title=recipe_data.get('title', 'Untitled Recipe'),
            description=recipe_data.get('notes', ''),
            url="",
            image_url=None,
            ingredients=recipe_data.get('parsed_ingredients', []),
            instructions=recipe_data.get('parsed_instructions', []),
            prep_time=str(recipe_data.get('prep_time', 'N/A')),
            cook_time=str(recipe_data.get('cook_time', 'N/A')),
            total_time=recipe_data.get('ready_time', 'N/A'),
            servings=str(recipe_data.get('servings', 'N/A')),
            cuisine=None,
            category=None,
            tags=[]
        )
        
        # Generate content for each platform
        generated_contents = []
        
        for platform in target_platforms:
            try:
                content = await self._generate_content_for_platform(
                    recipe=recipe,
                    platform=platform,
                    tone=tone,
                    include_emojis=include_emojis,
                    max_hashtags=max_hashtags
                )
                generated_contents.append({
                    "platform": platform.value,
                    "content": content
                })
            except Exception as e:
                logger.error(f"Failed to generate content for {platform.value}: {e}")
                generated_contents.append({
                    "platform": platform.value,
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
        max_hashtags: int
    ) -> GeneratedContentData:
        """Generate content for a specific platform using LLM"""
        
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
                "recipe_description": recipe.description or "Delicious homemade recipe",
                "recipe_ingredients": ingredients_str if ingredients_str else "Various ingredients",
                "recipe_instructions": instructions_str if instructions_str else "Follow recipe instructions",
                "prep_time": recipe.prep_time or "N/A",
                "cook_time": recipe.cook_time or "N/A",
                "servings": recipe.servings or "N/A",
                "platform": platform.value.upper(),
                "tone": tone,
                "include_emojis": "Yes" if include_emojis else "No",
                "max_hashtags": max_hashtags
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
        
        caption += "Try this recipe today! 👆"
        
        # Basic hashtags
        hashtags = ["recipe", "cooking", "food", "homemade", "delicious"]
        
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
