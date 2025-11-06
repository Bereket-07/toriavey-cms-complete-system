"""
WPRM Content Generation Use Case
Generates social media content for WPRM recipes using LLM
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from src.config import GOOGLE_API_KEY
from src.infrastructure.repository.wprm_recipe_repo import WPRMRecipeRepository
from src.infrastructure.repository.wprm_content_status_repo import WPRMContentStatusRepository

logger = logging.getLogger(__name__)


class GenerateWPRMContentUseCase:
    """Generate social media content for WPRM recipes"""
    
    def __init__(self):
        self.recipe_repo = WPRMRecipeRepository()
        self.status_repo = WPRMContentStatusRepository()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7
        )
    
    def generate_for_single_recipe(
        self, 
        recipe_id: int, 
        platforms: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content for a single recipe
        
        Args:
            recipe_id: Recipe post ID
            platforms: List of platforms (default: all)
            
        Returns:
            Generated content for all platforms
        """
        try:
            # Default platforms
            if platforms is None:
                platforms = ["instagram", "tiktok", "facebook", "twitter", "pinterest"]
            
            # Get recipe
            recipe = self.recipe_repo.get_recipe_by_id(recipe_id)
            if not recipe:
                raise ValueError(f"Recipe {recipe_id} not found")
            
            # Check if already generated
            status = self.status_repo.get_status_by_recipe_id(recipe_id)
            if status and status.status == 'generated':
                logger.warning(f"Recipe {recipe_id} already has generated content")
            
            # Generate content for each platform
            recipe_data = recipe['for_llm']
            generated_content = {}
            
            for platform in platforms:
                try:
                    content = self._generate_platform_content(recipe_data, platform)
                    generated_content[platform] = content
                except Exception as e:
                    logger.error(f"Failed to generate {platform} content for recipe {recipe_id}: {e}")
                    generated_content[platform] = {
                        "error": str(e),
                        "status": "failed"
                    }
            
            # Mark as generated
            self.status_repo.mark_as_generated(recipe_id, generated_content)
            
            return {
                "success": True,
                "recipe_id": recipe_id,
                "recipe_title": recipe['title'],
                "platforms": platforms,
                "generated_content": generated_content,
                "generation_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate content for recipe {recipe_id}: {e}")
            self.status_repo.mark_as_failed(recipe_id, str(e))
            raise
    
    def generate_batch(
        self, 
        limit: int = 10, 
        platforms: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content for multiple recipes
        
        Args:
            limit: Maximum number of recipes to process
            platforms: List of platforms
            
        Returns:
            Batch generation results
        """
        try:
            # Get recipes needing generation
            statuses = self.status_repo.get_not_generated_recipes(limit=limit)
            
            results = []
            successful = 0
            failed = 0
            
            for status_obj in statuses:
                try:
                    result = self.generate_for_single_recipe(
                        status_obj.recipe_id, 
                        platforms
                    )
                    results.append(result)
                    successful += 1
                except Exception as e:
                    logger.error(f"Failed to generate content for recipe {status_obj.recipe_id}: {e}")
                    results.append({
                        "success": False,
                        "recipe_id": status_obj.recipe_id,
                        "error": str(e)
                    })
                    failed += 1
            
            return {
                "success": True,
                "total_processed": len(results),
                "successful": successful,
                "failed": failed,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Batch generation failed: {e}")
            raise
    
    def _generate_platform_content(
        self, 
        recipe_data: Dict[str, Any], 
        platform: str
    ) -> Dict[str, Any]:
        """
        Generate content for a specific platform
        
        Args:
            recipe_data: Recipe data from for_llm
            platform: Platform name
            
        Returns:
            Generated content for the platform
        """
        # Build prompt based on platform
        prompt_text = self._build_prompt(recipe_data, platform)
        
        # Generate with LLM using invoke
        try:
            logger.info(f"Generating content for {platform}...")
            response = self.llm.invoke(prompt_text)
            
            # Extract content from response
            if hasattr(response, 'content'):
                content_text = response.content
            elif isinstance(response, dict) and 'content' in response:
                content_text = response['content']
            else:
                content_text = str(response)
            
            logger.info(f"LLM response for {platform}: {content_text[:200]}...")
            
        except Exception as e:
            logger.error(f"LLM invocation failed for {platform}: {e}", exc_info=True)
            # Return fallback content
            return self._generate_fallback_content(recipe_data, platform)
        
        # Parse response
        content = self._parse_llm_response(content_text, platform)
        
        return content
    
    def _build_prompt(self, recipe_data: Dict[str, Any], platform: str) -> str:
        """Build platform-specific prompt"""
        
        # Extract recipe info
        title = recipe_data.get('title', '')
        description = recipe_data.get('description', '')
        ingredients = recipe_data.get('ingredients', [])
        prep_time = recipe_data.get('prep_time_minutes', '')
        cook_time = recipe_data.get('cook_time_minutes', '')
        servings = recipe_data.get('servings', '')
        
        # Platform-specific prompts
        platform_prompts = {
            "instagram": f"""
Create an engaging Instagram caption for this recipe:

Recipe: {title}
Description: {description}
Prep Time: {prep_time} minutes
Cook Time: {cook_time} minutes
Servings: {servings}

Key Ingredients: {', '.join(ingredients[:5])}

Generate a caption with:
1. An attention-grabbing hook (1-2 sentences)
2. Brief description highlighting what makes this recipe special
3. A call-to-action
4. 15-20 relevant hashtags

Format as JSON:
{{
    "caption": "Full caption text here",
    "hashtags": ["hashtag1", "hashtag2", ...],
    "hook": "Opening hook",
    "cta": "Call to action"
}}
""",
            
            "tiktok": f"""
Create a TikTok video caption for this recipe:

Recipe: {title}
Description: {description}
Prep Time: {prep_time} minutes

Generate a short, catchy caption with:
1. Attention-grabbing opening (max 10 words)
2. Quick recipe highlight
3. Trending hashtags (10-15)

Format as JSON:
{{
    "caption": "Full caption text",
    "hashtags": ["hashtag1", "hashtag2", ...],
    "hook": "Opening hook"
}}
""",
            
            "facebook": f"""
Create a Facebook post for this recipe:

Recipe: {title}
Description: {description}
Prep Time: {prep_time} minutes
Cook Time: {cook_time} minutes
Servings: {servings}

Generate a post with:
1. Engaging introduction
2. Recipe highlights
3. Why people will love it
4. Call-to-action
5. 5-10 hashtags

Format as JSON:
{{
    "post": "Full post text",
    "hashtags": ["hashtag1", "hashtag2", ...],
    "cta": "Call to action"
}}
""",
            
            "twitter": f"""
Create a Twitter/X post for this recipe:

Recipe: {title}
Description: {description}

Generate a concise tweet (max 280 characters) with:
1. Catchy opening
2. Key recipe highlight
3. 3-5 hashtags

Format as JSON:
{{
    "tweet": "Full tweet text",
    "hashtags": ["hashtag1", "hashtag2", ...]
}}
""",
            
            "pinterest": f"""
Create a Pinterest pin description for this recipe:

Recipe: {title}
Description: {description}
Prep Time: {prep_time} minutes
Cook Time: {cook_time} minutes

Generate a description with:
1. SEO-friendly title
2. Detailed description
3. Key benefits
4. 10-15 relevant keywords/hashtags

Format as JSON:
{{
    "title": "Pin title",
    "description": "Full description",
    "keywords": ["keyword1", "keyword2", ...]
}}
"""
        }
        
        return platform_prompts.get(platform, platform_prompts["instagram"])
    
    def _parse_llm_response(self, response: str, platform: str) -> Dict[str, Any]:
        """Parse LLM response into structured content"""
        try:
            # Try to parse as JSON
            if '{' in response and '}' in response:
                # Extract JSON from response
                start = response.find('{')
                end = response.rfind('}') + 1
                json_str = response[start:end]
                content = json.loads(json_str)
                content['parsed'] = True
                return content
            else:
                # Fallback: return as plain text
                logger.warning(f"No JSON found in response for {platform}, using fallback")
                return self._generate_fallback_content({}, platform)
        except Exception as e:
            logger.warning(f"Failed to parse LLM response as JSON for {platform}: {e}")
            return self._generate_fallback_content({}, platform)
    
    def _generate_fallback_content(self, recipe_data: Dict[str, Any], platform: str) -> Dict[str, Any]:
        """Generate basic fallback content if LLM fails or returns empty"""
        
        title = recipe_data.get('title', 'Delicious Recipe')
        description = recipe_data.get('description', '')
        
        # Remove HTML tags from description
        import re
        clean_desc = re.sub('<[^<]+?>', '', description) if description else ''
        
        fallback_content = {
            "instagram": {
                "caption": f"🍽️ {title}\n\n{clean_desc[:150]}...\n\nTry this amazing recipe today! 👨‍🍳",
                "hashtags": ["recipe", "cooking", "food", "homemade", "delicious", "foodie"],
                "hook": f"Try this amazing {title}!",
                "cta": "Save this recipe for later! ❤️"
            },
            "tiktok": {
                "caption": f"Easy {title} recipe! 🔥 {clean_desc[:80]}...",
                "hashtags": ["recipe", "cooking", "food", "easyrecipe", "foodtok"],
                "hook": f"Make this {title}!"
            },
            "facebook": {
                "post": f"{title}\n\n{clean_desc[:200]}...\n\nClick the link to get the full recipe!",
                "hashtags": ["recipe", "cooking", "food", "homemade"],
                "cta": "Try this recipe today!"
            },
            "twitter": {
                "tweet": f"🍽️ {title} - {clean_desc[:100]}... #recipe #cooking #food",
                "hashtags": ["recipe", "cooking", "food"]
            },
            "pinterest": {
                "title": f"How to Make {title}",
                "description": f"{clean_desc[:300]}... Get the full recipe with ingredients and instructions!",
                "keywords": ["recipe", "cooking", "food", "homemade", title.lower()]
            }
        }
        
        content = fallback_content.get(platform, {
            "content": f"{title}\n\n{clean_desc[:200]}...",
            "hashtags": ["recipe", "cooking", "food"]
        })
        
        content['parsed'] = False
        content['fallback'] = True
        
        return content
