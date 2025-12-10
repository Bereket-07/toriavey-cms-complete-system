
import os
import sys
# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
sys.path.append(os.path.dirname(__file__))

from src.infrastructure.repository.wprm_recipe_repo import WPRMRecipeRepository

def debug_recipe_images():
    try:
        repo = WPRMRecipeRepository()
        # Fetch a few recipes
        result = repo.get_all_recipes(limit=5, offset=0)
        recipes = result.get('recipes', [])
        
        print(f"Found {len(recipes)} recipes.")
        for r in recipes:
            print(f"ID: {r['id']}")
            print(f"Title: {r['title']}")
            print(f"Image URL: '{r['image_url']}'")
            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Mock environment variables if needed
    debug_recipe_images()
