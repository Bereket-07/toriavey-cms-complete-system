# Content Generation API - Usage Guide (Database-Driven)

## Overview

The content generation feature now works with **recipe data from your database** instead of scraping URLs. You pass the recipe information directly, and the LLM generates platform-optimized social media content.

---

## 🚀 Quick Example

### Generate Content from Database Recipe

```bash
curl -X POST "http://localhost:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_id": 123,
    "recipe_data": {
      "title": "Classic Chocolate Chip Cookies",
      "description": "The best chocolate chip cookies with crispy edges and chewy centers. A family favorite!",
      "ingredients": [
        "2 cups all-purpose flour",
        "1 cup unsalted butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup brown sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "1 tsp baking soda",
        "1 tsp salt",
        "2 cups chocolate chips"
      ],
      "instructions": [
        "Preheat oven to 350°F (175°C)",
        "Cream together butter and sugars until fluffy",
        "Beat in eggs and vanilla",
        "Mix in flour, baking soda, and salt",
        "Fold in chocolate chips",
        "Drop spoonfuls onto baking sheet",
        "Bake for 10-12 minutes until golden"
      ],
      "prep_time": "15 minutes",
      "cook_time": "12 minutes",
      "servings": "24 cookies",
      "cuisine": "American",
      "category": "Dessert",
      "tags": ["cookies", "dessert", "chocolate", "baking"],
      "image_url": "https://yourdomain.com/images/cookies.jpg",
      "url": "https://yourdomain.com/recipes/chocolate-chip-cookies"
    },
    "target_platforms": ["instagram", "twitter", "threads"],
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 10,
    "custom_instructions": "Emphasize the family-friendly aspect and nostalgia"
  }'
```

---

## 📊 Integration with Your Database

### Example: Fetch Recipe from Database and Generate Content

```python
import httpx
from your_database import get_recipe_by_id  # Your database function

async def generate_content_for_recipe(recipe_id: int):
    # 1. Fetch recipe from your database
    recipe = await get_recipe_by_id(recipe_id)
    
    # 2. Prepare request
    request_data = {
        "recipe_id": recipe.id,
        "recipe_data": {
            "title": recipe.title,
            "description": recipe.description,
            "ingredients": recipe.ingredients,  # Assuming this is a list
            "instructions": recipe.instructions,  # Assuming this is a list
            "prep_time": recipe.prep_time,
            "cook_time": recipe.cook_time,
            "servings": recipe.servings,
            "cuisine": recipe.cuisine,
            "category": recipe.category,
            "tags": recipe.tags,
            "image_url": recipe.image_url,
            "url": recipe.url
        },
        "target_platforms": ["instagram", "twitter", "threads"],
        "tone": "engaging and friendly",
        "include_emojis": True,
        "max_hashtags": 10
    }
    
    # 3. Call content generation API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/content/generate",
            json=request_data
        )
        return response.json()

# Usage
result = await generate_content_for_recipe(123)
print(result)
```

---

## 🔄 Workflow Integration

### 1. User Selects Recipe from Your CMS

```javascript
// Frontend: User selects a recipe
const selectedRecipe = {
  id: 123,
  title: "Chocolate Chip Cookies",
  // ... other fields from your database
};

// Fetch full recipe data
const recipe = await fetch(`/api/recipes/${selectedRecipe.id}`).then(r => r.json());

// Generate social media content
const contentGeneration = await fetch('http://localhost:8000/api/content/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipe_id: recipe.id,
    recipe_data: {
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      category: recipe.category,
      tags: recipe.tags,
      image_url: recipe.image_url,
      url: recipe.url
    },
    target_platforms: ['instagram', 'twitter', 'threads'],
    tone: 'warm and inviting',
    include_emojis: true,
    max_hashtags: 10
  })
});

console.log('Generated content:', await contentGeneration.json());
```

---

## 📝 Recipe Data Format

### Required Fields

```typescript
interface RecipeDataInput {
  title: string;  // REQUIRED
  
  // Optional but recommended
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prep_time?: string;
  cook_time?: string;
  servings?: string;
  cuisine?: string;
  category?: string;
  tags?: string[];
  image_url?: string;
  url?: string;
  total_time?: string;
}
```

### Minimal Example

```json
{
  "recipe_data": {
    "title": "Quick Pasta",
    "ingredients": ["pasta", "tomato sauce", "cheese"],
    "instructions": ["Boil pasta", "Add sauce", "Top with cheese"]
  },
  "target_platforms": ["instagram"]
}
```

### Full Example

```json
{
  "recipe_id": 456,
  "recipe_data": {
    "title": "Mediterranean Quinoa Bowl",
    "description": "A healthy and delicious quinoa bowl packed with Mediterranean flavors",
    "url": "https://yourdomain.com/recipes/mediterranean-quinoa-bowl",
    "image_url": "https://yourdomain.com/images/quinoa-bowl.jpg",
    "ingredients": [
      "1 cup quinoa",
      "2 cups vegetable broth",
      "1 cucumber, diced",
      "1 cup cherry tomatoes, halved",
      "1/2 red onion, diced",
      "1/2 cup kalamata olives",
      "1/2 cup feta cheese",
      "1/4 cup olive oil",
      "2 tbsp lemon juice",
      "Fresh herbs (parsley, mint)"
    ],
    "instructions": [
      "Cook quinoa in vegetable broth according to package directions",
      "Let quinoa cool to room temperature",
      "Dice cucumber, tomatoes, and red onion",
      "Combine quinoa with vegetables in a large bowl",
      "Add olives and feta cheese",
      "Whisk together olive oil and lemon juice",
      "Pour dressing over quinoa mixture",
      "Toss gently and garnish with fresh herbs",
      "Serve chilled or at room temperature"
    ],
    "prep_time": "15 minutes",
    "cook_time": "20 minutes",
    "total_time": "35 minutes",
    "servings": "4 servings",
    "cuisine": "Mediterranean",
    "category": "Main Course",
    "tags": ["healthy", "vegetarian", "quinoa", "mediterranean", "lunch", "meal-prep"]
  },
  "target_platforms": ["instagram", "pinterest", "facebook"],
  "tone": "health-conscious and inspiring",
  "include_emojis": true,
  "max_hashtags": 12,
  "custom_instructions": "Focus on the health benefits and meal-prep potential"
}
```

---

## 🎯 Platform-Specific Content

The LLM automatically generates optimized content for each platform:

### Instagram Example Output
```json
{
  "caption": "🥗 Mediterranean Quinoa Bowl - Your New Favorite Meal Prep!\n\nPacked with protein, fiber, and fresh veggies, this colorful bowl is as nutritious as it is delicious! Perfect for meal prep Sunday 🌿\n\n✨ Ready in 35 minutes\n✨ Vegetarian & gluten-free\n✨ Stays fresh for 4 days\n\nSave this recipe and tag us when you make it! 👇",
  "hashtags": ["mediterraneanfood", "quinoabowl", "healthyeating", "mealprep", "vegetarian", "cleaneating", "healthylunch", "foodie", "plantbased", "nutrition"],
  "platform_specific": {
    "hook": "🥗 Mediterranean Quinoa Bowl - Your New Favorite Meal Prep!",
    "cta": "Save this recipe and tag us when you make it!",
    "key_highlight": "Perfect for meal prep, ready in 35 minutes"
  }
}
```

### Twitter Example Output
```json
{
  "caption": "🥗 Mediterranean Quinoa Bowl = the perfect healthy lunch!\n\nQuinoa + fresh veggies + feta + herbs = 😋\n\nReady in 35 min | Meal prep friendly | Vegetarian\n\nWho's making this today?",
  "hashtags": ["healthyeating", "quinoa", "mealprep"],
  "platform_specific": {
    "hook": "Mediterranean Quinoa Bowl = the perfect healthy lunch!",
    "cta": "Who's making this today?",
    "key_highlight": "Quick, healthy, and delicious"
  }
}
```

---

## 🔄 Batch Generation

Generate content for multiple recipes at once:

```bash
curl -X POST "http://localhost:8000/api/content/generate-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_ids": [123, 456, 789],
    "target_platforms": ["instagram", "twitter"],
    "batch_name": "Weekly Recipe Posts - November",
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

**Note:** For batch generation, you'll need to implement the database fetching logic to retrieve recipes by their IDs.

---

## 🛠️ Implementation Notes

### What You Need to Implement

1. **Database Integration**: Fetch recipe data from your database
2. **Recipe ID Mapping**: Link generated content back to recipe IDs
3. **Content Storage**: Save generated content to your database
4. **Batch Processing**: Implement background job processing for batches

### Example Database Integration

```python
# In your controller or service layer

from your_database import RecipeRepository

async def generate_content_endpoint(recipe_id: int, platforms: List[str]):
    # 1. Fetch recipe from database
    recipe_repo = RecipeRepository()
    recipe = await recipe_repo.get_by_id(recipe_id)
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # 2. Convert to API format
    recipe_data = {
        "title": recipe.title,
        "description": recipe.description,
        "ingredients": recipe.ingredients,
        "instructions": recipe.instructions,
        # ... map all fields
    }
    
    # 3. Call content generation
    use_case = GenerateContentUseCase()
    result = await use_case.generate_from_recipe_data(
        recipe_data=recipe_data,
        target_platforms=platforms
    )
    
    # 4. Save generated content to database
    for content in result["generated_contents"]:
        await save_generated_content(
            recipe_id=recipe_id,
            platform=content["platform"],
            caption=content["content"]["caption"],
            hashtags=content["content"]["hashtags"]
        )
    
    return result
```

---

## ✅ Testing

### Test with Minimal Data

```bash
curl -X POST "http://localhost:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Test Recipe"
    },
    "target_platforms": ["instagram"]
  }'
```

### Test with Full Data

See the full example above in the "Recipe Data Format" section.

---

## 🎨 Customization Options

### Tone Examples
- `"warm and inviting"`
- `"professional and educational"`
- `"fun and playful"`
- `"health-conscious and inspiring"`
- `"casual and conversational"`

### Custom Instructions Examples
- `"Emphasize the family-friendly aspect"`
- `"Focus on health benefits and nutritional value"`
- `"Highlight the quick preparation time"`
- `"Mention it's perfect for meal prep"`
- `"Target busy parents"`

---

## 📚 Next Steps

1. ✅ Integrate with your recipe database
2. ✅ Test with sample recipes
3. ✅ Implement content storage
4. ✅ Build review/approval workflow
5. ✅ Connect to social media posting

Happy content generating! 🎉
