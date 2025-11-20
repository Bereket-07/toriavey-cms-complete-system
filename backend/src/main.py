from src.infrastructure.repository.recipe_repo import RecipeRepository
import json


repo = RecipeRepository()
print("Repository created ....")
data = repo.fetch_all()
print("All recipes fetched ....")
print(json.dumps(data, indent=2, ensure_ascii=False))
