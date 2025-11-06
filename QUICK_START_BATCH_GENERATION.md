# Quick Start: Batch Content Generation

## 🚀 3-Step Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Setup
```bash
python scripts/setup_batch_generation.py
```

### 3. Start Server
```bash
python -m uvicorn src.app:app --reload
```

---

## 📡 API Quick Reference

### Check Statistics
```bash
curl http://localhost:8000/api/content/generation-stats
```

### Generate Content (First 10 Recipes)
```bash
curl -X POST "http://localhost:8000/api/content/generate-from-unprocessed" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter", "facebook"],
    "limit": 10
  }'
```

### Generate All Unprocessed
```bash
curl -X POST "http://localhost:8000/api/content/generate-from-unprocessed" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter"]
  }'
```

---

## 🎯 Common Use Cases

### Test with 1 Recipe
```json
{
  "target_platforms": ["instagram"],
  "limit": 1
}
```

### Professional Tone, No Emojis
```json
{
  "target_platforms": ["linkedin", "facebook"],
  "limit": 10,
  "tone": "professional and informative",
  "include_emojis": false,
  "max_hashtags": 5
}
```

### Maximum Reach
```json
{
  "target_platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin"],
  "tone": "engaging and friendly",
  "max_hashtags": 15
}
```

---

## 📊 Monitor Progress

```bash
# Before
GET /api/content/generation-stats
# Response: pending_generation: 150

# After processing 50
GET /api/content/generation-stats  
# Response: pending_generation: 100, completion_percentage: 33.33
```

---

## 🔧 Troubleshooting

### Column doesn't exist?
```bash
python scripts/add_content_generated_column.py
```

### Reset a recipe?
```python
from src.infrastructure.repository.recipe_repo import RecipeRepository
repo = RecipeRepository()
repo.reset_content_generated(recipe_id=123)
```

---

## 📚 Full Documentation

- **Complete Guide:** `BATCH_CONTENT_GENERATION_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **API Docs:** http://localhost:8000/docs

---

## ✅ That's It!

You're ready to generate content for your recipes. Start with a small batch and scale up!
