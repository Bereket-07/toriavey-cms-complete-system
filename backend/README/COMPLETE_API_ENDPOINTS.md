# Complete API Endpoints - Tori Avey CMS Backend

**Backend Base URL:** `http://127.0.0.1:8000`

---

## 📚 **Table of Contents**

1. [Content Management (WPRM Recipes)](#content-management-wprm-recipes)
2. [WPRM Content Scheduler](#wprm-content-scheduler)
3. [Video Clips (Vizard AI)](#video-clips-vizard-ai)
4. [OpusClip Integration](#opusclip-integration)
5. [Health & Documentation](#health--documentation)

---

## 🍳 **Content Management (WPRM Recipes)**

**Prefix:** `/api/content`

### **Content Generation**

#### Generate Content from Recipe
```http
POST /api/content/generate
```
Generate AI-powered social media content from recipe data.

**Request Body:**
```json
{
  "recipe_id": 123,
  "recipe_data": {
    "title": "Classic Chocolate Chip Cookies",
    "description": "The best cookies...",
    "ingredients": ["flour", "butter", "chocolate chips"],
    "instructions": ["Mix", "Bake", "Enjoy"],
    "prep_time": "15 minutes",
    "cook_time": "12 minutes",
    "servings": "24 cookies"
  },
  "target_platforms": ["instagram", "twitter"],
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

#### Select Alternative Caption
```http
POST /api/content/select-caption
```
Select an alternative caption from generated options.

---

#### Generate Batch Content
```http
POST /api/content/generate-batch
```
Generate content for multiple recipes at once.

---

### **Content Review**

#### Get Pending Content
```http
GET /api/content/pending
```
Get all content awaiting approval/rejection.

---

#### Get Content Details
```http
GET /api/content/content/{content_id}
```
Get detailed information about specific content.

---

#### Get Content Statistics
```http
GET /api/content/stats
```
Get statistics about generated and posted content.

---

### **Content Editing**

#### Edit Content
```http
POST /api/content/edit
```
Edit generated content (caption, hashtags, image).

---

#### Regenerate Content
```http
POST /api/content/regenerate
```
Regenerate content with different parameters.

---

### **Approval/Rejection**

#### Approve Content
```http
POST /api/content/approve
```
Approve content for posting.

**Request Body:**
```json
{
  "content_id": 1,
  "approved_by": 123
}
```

---

#### Reject Content
```http
POST /api/content/reject
```
Reject content.

**Request Body:**
```json
{
  "content_id": 1,
  "rejection_reason": "Not suitable",
  "rejected_by": 123
}
```

---

#### Bulk Approve
```http
POST /api/content/bulk-approve?content_ids=1&content_ids=2&approved_by=123
```
Approve multiple contents at once.

---

### **Posting**

#### Post Content to Social Media
```http
POST /api/content/post
```
Post approved content to social media platforms.

---

#### Bulk Post
```http
POST /api/content/bulk-post
```
Post multiple contents at once.

---

### **WPRM Recipes Management**

#### Get WPRM Recipes
```http
GET /api/content/wprm-recipes?limit=20&offset=0
```
Get WordPress Recipe Maker (WPRM) recipes.

---

#### Get WPRM Recipe by ID
```http
GET /api/content/wprm-recipes/{recipe_id}
```
Get a single WPRM recipe.

---

#### Get WPRM Recipes Count
```http
GET /api/content/wprm-recipes-count
```
Get total count of WPRM recipes.

---

#### Search WPRM Recipes
```http
GET /api/content/wprm-recipes/search/{query}?limit=20
```
Search WPRM recipes by title.

---

### **WPRM Content Status**

#### Get Status Summary
```http
GET /api/content/wprm-status-summary
```
Get summary of WPRM content generation status.

---

#### Get Recipes Not Generated
```http
GET /api/content/wprm-recipes-not-generated?limit=10&offset=0
```
Get recipes that need content generation.

---

#### Get Recipes Generated Not Posted
```http
GET /api/content/wprm-recipes-generated-not-posted?limit=10&offset=0
```
Get recipes with generated content that haven't been posted.

---

#### Get Pending Recipes
```http
GET /api/content/wprm-recipes-pending?limit=10&offset=0
```
Get recipes with pending status (approved and waiting).

---

#### Approve WPRM Content
```http
POST /api/content/wprm-approve-content/{recipe_id}
```
Approve generated content for a WPRM recipe.

---

#### Decline WPRM Content
```http
POST /api/content/wprm-decline-content/{recipe_id}?reason=NotGood
```
Decline generated content (will be regenerated).

---

#### Reset Empty Content
```http
POST /api/content/wprm-reset-empty-content
```
Reset recipes with empty/bad content back to not_generated status.

---

#### Get Recipe Status
```http
GET /api/content/wprm-recipe-status/{recipe_id}
```
Get content status for a specific WPRM recipe.

---

### **Generation Stats**

#### Get Generation Statistics
```http
GET /api/content/generation-stats
```
Get statistics about content generation status.

---

#### Get Unprocessed Recipes
```http
GET /api/content/unprocessed-recipes?limit=10
```
Get recipes without generated content.

---

#### Get All Recipes
```http
GET /api/content/all-recipes?limit=20&offset=0
```
Get ALL recipes (processed and unprocessed).

---

#### Get Recipes Count
```http
GET /api/content/recipes-count
```
Get total count of recipes in database.

---

#### Health Check
```http
GET /api/content/health
```
Health check for content service.

---

## 📅 **WPRM Content Scheduler**

**Prefix:** `/api/wprm-scheduler`

### Start Scheduler
```http
POST /api/wprm-scheduler/start
```
Start the content generation scheduler.

**Request Body:**
```json
{
  "interval_minutes": 60,
  "batch_size": 10,
  "target_platforms": ["instagram", "twitter"],
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

### Start Cron Scheduler
```http
POST /api/wprm-scheduler/start-cron
```
Start scheduler with cron expression.

**Request Body:**
```json
{
  "cron_expression": "0 */6 * * *",
  "batch_size": 10,
  "target_platforms": ["instagram", "twitter"]
}
```

---

### Stop Scheduler
```http
POST /api/wprm-scheduler/stop
```
Stop the scheduler.

---

### Get Scheduler Status
```http
GET /api/wprm-scheduler/status
```
Get current scheduler status.

---

### Run Now
```http
POST /api/wprm-scheduler/run-now
```
Run content generation immediately (bypass schedule).

---

### Update Config
```http
PUT /api/wprm-scheduler/config
```
Update scheduler configuration.

---

### Generate Single Recipe
```http
POST /api/wprm-scheduler/generate-single
```
Generate content for a single recipe immediately.

**Request Body:**
```json
{
  "recipe_id": 123,
  "target_platforms": ["instagram", "twitter"],
  "tone": "casual",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

### Generate Batch Recipes
```http
POST /api/wprm-scheduler/generate-batch
```
Generate content for multiple recipes immediately.

**Request Body:**
```json
{
  "recipe_ids": [123, 456, 789],
  "target_platforms": ["instagram", "twitter"],
  "tone": "casual",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

## 🎬 **Video Clips (Vizard AI)**

**Prefix:** `/api/clips`

### Generate Clips
```http
POST /api/clips/generate
```
Generate video clips for specific platforms.

**Request Body:**
```json
{
  "video_url": "https://youtube.com/watch?v=...",
  "target_platforms": ["youtube_shorts", "tiktok", "instagram_reels"],
  "source_type": "youtube"
}
```

---

### Generate All Platform Clips
```http
POST /api/clips/generate-all?video_url=https://...&source_type=youtube
```
Generate clips for all supported platforms.

---

### Get Pending Clips
```http
GET /api/clips/pending
```
Get all pending clips awaiting approval.

---

### Get Clip Details
```http
GET /api/clips/clip/{clip_id}
```
Get detailed information about a clip.

---

### Approve Clip
```http
POST /api/clips/approve
```
Approve a clip for posting.

**Request Body:**
```json
{
  "clip_id": 1,
  "approved_by": 123
}
```

---

### Reject Clip
```http
POST /api/clips/reject
```
Reject a clip.

**Request Body:**
```json
{
  "clip_id": 1,
  "rejection_reason": "Poor quality",
  "rejected_by": 123
}
```

---

### Post Clip
```http
POST /api/clips/post
```
Post approved clip to social media.

**Request Body:**
```json
{
  "clip_id": 1,
  "platforms": ["youtube_shorts", "tiktok"],
  "caption": "Check out this recipe!",
  "hashtags": ["recipe", "cooking"]
}
```

---

### Health Check
```http
GET /api/clips/health
```
Health check for clips service.

---

## 🎥 **OpusClip Integration**

**Prefix:** `/api/opus`

### Create Clip Project
```http
POST /api/opus/create-project
```
Create a new clip project from video URL.

**Request Body:**
```json
{
  "video_url": "https://youtube.com/watch?v=...",
  "project_name": "My Recipe Video"
}
```

---

### Get Project Status
```http
GET /api/opus/project/{project_id}/status
```
Get the status of a clip project.

---

### Get Project Clips
```http
POST /api/opus/project/clips
```
Get all clips from a completed project.

**Request Body:**
```json
{
  "project_id": "proj_123"
}
```

---

### Share Project
```http
POST /api/opus/project/share
```
Share a project by making it public.

---

### Manage Collection
```http
POST /api/opus/collections/manage
```
Manage collections.

---

### Censor Clip
```http
POST /api/opus/clip/censor
```
Create a censor job to censor words in a clip.

---

### Get Censor Job Status
```http
GET /api/opus/censor-job/{job_id}/status
```
Get the status of a censor job.

---

### Get Brand Templates
```http
GET /api/opus/brand-templates
```
Get all brand templates for your account.

---

### Upload and Create Project
```http
POST /api/opus/upload-and-create
```
Upload a local video file and create a clip project.

---

### Health Check
```http
GET /api/opus/health
```
Check if OpusClip API is configured.

---

## 🏥 **Health & Documentation**

### Root Endpoint
```http
GET /
```
API information and available endpoints.

---

### Health Check
```http
GET /health
```
System health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "toriavey-cms",
  "version": "1.0.0"
}
```

---

### API Documentation (Swagger)
```http
GET /docs
```
Interactive API documentation.

**URL:** http://localhost:7000/docs

---

### API Documentation (ReDoc)
```http
GET /redoc
```
Alternative API documentation.

**URL:** http://localhost:7000/redoc

---

## 🎯 **Quick Reference**

### **Most Used Endpoints:**

```bash
# Generate content from recipe
POST http://127.0.0.1:8000/api/content/generate

# Get pending content
GET http://127.0.0.1:8000/api/content/pending

# Approve content
POST http://127.0.0.1:8000/api/content/approve

# Get WPRM recipes
GET http://127.0.0.1:8000/api/content/wprm-recipes

# Get recipes needing generation
GET http://127.0.0.1:8000/api/content/wprm-recipes-not-generated

# Approve WPRM content
POST http://127.0.0.1:8000/api/content/wprm-approve-content/{recipe_id}

# Generate single recipe
POST http://127.0.0.1:8000/api/wprm-scheduler/generate-single

# API Documentation
http://127.0.0.1:8000/docs
```

---

## 📋 **Summary by Feature**

| Feature | Endpoint Prefix | Description |
|---------|-----------------|-------------|
| Recipe Content | `/api/content` | Generate & manage recipe content |
| Scheduler | `/api/wprm-scheduler` | Automate content generation |
| Video Clips | `/api/clips` | Generate & manage video clips |
| OpusClip | `/api/opus` | OpusClip integration |

---

## 🚀 **Testing with cURL**

### Generate Content:
```bash
curl -X POST "http://127.0.0.1:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Test Recipe"
    },
    "target_platforms": ["instagram"],
    "tone": "casual",
    "include_emojis": true,
    "max_hashtags": 5
  }'
```

### Get WPRM Recipes:
```bash
curl "http://127.0.0.1:8000/api/content/wprm-recipes?limit=10"
```

### Approve Content:
```bash
curl -X POST "http://127.0.0.1:8000/api/content/wprm-approve-content/123"
```

---

✅ **All endpoints are now documented based on your actual backend!**
