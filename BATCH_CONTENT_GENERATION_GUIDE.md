# Batch Content Generation from Recipes - Usage Guide

## Overview

This system automatically generates social media content from recipes in your database. It tracks which recipes have already had content generated using a `content_generated` boolean flag, ensuring you don't regenerate content for the same recipe twice.

---

## 🚀 Quick Start

### Step 1: Run Database Migration

First, add the `content_generated` column to your recipes table:

```bash
python scripts/add_content_generated_column.py
```

This will:
- Add a `content_generated` BOOLEAN column to `wp_tori_rp_recipes` table
- Set default value to `FALSE` for all existing recipes
- Skip if the column already exists

### Step 2: Check Generation Statistics

Before generating content, check how many recipes need processing:

```bash
GET http://localhost:8000/api/content/generation-stats
```

**Response:**
```json
{
  "total_recipes": 150,
  "content_generated": 0,
  "pending_generation": 150,
  "completion_percentage": 0.0
}
```

### Step 3: Generate Content for Unprocessed Recipes

```bash
POST http://localhost:8000/api/content/generate-from-unprocessed
Content-Type: application/json

{
  "target_platforms": ["instagram", "twitter", "facebook"],
  "limit": 10,
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

## 📋 API Endpoints

### 1. Generate Content from Unprocessed Recipes

**Endpoint:** `POST /api/content/generate-from-unprocessed`

**Description:** Automatically fetches recipes with `content_generated=False` and generates social media content for them.

**Request Body:**
```json
{
  "target_platforms": ["instagram", "twitter", "facebook"],
  "limit": 10,
  "tone": "engaging and friendly",
  "include_emojis": true,
  "max_hashtags": 10
}
```

**Parameters:**
- `target_platforms` (required): List of platforms - `["instagram", "twitter", "threads", "facebook", "linkedin", "pinterest"]`
- `limit` (optional): Maximum number of recipes to process. If not specified, processes all unprocessed recipes
- `tone` (optional): Tone of content. Default: `"engaging and friendly"`
- `include_emojis` (optional): Include emojis in captions. Default: `true`
- `max_hashtags` (optional): Maximum hashtags per post. Default: `10`

**Response:**
```json
{
  "success": true,
  "message": "Processed 10 recipes: 9 successful, 1 failed",
  "total_recipes": 10,
  "processed": 10,
  "successful": 9,
  "failed": 1,
  "results": [
    {
      "recipe_id": 123,
      "recipe_title": "Classic Chocolate Chip Cookies",
      "success": true,
      "generated_contents": [
        {
          "platform": "instagram",
          "content": {
            "caption": "🍪 Craving the perfect chocolate chip cookie?...",
            "hashtags": ["cookies", "baking", "homemade"],
            "platform_specific": {...}
          }
        }
      ]
    }
  ]
}
```

### 2. Get Content Generation Statistics

**Endpoint:** `GET /api/content/generation-stats`

**Description:** Get statistics about content generation progress.

**Response:**
```json
{
  "total_recipes": 150,
  "content_generated": 100,
  "pending_generation": 50,
  "completion_percentage": 66.67
}
```

---

## 🔄 Workflow

### Automatic Processing Flow

```
1. Fetch unprocessed recipes (content_generated=False)
   ↓
2. For each recipe:
   ↓
3. Generate content for each platform (Instagram, Twitter, etc.)
   ↓
4. If successful → Mark recipe as content_generated=True
   ↓
5. If failed → Log error, continue to next recipe
   ↓
6. Return summary of batch processing
```

### What Happens During Generation

For each recipe, the system:
1. **Parses** PHP-serialized ingredients and instructions
2. **Formats** recipe data for LLM processing
3. **Generates** platform-optimized content using Google Gemini
4. **Creates** engaging captions with hashtags
5. **Marks** recipe as processed (`content_generated=True`)

---

## 💡 Usage Examples

### Example 1: Process First 5 Unprocessed Recipes

```bash
curl -X POST "http://localhost:8000/api/content/generate-from-unprocessed" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter"],
    "limit": 5,
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 8
  }'
```

### Example 2: Process All Unprocessed Recipes

```bash
curl -X POST "http://localhost:8000/api/content/generate-from-unprocessed" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "facebook", "pinterest"],
    "tone": "professional and informative",
    "include_emojis": false,
    "max_hashtags": 5
  }'
```

### Example 3: Check Progress

```bash
curl -X GET "http://localhost:8000/api/content/generation-stats"
```

---

## 🛠️ Repository Methods

The `RecipeRepository` class now includes these methods:

### `fetch_unprocessed_recipes(limit=None)`
Fetches recipes with `content_generated=False`.

```python
from src.infrastructure.repository.recipe_repo import RecipeRepository

repo = RecipeRepository()
unprocessed = repo.fetch_unprocessed_recipes(limit=10)
```

### `mark_content_generated(recipe_id)`
Marks a recipe as having content generated.

```python
repo.mark_content_generated(recipe_id=123)
```

### `reset_content_generated(recipe_id)`
Resets the flag (useful for regeneration).

```python
repo.reset_content_generated(recipe_id=123)
```

### `get_content_generation_stats()`
Gets statistics about generation progress.

```python
stats = repo.get_content_generation_stats()
# Returns: {total_recipes, content_generated, pending_generation, completion_percentage}
```

---

## 🎯 Platform-Specific Content

The system generates optimized content for each platform:

### Instagram
- 150-300 character captions
- Engaging hook in first line
- 5-10 relevant hashtags
- Call-to-action (save, share, try)
- Emojis to break up text

### Twitter/X
- Under 280 characters
- Punchy and attention-grabbing
- 2-3 hashtags max
- Question or CTA for engagement

### Facebook
- 300-500 character captions
- Story-driven, personal touch
- 3-5 hashtags
- Questions to drive comments

### LinkedIn
- Professional yet approachable
- Focus on health benefits, cooking tips
- 2-3 professional hashtags
- Educational angle

### Pinterest
- SEO-focused descriptions
- Key ingredients and benefits
- 5-8 descriptive hashtags
- Clear recipe type in first line

### Threads
- Conversational tone
- 1-3 short paragraphs
- 3-5 hashtags
- Encourages discussion

---

## 🔍 Troubleshooting

### Issue: Column doesn't exist error

**Solution:** Run the migration script:
```bash
python scripts/add_content_generated_column.py
```

### Issue: No unprocessed recipes found

**Check:** Run the stats endpoint to verify:
```bash
curl http://localhost:8000/api/content/generation-stats
```

If `pending_generation` is 0, all recipes have been processed.

### Issue: LLM generation fails

**Fallback:** The system automatically generates basic template content if LLM fails.

**Check:** Verify your `GOOGLE_API_KEY` is set in `.env` file.

### Issue: Want to regenerate content for a recipe

**Solution:** Reset the flag first:
```python
from src.infrastructure.repository.recipe_repo import RecipeRepository

repo = RecipeRepository()
repo.reset_content_generated(recipe_id=123)
```

Then run the batch generation again.

---

## 📊 Monitoring Progress

### Check Stats Regularly

```bash
# Before starting
GET /api/content/generation-stats
# Returns: pending_generation: 150

# After processing 50 recipes
GET /api/content/generation-stats
# Returns: pending_generation: 100, completion_percentage: 33.33

# After completion
GET /api/content/generation-stats
# Returns: pending_generation: 0, completion_percentage: 100.0
```

---

## 🎨 Customization

### Change Content Tone

Available tones:
- `"engaging and friendly"` (default)
- `"warm and inviting"`
- `"professional and informative"`
- `"casual and fun"`
- `"elegant and sophisticated"`

### Adjust Hashtag Count

```json
{
  "max_hashtags": 5  // For minimal hashtags
}
```

```json
{
  "max_hashtags": 15  // For maximum reach
}
```

### Disable Emojis

```json
{
  "include_emojis": false
}
```

---

## 🚦 Best Practices

1. **Start Small**: Process 5-10 recipes first to test the output quality
2. **Check Stats**: Monitor progress using the stats endpoint
3. **Review Content**: Check generated content before posting to social media
4. **Batch Processing**: Process recipes in batches of 10-20 for better control
5. **Error Handling**: The system continues processing even if some recipes fail
6. **Rate Limiting**: Be mindful of LLM API rate limits when processing large batches

---

## 📝 Database Schema

The `content_generated` column was added to the `wp_tori_rp_recipes` table:

```sql
ALTER TABLE wp_tori_rp_recipes 
ADD COLUMN content_generated BOOLEAN NOT NULL DEFAULT FALSE
```

**Column Details:**
- **Type:** BOOLEAN
- **Default:** FALSE
- **Nullable:** NO
- **Purpose:** Track which recipes have had content generated

---

## 🔗 Related Endpoints

- `POST /api/content/generate` - Generate content from specific recipe data
- `POST /api/content/generate-batch` - Generate content from recipe IDs
- `GET /api/content/pending` - View pending content for approval
- `POST /api/content/approve` - Approve generated content
- `POST /api/content/post` - Post approved content to social media

---

## 📞 Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify database connection and migrations
3. Ensure GOOGLE_API_KEY is configured
4. Review the API documentation at `/docs`
