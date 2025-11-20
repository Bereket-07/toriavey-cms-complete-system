# WPRM Content Generation System Guide

## 🎯 Overview

Complete content generation and tracking system for 729 WPRM recipes with status tracking for generation and posting.

---

## 📊 Current Status

- ✅ **729 WPRM recipes** tracked
- ✅ **All recipes** status: `not_generated`
- ✅ **Ready for** content generation

---

## 🗄️ Database Structure

### **Status Flow:**

```
not_generated → generated → posted
     ↓              ↓
  declined      failed
```

### **Status Definitions:**

1. **`not_generated`** - No content created yet (default)
2. **`generated`** - Content created but not posted
3. **`posted`** - Content created and posted to social media
4. **`declined`** - Content rejected (treated as not_generated)
5. **`failed`** - Generation or posting failed

---

## 🔌 API Endpoints

### **1. Get Status Summary**
```http
GET /api/content/wprm-status-summary
```

**Response:**
```json
{
  "success": true,
  "total_recipes": 729,
  "not_generated": 729,
  "generated_not_posted": 0,
  "posted": 0,
  "failed": 0,
  "completion_percentage": 0.0,
  "generation_percentage": 0.0
}
```

---

### **2. Get Recipes Needing Generation**
```http
GET /api/content/wprm-recipes-not-generated?limit=20&offset=0
```

Returns recipes with status `not_generated` or `declined` with full recipe data including `for_llm` object.

**Response:**
```json
{
  "success": true,
  "total_needing_generation": 20,
  "limit": 20,
  "offset": 0,
  "recipes": [
    {
      "id": 43615,
      "title": "Butterscotch Pie",
      "for_llm": {
        "title": "Butterscotch Pie",
        "description": "...",
        "ingredients": [...],
        "instructions": [...],
        "prep_time_minutes": "20",
        "cook_time_minutes": "360",
        "servings": "8 servings",
        "nutrition": {...},
        "image_url": "https://..."
      },
      "content_status": {
        "status": "not_generated",
        "content_generated": false,
        "posted": false,
        "retry_count": 0,
        "last_error": null
      }
    }
  ]
}
```

---

### **3. Get Recipes Ready to Post**
```http
GET /api/content/wprm-recipes-generated-not-posted?limit=20&offset=0
```

Returns recipes with generated content that haven't been posted yet.

**Response includes:**
- Full recipe data
- Generated content (captions, hashtags, etc.)
- Generation date
- Status information

---

### **4. Get Specific Recipe Status**
```http
GET /api/content/wprm-recipe-status/{recipe_id}
```

**Example:**
```http
GET /api/content/wprm-recipe-status/43615
```

Returns complete recipe with content status and generated content if available.

---

### **5. Get All WPRM Recipes**
```http
GET /api/content/wprm-recipes?limit=20&offset=0
```

Returns paginated list of all WPRM recipes with full data.

---

### **6. Get Recipe Count**
```http
GET /api/content/wprm-recipes-count
```

**Response:**
```json
{
  "success": true,
  "total_recipes": 729,
  "source": "wp_tori_posts (post_type='wprm_recipe')"
}
```

---

### **7. Search Recipes**
```http
GET /api/content/wprm-recipes/search/{query}?limit=20
```

**Example:**
```http
GET /api/content/wprm-recipes/search/chicken?limit=10
```

---

## 🔄 Content Generation Workflow

### **Step 1: Get Recipes Needing Generation**
```http
GET /api/content/wprm-recipes-not-generated?limit=10
```

### **Step 2: Generate Content for Recipe**

Use the `for_llm` object to generate content:

```python
# Recipe data for LLM
recipe_data = {
    "title": "Butterscotch Pie",
    "description": "Lightly sweetened crust...",
    "ingredients": ["1 1/4 cups all-purpose flour", ...],
    "instructions": ["Begin by preparing...", ...],
    "prep_time_minutes": "20",
    "cook_time_minutes": "360",
    "servings": "8 servings",
    "nutrition": {"calories": "574", ...},
    "image_url": "https://..."
}

# Generate content with LLM
content = generate_social_media_content(recipe_data)
```

### **Step 3: Mark as Generated**

After generating content, update status:

```python
from src.infrastructure.repository.wprm_content_status_repo import WPRMContentStatusRepository

status_repo = WPRMContentStatusRepository()
status_repo.mark_as_generated(
    recipe_id=43615,
    generated_content={
        "instagram": {
            "caption": "...",
            "hashtags": ["#recipe", "#food"]
        },
        "tiktok": {
            "caption": "...",
            "hashtags": ["#cooking"]
        }
    }
)
```

### **Step 4: Get Recipes Ready to Post**
```http
GET /api/content/wprm-recipes-generated-not-posted?limit=10
```

### **Step 5: Post to Social Media**

Post the generated content and mark as posted:

```python
# Post to platforms
post_to_instagram(content)
post_to_tiktok(content)

# Mark as posted
status_repo.mark_as_posted(
    recipe_id=43615,
    platforms=["instagram", "tiktok"]
)
```

---

## 📝 Status Management Methods

### **Mark as Generated**
```python
status_repo.mark_as_generated(recipe_id, generated_content)
```

### **Mark as Posted**
```python
status_repo.mark_as_posted(recipe_id, platforms=["instagram", "tiktok"])
```

### **Mark as Declined**
```python
status_repo.mark_as_declined(recipe_id, reason="Low quality image")
```

### **Mark as Failed**
```python
status_repo.mark_as_failed(recipe_id, error="API timeout")
```

### **Reset to Not Generated**
```python
status_repo.reset_to_not_generated(recipe_id)
```

---

## 🎯 Integration with Content Generation

### **Option 1: Update Existing Batch Generation**

Modify `BatchGenerateContentUseCase` to use WPRM recipes:

1. Fetch from `/api/content/wprm-recipes-not-generated`
2. Use `for_llm` object for generation
3. Mark as generated with `mark_as_generated()`
4. Mark as posted with `mark_as_posted()`

### **Option 2: Create New WPRM-Specific Generation**

Create a new use case specifically for WPRM recipes with:
- Better error handling
- Retry logic
- Platform-specific content
- Image optimization
- Video clip generation (OpusClip)

---

## 🔍 Monitoring & Tracking

### **Check Progress**
```http
GET /api/content/wprm-status-summary
```

### **View Failed Recipes**
```python
status_repo.get_recipes_by_status(ContentStatus.FAILED)
```

### **View Declined Recipes**
```python
status_repo.get_recipes_by_status(ContentStatus.DECLINED)
```

---

## 📊 Data Structure for LLM

The `for_llm` object contains everything needed for content generation:

```json
{
  "title": "Recipe Title",
  "description": "Recipe description/summary",
  "ingredients": [
    "1 cup flour",
    "2 eggs",
    "..."
  ],
  "instructions": [
    "Step 1: Mix ingredients",
    "Step 2: Bake at 350°F",
    "..."
  ],
  "prep_time_minutes": "20",
  "cook_time_minutes": "30",
  "total_time_minutes": "50",
  "servings": "8 servings",
  "notes": "Additional tips and notes",
  "nutrition": {
    "calories": "250",
    "protein": "10",
    "carbohydrates": "30",
    "fat": "8",
    "fiber": "2",
    "sugar": "5"
  },
  "image_url": "https://toriavey.com/images/..."
}
```

---

## 🚀 Next Steps

### **Immediate:**
1. ✅ Test status endpoints in Swagger
2. ✅ Verify recipe data structure
3. ✅ Check `for_llm` object format

### **Integration:**
1. 🔄 Create WPRM content generation use case
2. 🔄 Integrate with LLM for caption generation
3. 🔄 Connect with social media posting
4. 🔄 Add OpusClip video generation

### **Enhancement:**
1. 📊 Add scheduling for daily generation
2. 🎨 Add image optimization
3. 📹 Add video clip generation
4. 📱 Add platform-specific formatting

---

## 🧪 Testing in Swagger

Go to `http://localhost:8000/docs` and test:

1. **Get Status Summary**
   - `GET /api/content/wprm-status-summary`
   - Should show 729 not_generated

2. **Get Recipes to Generate**
   - `GET /api/content/wprm-recipes-not-generated?limit=5`
   - Should return 5 recipes with full data

3. **Get Specific Recipe**
   - `GET /api/content/wprm-recipe-status/43615`
   - Should return recipe with status

---

## 📚 Related Documentation

- `OPUS_CLIP_GUIDE.md` - OpusClip video generation
- `BATCH_CONTENT_GENERATION_GUIDE.md` - Existing batch generation
- `DAILY_SCHEDULER_GUIDE.md` - Daily scheduling system

---

## ✅ Summary

You now have:
- ✅ **729 recipes** tracked and ready
- ✅ **Status tracking** for generation and posting
- ✅ **Clean data** for LLM via `for_llm` object
- ✅ **API endpoints** for all operations
- ✅ **Workflow** for generation → posting
- ✅ **Error handling** with retry tracking

**Ready to integrate with content generation!** 🚀
