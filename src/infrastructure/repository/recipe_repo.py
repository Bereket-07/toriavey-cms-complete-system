from src.infrastructure.repository.db_config import SessionLocal
from src.domain.models.recipe_model import Recipe
from src.utils.php_parser import parse_php_serialized
import json


class RecipeRepository:
    """Handles all recipe-related DB operations."""

    def __init__(self):
        self.db = SessionLocal()

    def fetch_all(self):
        """Fetch all recipes and parse their serialized data."""
        try:
            print("Fetching all the data from DB ....")
            recipes = self.db.query(Recipe).all()
            result = []
            for r in recipes:
                print("Recipe fetched ....")
                #print(json.dumps(r.__dict__, indent=2, ensure_ascii=False))
                result.append(
                    {
                        "id": r.id,
                        "title": r.title,
                        "parsed_ingredients": parse_php_serialized(r.ingredients),
                        "servings": r.servings,
                        "prep_time": r.prep_time,
                        "cook_time": r.cook_time,
                        "ready_time": r.ready_time,
                    }
                )
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
                    "parsed_data": parse_php_serialized(recipe.serialized_data),
                }
            return None
        finally:
            self.db.close()
