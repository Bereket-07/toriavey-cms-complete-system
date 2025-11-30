"""
WordPress Recipe Maker (WPRM) Recipe Repository
Handles fetching recipes from wp_tori_posts
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
import json

from src.infrastructure.repository.db_config import get_db
from src.domain.models.wprm_recipe_model import WPRMRecipe, WPRMPostMeta, WPRMRecipeImage

logger = logging.getLogger(__name__)


class WPRMRecipeRepository:
    """Repository for WordPress Recipe Maker recipes"""
    
    def __init__(self):
        self.db = get_db()
    
    def get_all_recipes(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Get all WPRM recipes (HIGHLY OPTIMIZED)
        
        Optimizations:
        1. Select specific columns only (Lightweight, no ORM overhead)
        2. Fetch only required metadata (No ingredients/instructions)
        3. Skip PHP serialization parsing (Huge CPU saving)
        4. Batch fetching for everything
        
        Args:
            limit: Maximum number of recipes to return
            offset: Number of recipes to skip
            
        Returns:
            Dictionary with total count and recipes
        """
        try:
            # Keys required for listing and basic display (NO ingredients/instructions)
            REQUIRED_META_KEYS = [
                '_thumbnail_id', 'recipe_description',
                # 'wprm_ingredients', 'wprm_instructions', # SKIPPED for list view
                'wprm_prep_time', 'wprm_cook_time', 'wprm_total_time',
                'wprm_servings', 'wprm_servings_unit',
                'wprm_notes',
                'wprm_rating_average', 'wprm_rating_count',
                'wprm_nutrition_calories', 'wprm_nutrition_protein',
                'wprm_nutrition_carbohydrates', 'wprm_nutrition_fat',
                'wprm_nutrition_fiber', 'wprm_nutrition_sugar'
            ]

            with self.db as db:
                # Get total count
                total_count = db.query(WPRMRecipe).filter(
                    WPRMRecipe.post_type == 'wprm_recipe',
                    WPRMRecipe.post_status == 'publish'
                ).count()
                
                # Get recipes with pagination - SELECT SPECIFIC COLUMNS ONLY
                # This avoids loading the full object and huge post_content
                recipes = db.query(
                    WPRMRecipe.ID,
                    WPRMRecipe.post_title,
                    WPRMRecipe.post_name,
                    WPRMRecipe.post_excerpt,
                    WPRMRecipe.post_status,
                    WPRMRecipe.post_date,
                    WPRMRecipe.post_modified,
                    WPRMRecipe.post_author
                ).filter(
                    WPRMRecipe.post_type == 'wprm_recipe',
                    WPRMRecipe.post_status == 'publish'
                ).order_by(WPRMRecipe.post_date.desc()).offset(offset).limit(limit).all()
                
                if not recipes:
                    return {
                        "total_count": total_count,
                        "limit": limit,
                        "offset": offset,
                        "returned": 0,
                        "recipes": []
                    }
                
                # OPTIMIZATION: Batch load ONLY required metadata
                recipe_ids = [recipe.ID for recipe in recipes]
                all_metadata = db.query(WPRMPostMeta).filter(
                    WPRMPostMeta.post_id.in_(recipe_ids),
                    WPRMPostMeta.meta_key.in_(REQUIRED_META_KEYS)
                ).all()
                
                # Group metadata by recipe ID
                metadata_by_recipe = {}
                for meta in all_metadata:
                    if meta.post_id not in metadata_by_recipe:
                        metadata_by_recipe[meta.post_id] = {}
                    metadata_by_recipe[meta.post_id][meta.meta_key] = meta.meta_value
                
                # OPTIMIZATION: Batch load all thumbnail IDs
                thumbnail_ids = []
                for recipe_id in recipe_ids:
                    meta_dict = metadata_by_recipe.get(recipe_id, {})
                    thumbnail_id = meta_dict.get('_thumbnail_id')
                    if thumbnail_id:
                        thumbnail_ids.append(int(thumbnail_id))
                
                # Get all image URLs in one query
                image_urls = {}
                if thumbnail_ids:
                    # Select specific columns for images too
                    images = db.query(WPRMRecipe.ID, WPRMRecipe.guid).filter(
                        WPRMRecipe.ID.in_(thumbnail_ids),
                        WPRMRecipe.post_type == 'attachment'
                    ).all()
                    for img in images:
                        image_urls[img.ID] = img.guid
                
                # Format recipes using lightweight logic
                formatted_recipes = []
                for recipe in recipes:
                    meta_dict = metadata_by_recipe.get(recipe.ID, {})
                    thumbnail_id = meta_dict.get('_thumbnail_id')
                    image_url = image_urls.get(int(thumbnail_id)) if thumbnail_id else None
                    
                    # Manual formatting to avoid parsing overhead
                    # We skip ingredients/instructions here
                    nutrition = {
                        "calories": meta_dict.get('wprm_nutrition_calories'),
                        "protein": meta_dict.get('wprm_nutrition_protein'),
                        "carbohydrates": meta_dict.get('wprm_nutrition_carbohydrates'),
                        "fat": meta_dict.get('wprm_nutrition_fat'),
                        "fiber": meta_dict.get('wprm_nutrition_fiber'),
                        "sugar": meta_dict.get('wprm_nutrition_sugar')
                    }
                    
                    recipe_data = {
                        "id": recipe.ID,
                        "title": recipe.post_title,
                        "slug": recipe.post_name,
                        "description": meta_dict.get('recipe_description', ''), # Use meta description
                        "excerpt": recipe.post_excerpt,
                        "status": recipe.post_status,
                        "date": str(recipe.post_date),
                        "modified": str(recipe.post_modified),
                        "author_id": recipe.post_author,
                        "image_url": image_url,
                        "thumbnail_id": thumbnail_id,
                        
                        # Empty lists for heavy fields
                        "ingredients": [],
                        "instructions": [],
                        
                        "prep_time": meta_dict.get('wprm_prep_time'),
                        "cook_time": meta_dict.get('wprm_cook_time'),
                        "total_time": meta_dict.get('wprm_total_time'),
                        "servings": meta_dict.get('wprm_servings'),
                        "servings_unit": meta_dict.get('wprm_servings_unit'),
                        "notes": meta_dict.get('wprm_notes', '').strip(),
                        "nutrition": nutrition,
                        "rating": meta_dict.get('wprm_rating_average'),
                        "rating_count": meta_dict.get('wprm_rating_count'),
                    }
                    formatted_recipes.append(recipe_data)
                
                return {
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                    "returned": len(formatted_recipes),
                    "recipes": formatted_recipes
                }
                
        except Exception as e:
            logger.error(f"Error fetching recipes: {e}")
            raise
    
    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a single recipe by ID
        
        Args:
            recipe_id: Recipe post ID
            
        Returns:
            Recipe data with metadata
        """
        try:
            with self.db as db:
                recipe = db.query(WPRMRecipe).filter(
                    WPRMRecipe.ID == recipe_id,
                    WPRMRecipe.post_type == 'wprm_recipe'
                ).first()
                
                if not recipe:
                    return None
                
                return self._get_recipe_with_metadata(db, recipe)
                
        except Exception as e:
            logger.error(f"Error fetching recipe {recipe_id}: {e}")
            raise

    def get_recipes_by_ids(self, recipe_ids: List[int]) -> List[Dict[str, Any]]:
        """
        Get multiple recipes by IDs (HIGHLY OPTIMIZED)
        
        Optimizations:
        1. Select specific columns only (Lightweight, no ORM overhead)
        2. Fetch only required metadata (No ingredients/instructions)
        3. Skip PHP serialization parsing (Huge CPU saving)
        
        Args:
            recipe_ids: List of recipe IDs
            
        Returns:
            List of recipe data dictionaries
        """
        if not recipe_ids:
            return []
            
        try:
            # Keys required for listing and basic display (NO ingredients/instructions)
            REQUIRED_META_KEYS = [
                '_thumbnail_id', 'recipe_description',
                # 'wprm_ingredients', 'wprm_instructions', # SKIPPED for list view
                'wprm_prep_time', 'wprm_cook_time', 'wprm_total_time',
                'wprm_servings', 'wprm_servings_unit',
                'wprm_notes',
                'wprm_rating_average', 'wprm_rating_count',
                'wprm_nutrition_calories', 'wprm_nutrition_protein',
                'wprm_nutrition_carbohydrates', 'wprm_nutrition_fat',
                'wprm_nutrition_fiber', 'wprm_nutrition_sugar'
            ]

            with self.db as db:
                # Get recipes - SELECT SPECIFIC COLUMNS ONLY
                recipes = db.query(
                    WPRMRecipe.ID,
                    WPRMRecipe.post_title,
                    WPRMRecipe.post_name,
                    WPRMRecipe.post_excerpt,
                    WPRMRecipe.post_status,
                    WPRMRecipe.post_date,
                    WPRMRecipe.post_modified,
                    WPRMRecipe.post_author
                ).filter(
                    WPRMRecipe.ID.in_(recipe_ids),
                    WPRMRecipe.post_type == 'wprm_recipe'
                ).all()
                
                if not recipes:
                    return []
                
                # OPTIMIZATION: Batch load ONLY required metadata
                found_ids = [recipe.ID for recipe in recipes]
                all_metadata = db.query(WPRMPostMeta).filter(
                    WPRMPostMeta.post_id.in_(found_ids),
                    WPRMPostMeta.meta_key.in_(REQUIRED_META_KEYS)
                ).all()
                
                # Group metadata by recipe ID
                metadata_by_recipe = {}
                for meta in all_metadata:
                    if meta.post_id not in metadata_by_recipe:
                        metadata_by_recipe[meta.post_id] = {}
                    metadata_by_recipe[meta.post_id][meta.meta_key] = meta.meta_value
                
                # OPTIMIZATION: Batch load all thumbnail IDs
                thumbnail_ids = []
                for recipe_id in found_ids:
                    meta_dict = metadata_by_recipe.get(recipe_id, {})
                    thumbnail_id = meta_dict.get('_thumbnail_id')
                    if thumbnail_id:
                        thumbnail_ids.append(int(thumbnail_id))
                
                # Get all image URLs in one query
                image_urls = {}
                if thumbnail_ids:
                    images = db.query(WPRMRecipe.ID, WPRMRecipe.guid).filter(
                        WPRMRecipe.ID.in_(thumbnail_ids),
                        WPRMRecipe.post_type == 'attachment'
                    ).all()
                    for img in images:
                        image_urls[img.ID] = img.guid
                
                # Format recipes using lightweight logic
                formatted_recipes = []
                for recipe in recipes:
                    meta_dict = metadata_by_recipe.get(recipe.ID, {})
                    thumbnail_id = meta_dict.get('_thumbnail_id')
                    image_url = image_urls.get(int(thumbnail_id)) if thumbnail_id else None
                    
                    # Manual formatting to avoid parsing overhead
                    nutrition = {
                        "calories": meta_dict.get('wprm_nutrition_calories'),
                        "protein": meta_dict.get('wprm_nutrition_protein'),
                        "carbohydrates": meta_dict.get('wprm_nutrition_carbohydrates'),
                        "fat": meta_dict.get('wprm_nutrition_fat'),
                        "fiber": meta_dict.get('wprm_nutrition_fiber'),
                        "sugar": meta_dict.get('wprm_nutrition_sugar')
                    }
                    
                    recipe_data = {
                        "id": recipe.ID,
                        "title": recipe.post_title,
                        "slug": recipe.post_name,
                        "description": meta_dict.get('recipe_description', ''),
                        "excerpt": recipe.post_excerpt,
                        "status": recipe.post_status,
                        "date": str(recipe.post_date),
                        "modified": str(recipe.post_modified),
                        "author_id": recipe.post_author,
                        "image_url": image_url,
                        "thumbnail_id": thumbnail_id,
                        
                        # Empty lists for heavy fields
                        "ingredients": [],
                        "instructions": [],
                        
                        "prep_time": meta_dict.get('wprm_prep_time'),
                        "cook_time": meta_dict.get('wprm_cook_time'),
                        "total_time": meta_dict.get('wprm_total_time'),
                        "servings": meta_dict.get('wprm_servings'),
                        "servings_unit": meta_dict.get('wprm_servings_unit'),
                        "notes": meta_dict.get('wprm_notes', '').strip(),
                        "nutrition": nutrition,
                        "rating": meta_dict.get('wprm_rating_average'),
                        "rating_count": meta_dict.get('wprm_rating_count'),
                    }
                    formatted_recipes.append(recipe_data)
                
                return formatted_recipes
                
        except Exception as e:
            logger.error(f"Error fetching recipes batch: {e}")
            raise
    
    def _format_recipe_data(self, recipe: WPRMRecipe, meta_dict: Dict[str, Any], image_url: Optional[str]) -> Dict[str, Any]:
        """
        Format recipe data using pre-loaded metadata (NO additional DB queries)
        
        Args:
            recipe: WPRMRecipe object
            meta_dict: Pre-loaded metadata dictionary
            image_url: Pre-loaded image URL
            
        Returns:
            Formatted recipe data
        """
        # Parse WPRM ingredients and instructions
        ingredients = self._parse_wprm_ingredients(meta_dict.get('wprm_ingredients', ''))
        instructions = self._parse_wprm_instructions(meta_dict.get('wprm_instructions', ''))
        
        # Get nutrition info
        nutrition = {
            "calories": meta_dict.get('wprm_nutrition_calories'),
            "protein": meta_dict.get('wprm_nutrition_protein'),
            "carbohydrates": meta_dict.get('wprm_nutrition_carbohydrates'),
            "fat": meta_dict.get('wprm_nutrition_fat'),
            "fiber": meta_dict.get('wprm_nutrition_fiber'),
            "sugar": meta_dict.get('wprm_nutrition_sugar')
        }
        
        return {
            "id": recipe.ID,
            "title": recipe.post_title,
            "slug": recipe.post_name,
            "description": recipe.post_content or meta_dict.get('recipe_description', ''),
            "excerpt": recipe.post_excerpt,
            "status": recipe.post_status,
            "date": str(recipe.post_date),
            "modified": str(recipe.post_modified),
            "author_id": recipe.post_author,
            "image_url": image_url,
            "thumbnail_id": meta_dict.get('_thumbnail_id'),
            
            # Parsed fields for LLM
            "ingredients": ingredients,
            "instructions": instructions,
            "prep_time": meta_dict.get('wprm_prep_time'),
            "cook_time": meta_dict.get('wprm_cook_time'),
            "total_time": meta_dict.get('wprm_total_time'),
            "servings": meta_dict.get('wprm_servings'),
            "servings_unit": meta_dict.get('wprm_servings_unit'),
            "notes": meta_dict.get('wprm_notes', '').strip(),
            "nutrition": nutrition,
            "rating": meta_dict.get('wprm_rating_average'),
            "rating_count": meta_dict.get('wprm_rating_count'),
            
            # For content generation (clean format)
            "for_llm": {
                "title": recipe.post_title,
                "description": recipe.post_content or meta_dict.get('recipe_description', ''),
                "ingredients": ingredients,
                "instructions": instructions,
                "prep_time_minutes": meta_dict.get('wprm_prep_time'),
                "cook_time_minutes": meta_dict.get('wprm_cook_time'),
                "total_time_minutes": meta_dict.get('wprm_total_time'),
                "servings": f"{meta_dict.get('wprm_servings', '')} {meta_dict.get('wprm_servings_unit', '')}".strip(),
                "notes": meta_dict.get('wprm_notes', '').strip(),
                "nutrition": nutrition,
                "image_url": image_url
            }
        }
    
    def _get_recipe_with_metadata(self, db: Session, recipe: WPRMRecipe) -> Dict[str, Any]:
        """
        Get recipe with all metadata
        
        Args:
            db: Database session
            recipe: WPRMRecipe object
            
        Returns:
            Complete recipe data
        """
        # Get all metadata for this recipe
        metadata = db.query(WPRMPostMeta).filter(
            WPRMPostMeta.post_id == recipe.ID
        ).all()
        
        # Parse metadata into dictionary
        meta_dict = {}
        for meta in metadata:
            meta_dict[meta.meta_key] = meta.meta_value
        
        # Parse WPRM ingredients and instructions
        ingredients = self._parse_wprm_ingredients(meta_dict.get('wprm_ingredients', ''))
        instructions = self._parse_wprm_instructions(meta_dict.get('wprm_instructions', ''))
        
        # Get featured image
        thumbnail_id = meta_dict.get('_thumbnail_id')
        image_url = self._get_image_url(db, thumbnail_id) if thumbnail_id else None
        
        # Get nutrition info
        nutrition = {
            "calories": meta_dict.get('wprm_nutrition_calories'),
            "protein": meta_dict.get('wprm_nutrition_protein'),
            "carbohydrates": meta_dict.get('wprm_nutrition_carbohydrates'),
            "fat": meta_dict.get('wprm_nutrition_fat'),
            "fiber": meta_dict.get('wprm_nutrition_fiber'),
            "sugar": meta_dict.get('wprm_nutrition_sugar')
        }
        
        return {
            "id": recipe.ID,
            "title": recipe.post_title,
            "slug": recipe.post_name,
            "description": recipe.post_content or meta_dict.get('recipe_description', ''),
            "excerpt": recipe.post_excerpt,
            "status": recipe.post_status,
            "date": str(recipe.post_date),
            "modified": str(recipe.post_modified),
            "author_id": recipe.post_author,
            "image_url": image_url,
            "thumbnail_id": thumbnail_id,
            
            # Parsed fields for LLM
            "ingredients": ingredients,
            "instructions": instructions,
            "prep_time": meta_dict.get('wprm_prep_time'),
            "cook_time": meta_dict.get('wprm_cook_time'),
            "total_time": meta_dict.get('wprm_total_time'),
            "servings": meta_dict.get('wprm_servings'),
            "servings_unit": meta_dict.get('wprm_servings_unit'),
            "notes": meta_dict.get('wprm_notes', '').strip(),
            "nutrition": nutrition,
            "rating": meta_dict.get('wprm_rating_average'),
            "rating_count": meta_dict.get('wprm_rating_count'),
            
            # For content generation (clean format)
            "for_llm": {
                "title": recipe.post_title,
                "description": recipe.post_content or meta_dict.get('recipe_description', ''),
                "ingredients": ingredients,
                "instructions": instructions,
                "prep_time_minutes": meta_dict.get('wprm_prep_time'),
                "cook_time_minutes": meta_dict.get('wprm_cook_time'),
                "total_time_minutes": meta_dict.get('wprm_total_time'),
                "servings": f"{meta_dict.get('wprm_servings', '')} {meta_dict.get('wprm_servings_unit', '')}".strip(),
                "notes": meta_dict.get('wprm_notes', '').strip(),
                "nutrition": nutrition,
                "image_url": image_url
            }
        }
    
    def _parse_wprm_ingredients(self, serialized_data: str) -> List[str]:
        """
        Parse WPRM ingredients from PHP serialized data
        
        Args:
            serialized_data: Serialized ingredients data
            
        Returns:
            List of ingredient strings
        """
        if not serialized_data:
            return []
        
        try:
            import phpserialize
            data = phpserialize.loads(serialized_data.encode('utf-8'))
            
            ingredients_list = []
            
            # Data is array of ingredient groups
            if isinstance(data, dict):
                for group in data.values():
                    if isinstance(group, dict) and b'ingredients' in group:
                        group_ingredients = group[b'ingredients']
                        if isinstance(group_ingredients, dict):
                            for ing in group_ingredients.values():
                                if isinstance(ing, dict):
                                    # Build ingredient string
                                    amount = ing.get(b'amount', b'').decode('utf-8') if isinstance(ing.get(b'amount'), bytes) else str(ing.get(b'amount', ''))
                                    unit = ing.get(b'unit', b'').decode('utf-8') if isinstance(ing.get(b'unit'), bytes) else str(ing.get(b'unit', ''))
                                    name = ing.get(b'name', b'').decode('utf-8') if isinstance(ing.get(b'name'), bytes) else str(ing.get(b'name', ''))
                                    notes = ing.get(b'notes', b'').decode('utf-8') if isinstance(ing.get(b'notes'), bytes) else str(ing.get(b'notes', ''))
                                    
                                    # Format: "amount unit name, notes"
                                    ing_str = f"{amount} {unit} {name}".strip()
                                    if notes:
                                        ing_str += f", {notes}"
                                    
                                    ingredients_list.append(ing_str)
            
            return ingredients_list
            
        except Exception as e:
            logger.warning(f"Failed to parse WPRM ingredients: {e}")
            return []
    
    def _parse_wprm_instructions(self, serialized_data: str) -> List[str]:
        """
        Parse WPRM instructions from PHP serialized data
        
        Args:
            serialized_data: Serialized instructions data
            
        Returns:
            List of instruction strings
        """
        if not serialized_data:
            return []
        
        try:
            import phpserialize
            data = phpserialize.loads(serialized_data.encode('utf-8'))
            
            instructions_list = []
            
            # Data is array of instruction groups
            if isinstance(data, dict):
                for group in data.values():
                    if isinstance(group, dict) and b'instructions' in group:
                        group_instructions = group[b'instructions']
                        if isinstance(group_instructions, dict):
                            for inst in group_instructions.values():
                                if isinstance(inst, dict):
                                    # Get instruction text
                                    text = inst.get(b'text', b'').decode('utf-8') if isinstance(inst.get(b'text'), bytes) else str(inst.get(b'text', ''))
                                    if text:
                                        # Clean up HTML and extra whitespace
                                        text = text.replace('\n', ' ').strip()
                                        instructions_list.append(text)
            
            return instructions_list
            
        except Exception as e:
            logger.warning(f"Failed to parse WPRM instructions: {e}")
            return []
    
    def _parse_wprm_recipe(self, serialized_data: str) -> Dict[str, Any]:
        """
        Parse WPRM recipe data (PHP serialized or JSON)
        
        Args:
            serialized_data: Serialized recipe data
            
        Returns:
            Parsed recipe data
        """
        if not serialized_data:
            return {}
        
        try:
            # Try JSON first
            if serialized_data.startswith('{'):
                return json.loads(serialized_data)
            
            # Try PHP unserialize
            import phpserialize
            data = phpserialize.loads(serialized_data.encode('utf-8'))
            
            # Convert bytes to strings
            def decode_dict(d):
                if isinstance(d, dict):
                    return {
                        k.decode('utf-8') if isinstance(k, bytes) else k: decode_dict(v)
                        for k, v in d.items()
                    }
                elif isinstance(d, list):
                    return [decode_dict(i) for i in d]
                elif isinstance(d, bytes):
                    return d.decode('utf-8')
                return d
            
            return decode_dict(data)
            
        except Exception as e:
            logger.warning(f"Failed to parse WPRM recipe data: {e}")
            return {}
    
    def _get_image_url(self, db: Session, attachment_id: str) -> Optional[str]:
        """
        Get image URL from attachment ID
        
        Args:
            db: Database session
            attachment_id: WordPress attachment ID
            
        Returns:
            Image URL or None
        """
        try:
            if not attachment_id:
                return None
            
            # Get attachment post
            attachment = db.query(WPRMRecipe).filter(
                WPRMRecipe.ID == int(attachment_id),
                WPRMRecipe.post_type == 'attachment'
            ).first()
            
            if attachment:
                return attachment.guid
            
            return None
            
        except Exception as e:
            logger.warning(f"Failed to get image URL: {e}")
            return None
    
    def search_recipes(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search recipes by title
        
        Args:
            query: Search query
            limit: Maximum results
            
        Returns:
            List of matching recipes
        """
        try:
            with self.db as db:
                recipes = db.query(WPRMRecipe).filter(
                    WPRMRecipe.post_type == 'wprm_recipe',
                    WPRMRecipe.post_status == 'publish',
                    WPRMRecipe.post_title.like(f'%{query}%')
                ).limit(limit).all()
                
                return [self._get_recipe_with_metadata(db, r) for r in recipes]
                
        except Exception as e:
            logger.error(f"Error searching recipes: {e}")
            raise
    
    def get_recipe_count(self) -> int:
        """Get total count of published recipes"""
        try:
            with self.db as db:
                return db.query(WPRMRecipe).filter(
                    WPRMRecipe.post_type == 'wprm_recipe',
                    WPRMRecipe.post_status == 'publish'
                ).count()
        except Exception as e:
            logger.error(f"Error getting recipe count: {e}")
            raise
