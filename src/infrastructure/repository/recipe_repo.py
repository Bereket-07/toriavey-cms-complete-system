from src.infrastructure.repository.db_config import SessionLocal
from src.domain.models.recipe_model import Recipe
from src.utils.php_parser import parse_php_serialized
import json
import logging

logger = logging.getLogger(__name__)


class RecipeRepository:
    """Handles all recipe-related DB operations."""

    def __init__(self):
        self.db = SessionLocal()

    def fetch_all(self):
        """Fetch all recipes and parse their serialized data."""
        try:
            logger.info("Fetching all recipes from database...")
            recipes = self.db.query(Recipe).all()
            result = []
            for r in recipes:
                result.append(
                    {
                        "id": r.id,
                        "title": r.title,
                        "parsed_ingredients": parse_php_serialized(r.ingredients),
                        "parsed_instructions": parse_php_serialized(r.instructions),
                        "servings": r.servings,
                        "prep_time": r.prep_time,
                        "cook_time": r.cook_time,
                        "ready_time": r.ready_time,
                        "notes": r.notes,
                        "content_generated": getattr(r, 'content_generated', False),
                    }
                )
            logger.info(f"Fetched {len(result)} recipes")
            return result
        finally:
            self.db.close()

    def fetch_unprocessed_recipes(self, limit: int = None):
        """
        Fetch recipes that haven't had content generated yet.
        
        Args:
            limit: Maximum number of recipes to fetch (None for all)
            
        Returns:
            List of recipe dictionaries with content_generated=False
        """
        try:
            logger.info("Fetching unprocessed recipes (content_generated=False)...")
            query = self.db.query(Recipe).filter(Recipe.content_generated == False)
            
            if limit:
                query = query.limit(limit)
            
            recipes = query.all()
            result = []
            
            for r in recipes:
                result.append(
                    {
                        "id": r.id,
                        "title": r.title,
                        "parsed_ingredients": parse_php_serialized(r.ingredients),
                        "parsed_instructions": parse_php_serialized(r.instructions),
                        "servings": r.servings,
                        "prep_time": r.prep_time,
                        "cook_time": r.cook_time,
                        "ready_time": r.ready_time,
                        "notes": r.notes,
                        "content_generated": False,
                    }
                )
            
            logger.info(f"Found {len(result)} unprocessed recipes")
            return result
        finally:
            self.db.close()

    def fetch_by_id(self, recipe_id: int):
        """Fetch a single recipe by ID."""
        try:
            recipe = (
                self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
            )
            if recipe:
                return {
                    "id": recipe.id,
                    "title": recipe.title,
                    "parsed_ingredients": parse_php_serialized(recipe.ingredients),
                    "parsed_instructions": parse_php_serialized(recipe.instructions),
                    "servings": recipe.servings,
                    "prep_time": recipe.prep_time,
                    "cook_time": recipe.cook_time,
                    "ready_time": recipe.ready_time,
                    "notes": recipe.notes,
                    "content_generated": getattr(recipe, 'content_generated', False),
                }
            return None
        finally:
            self.db.close()

    def mark_content_generated(self, recipe_id: int):
        """
        Mark a recipe as having content generated.
        
        Args:
            recipe_id: ID of the recipe to mark
            
        Returns:
            True if successful, False otherwise
        """
        try:
            recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
            if recipe:
                recipe.content_generated = True
                self.db.commit()
                logger.info(f"Marked recipe {recipe_id} as content_generated=True")
                return True
            logger.warning(f"Recipe {recipe_id} not found")
            return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to mark recipe {recipe_id}: {e}")
            return False
        finally:
            self.db.close()

    def reset_content_generated(self, recipe_id: int):
        """
        Reset content_generated flag for a recipe (useful for regeneration).
        
        Args:
            recipe_id: ID of the recipe to reset
            
        Returns:
            True if successful, False otherwise
        """
        try:
            recipe = self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
            if recipe:
                recipe.content_generated = False
                self.db.commit()
                logger.info(f"Reset content_generated flag for recipe {recipe_id}")
                return True
            logger.warning(f"Recipe {recipe_id} not found")
            return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to reset recipe {recipe_id}: {e}")
            return False
        finally:
            self.db.close()

    def get_content_generation_stats(self):
        """
        Get statistics about content generation status.
        
        Returns:
            Dictionary with total, processed, and unprocessed counts
        """
        try:
            total = self.db.query(Recipe).count()
            processed = self.db.query(Recipe).filter(Recipe.content_generated == True).count()
            unprocessed = total - processed
            
            return {
                "total_recipes": total,
                "content_generated": processed,
                "pending_generation": unprocessed,
                "completion_percentage": round((processed / total * 100) if total > 0 else 0, 2)
            }
        finally:
            self.db.close()
