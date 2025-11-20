# WPRM Content Generation & Scheduling System

## 🎯 Complete System Overview

Automated content generation and scheduling for 729 WPRM recipes with full status tracking.

---

## ✅ What's Integrated

- ✅ **729 WPRM recipes** tracked in database
- ✅ **Status tracking** (not_generated, generated, posted, declined, failed)
- ✅ **LLM content generation** for 5 platforms
- ✅ **Automated scheduling** with configurable intervals
- ✅ **Manual generation** for testing
- ✅ **Batch processing** for multiple recipes
- ✅ **Generated content storage** in database

---

## 🔌 API Endpoints

### **1. Start Scheduler (Interval-Based)**
```http
POST /api/wprm-scheduler/start
```

**Request Body:**
```json
{
  "interval_minutes": 5,
  "recipes_per_run": 2
}
```

**For Testing:** Use `interval_minutes: 5` to run every 5 minutes

**Response:**
```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "status": {
    "is_running": true,
    "config": {
      "recipes_per_run": 2,
      "interval_minutes": 5,
      "platforms": ["instagram", "tiktok", "facebook", "twitter", "pinterest"]
    },
    "next_run": "2025-11-06 22:50:00",
    "content_status": {
      "total_recipes": 729,
      "not_generated": 729,
      "generated_not_posted": 0,
      "posted": 0,
      "failed": 0
    }
  }
}
```

---

### **2. Start Scheduler (Cron-Based)**
```http
POST /api/wprm-scheduler/start-cron
```

**Request Body:**
```json
{
  "cron_expression": "*/5 * * * *",
  "recipes_per_run": 2
}
```

**Cron Examples:**
- `"*/5 * * * *"` - Every 5 minutes (testing)
- `"0 9 * * *"` - Every day at 9 AM
- `"0 */6 * * *"` - Every 6 hours
- `"0 9 * * 1"` - Every Monday at 9 AM

---

### **3. Stop Scheduler**
```http
POST /api/wprm-scheduler/stop
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler stopped successfully"
}
```

---

### **4. Get Scheduler Status**
```http
GET /api/wprm-scheduler/status
```

**Response:**
```json
{
  "success": true,
  "is_running": true,
  "config": {
    "recipes_per_run": 2,
    "interval_minutes": 5,
    "platforms": ["instagram", "tiktok", "facebook", "twitter", "pinterest"]
  },
  "next_run": "2025-11-06 22:50:00",
  "content_status": {
    "total_recipes": 729,
    "not_generated": 727,
    "generated_not_posted": 2,
    "posted": 0,
    "failed": 0,
    "completion_percentage": 0.0,
    "generation_percentage": 0.27
  }
}
```

---

### **5. Run Scheduler Now (Manual Trigger)**
```http
POST /api/wprm-scheduler/run-now
```

**Response:**
```json
{
  "success": true,
  "message": "Content generation completed",
  "total_processed": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "recipe_id": 43615,
      "recipe_title": "Butterscotch Pie",
      "platforms": ["instagram", "tiktok", "facebook", "twitter", "pinterest"],
      "generated_content": {
        "instagram": {
          "caption": "🥧 Craving the perfect butterscotch pie?...",
          "hashtags": ["butterscotchpie", "dessert", "baking", ...],
          "hook": "This nostalgic butterscotch pie...",
          "cta": "Save this recipe for later!"
        },
        "tiktok": {
          "caption": "Easy butterscotch pie recipe!",
          "hashtags": ["baking", "dessert", ...],
          "hook": "Try this amazing pie!"
        },
        ...
      },
      "generation_date": "2025-11-06T22:45:00"
    }
  ]
}
```

---

### **6. Update Scheduler Config**
```http
PUT /api/wprm-scheduler/config
```

**Request Body:**
```json
{
  "interval_minutes": 10,
  "recipes_per_run": 5,
  "platforms": ["instagram", "tiktok"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated",
  "config": {
    "recipes_per_run": 5,
    "interval_minutes": 10,
    "platforms": ["instagram", "tiktok"]
  },
  "restarted": true
}
```

---

### **7. Generate Content for Single Recipe**
```http
POST /api/wprm-scheduler/generate-single
```

**Request Body:**
```json
{
  "recipe_id": 43615,
  "platforms": ["instagram", "tiktok"]
}
```

**Response:**
```json
{
  "success": true,
  "recipe_id": 43615,
  "recipe_title": "Butterscotch Pie",
  "platforms": ["instagram", "tiktok"],
  "generated_content": {
    "instagram": {...},
    "tiktok": {...}
  },
  "generation_date": "2025-11-06T22:45:00"
}
```

---

### **8. Generate Content for Multiple Recipes**
```http
POST /api/wprm-scheduler/generate-batch
```

**Request Body:**
```json
{
  "limit": 5,
  "platforms": ["instagram", "tiktok", "facebook"]
}
```

**Response:**
```json
{
  "success": true,
  "total_processed": 5,
  "successful": 5,
  "failed": 0,
  "results": [...]
}
```

---

## 🧪 Testing Workflow

### **Step 1: Start Scheduler for Testing**
```http
POST /api/wprm-scheduler/start
```
```json
{
  "interval_minutes": 5,
  "recipes_per_run": 2
}
```

This will generate content for 2 recipes every 5 minutes.

---

### **Step 2: Check Status**
```http
GET /api/wprm-scheduler/status
```

Monitor:
- `is_running`: Should be `true`
- `next_run`: When next generation will happen
- `content_status.generated_not_posted`: Should increase after each run

---

### **Step 3: Manually Trigger Generation (Optional)**
```http
POST /api/wprm-scheduler/run-now
```

This runs immediately without waiting for the schedule.

---

### **Step 4: View Generated Content**
```http
GET /api/content/wprm-recipes-generated-not-posted?limit=5
```

**Response includes:**
- Full recipe data
- Generated content for all platforms
- Status information

---

### **Step 5: View Specific Recipe with Generated Content**
```http
GET /api/content/wprm-recipe-status/43615
```

**Response:**
```json
{
  "success": true,
  "recipe": {
    "id": 43615,
    "title": "Butterscotch Pie",
    "for_llm": {...},
    "content_status": {
      "status": "generated",
      "content_generated": true,
      "posted": false,
      "generation_date": "2025-11-06 22:45:00"
    },
    "generated_content": {
      "instagram": {...},
      "tiktok": {...},
      "facebook": {...},
      "twitter": {...},
      "pinterest": {...}
    }
  }
}
```

---

### **Step 6: Stop Scheduler**
```http
POST /api/wprm-scheduler/stop
```

---

## 📊 Status Flow

```
not_generated → [Generate Content] → generated → [Post to Social] → posted
                                          ↓
                                      declined
                                          ↓
                                      failed
```

### **Status Definitions:**

1. **`not_generated`** - No content created yet
2. **`generated`** - Content created and stored, ready to post
3. **`posted`** - Content posted to social media
4. **`declined`** - Content rejected (treated as not_generated)
5. **`failed`** - Generation or posting failed

---

## 🎨 Generated Content Structure

For each recipe, content is generated for 5 platforms:

### **Instagram:**
```json
{
  "caption": "Full caption with emojis and story",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "hook": "Attention-grabbing opening",
  "cta": "Call to action"
}
```

### **TikTok:**
```json
{
  "caption": "Short, catchy caption",
  "hashtags": ["trending1", "trending2", ...],
  "hook": "Quick hook"
}
```

### **Facebook:**
```json
{
  "post": "Full post text",
  "hashtags": ["hashtag1", ...],
  "cta": "Call to action"
}
```

### **Twitter:**
```json
{
  "tweet": "Tweet text (max 280 chars)",
  "hashtags": ["hashtag1", ...]
}
```

### **Pinterest:**
```json
{
  "title": "Pin title",
  "description": "Full description",
  "keywords": ["keyword1", ...]
}
```

---

## 🔄 Scheduler Configuration Options

### **Interval-Based:**
- `interval_minutes`: 1-1440 (1 minute to 24 hours)
- `recipes_per_run`: 1-100

### **Cron-Based:**
- Full cron expression support
- Examples in endpoint documentation

### **Platforms:**
- `["instagram"]` - Instagram only
- `["instagram", "tiktok"]` - Multiple platforms
- `null` - All 5 platforms (default)

---

## 📝 Database Storage

Generated content is stored in `wprm_content_status` table:

```sql
SELECT 
  recipe_id,
  status,
  content_generated,
  generation_date,
  generated_content,  -- JSON with all platform content
  posted,
  post_date,
  platforms_posted
FROM wprm_content_status
WHERE status = 'generated';
```

---

## 🚀 Quick Start for Testing

### **1. Start 5-Minute Scheduler:**
```bash
curl -X POST http://localhost:8000/api/wprm-scheduler/start \
  -H "Content-Type: application/json" \
  -d '{"interval_minutes": 5, "recipes_per_run": 2}'
```

### **2. Check Status:**
```bash
curl http://localhost:8000/api/wprm-scheduler/status
```

### **3. Run Immediately:**
```bash
curl -X POST http://localhost:8000/api/wprm-scheduler/run-now
```

### **4. View Generated Content:**
```bash
curl http://localhost:8000/api/content/wprm-recipes-generated-not-posted?limit=5
```

### **5. Stop Scheduler:**
```bash
curl -X POST http://localhost:8000/api/wprm-scheduler/stop
```

---

## 📈 Monitoring Progress

### **Get Summary:**
```http
GET /api/content/wprm-status-summary
```

**Response:**
```json
{
  "success": true,
  "total_recipes": 729,
  "not_generated": 720,
  "generated_not_posted": 9,
  "posted": 0,
  "failed": 0,
  "completion_percentage": 0.0,
  "generation_percentage": 1.23
}
```

---

## ⚠️ Important Notes

1. **Testing:** Use `interval_minutes: 5` for quick testing
2. **Production:** Use `interval_minutes: 60` or cron for daily generation
3. **Rate Limits:** Be mindful of LLM API rate limits
4. **Storage:** Generated content is stored in database
5. **Retry:** Failed recipes can be retried by resetting status

---

## 🎯 Next Steps

1. ✅ Test scheduler with 5-minute intervals
2. ✅ Verify content generation quality
3. ✅ Integrate with social media posting
4. ✅ Add content approval workflow
5. ✅ Monitor and optimize

---

## 📚 Related Endpoints

- `/api/content/wprm-recipes` - Get all recipes
- `/api/content/wprm-recipes-not-generated` - Get recipes needing generation
- `/api/content/wprm-recipes-generated-not-posted` - Get recipes ready to post
- `/api/content/wprm-recipe-status/{id}` - Get specific recipe status
- `/api/content/wprm-status-summary` - Get overall summary

---

**Ready to test! Start with the 5-minute scheduler and watch the magic happen!** 🚀
