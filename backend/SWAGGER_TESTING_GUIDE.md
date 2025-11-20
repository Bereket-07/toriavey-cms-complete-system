# Complete Testing Guide - Swagger UI

## 🎯 Overview

This guide shows you how to test the entire content generation system using Swagger UI, including:
- ✅ Content generation statistics
- ✅ Batch content generation
- ✅ Daily scheduler setup
- ✅ Manual scheduler testing

---

## 🚀 Step 1: Start Server & Open Swagger

```bash
# Start server
python -m uvicorn src.app:app --reload

# Open browser to:
http://localhost:8000/docs
```

---

## 📊 Step 2: Check Content Generation Statistics

### Endpoint: `GET /api/content/generation-stats`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "total_recipes": 150,
  "content_generated": 0,
  "pending_generation": 150,
  "completion_percentage": 0.0
}
```

This shows how many recipes need content generated.

---

## 🧪 Step 3: Test Manual Content Generation (One Recipe)

### Endpoint: `POST /api/content/generate-from-unprocessed`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Replace the request body with:

```json
{
  "target_platforms": ["instagram"],
  "limit": 1,
  "tone": "engaging and friendly",
  "include_emojis": true,
  "max_hashtags": 10
}
```

4. Click **"Execute"**

**Expected Response:**
```json
{
  "success": true,
  "message": "Processed 1 recipes: 1 successful, 0 failed",
  "total_recipes": 1,
  "processed": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "recipe_id": 123,
      "recipe_title": "Chocolate Chip Cookies",
      "success": true,
      "generated_contents": [
        {
          "platform": "instagram",
          "content": {
            "caption": "🍪 Craving the perfect chocolate chip cookie?...",
            "hashtags": ["cookies", "baking", "homemade"],
            "platform_specific": {
              "hook": "Try this amazing recipe!",
              "cta": "Save this for later!",
              "key_highlight": "Perfect chocolate chip cookies"
            },
            "image_suggestions": [
              "Use the main recipe image",
              "Show finished cookies"
            ]
          }
        }
      ]
    }
  ]
}
```

✅ **Success!** You just generated content for one recipe!

---

## 🎨 Step 4: Test Multi-Platform Generation

### Endpoint: `POST /api/content/generate-from-unprocessed`

1. Click **"Try it out"**
2. Use this request body:

```json
{
  "target_platforms": ["instagram", "twitter", "facebook"],
  "limit": 1,
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 8
}
```

3. Click **"Execute"**

**Expected Response:**
You'll get content generated for all 3 platforms (Instagram, Twitter, Facebook) for one recipe.

---

## ⏰ Step 5: Initialize the Daily Scheduler

### Endpoint: `POST /api/scheduler/initialize`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Use this request body:

```json
{
  "target_platforms": ["instagram", "twitter", "facebook"],
  "schedule_hour": 9,
  "schedule_minute": 0,
  "tone": "engaging and friendly",
  "include_emojis": true,
  "max_hashtags": 10
}
```

4. Click **"Execute"**

**Expected Response:**
```json
{
  "success": true,
  "message": "Scheduler initialized successfully. Will run daily at 09:00",
  "configuration": {
    "schedule": "09:00 daily",
    "platforms": ["instagram", "twitter", "facebook"],
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }
}
```

✅ **Scheduler is now configured!**

---

## 🚦 Step 6: Start the Scheduler

### Endpoint: `POST /api/scheduler/start`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "next_run": "2025-11-05 09:00:00",
  "schedule": "09:00 daily"
}
```

✅ **Scheduler is now running!** It will automatically process one recipe every day at 9:00 AM.

---

## 🧪 Step 7: Test Scheduler Immediately (Don't Wait)

### Endpoint: `POST /api/scheduler/run-now`

Instead of waiting until 9:00 AM tomorrow, test it right now:

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "success": true,
  "message": "Content generation triggered successfully",
  "note": "Check logs for detailed results"
}
```

**Check the server console logs** - you should see:
```
============================================================
🚀 DAILY CONTENT GENERATION STARTED
Time: 2025-11-04 22:30:00
============================================================
📊 Statistics: 149 recipes pending
🎯 Generating content for 1 recipe on platforms: ['instagram', 'twitter', 'facebook']
============================================================
✅ DAILY CONTENT GENERATION SUCCESSFUL
Recipe ID: 124
Recipe Title: Classic Banana Bread
Platforms: 3
============================================================
```

✅ **Perfect!** The scheduler just processed one recipe immediately!

---

## 📊 Step 8: Check Scheduler Status

### Endpoint: `GET /api/scheduler/status`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "is_running": true,
  "schedule": "09:00 daily",
  "next_run": "2025-11-05 09:00:00",
  "last_run": "2025-11-04 22:30:00",
  "last_run_status": "success",
  "total_runs": 1,
  "successful_runs": 1,
  "failed_runs": 0,
  "target_platforms": ["instagram", "twitter", "facebook"],
  "configuration": {
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }
}
```

This shows:
- ✅ Scheduler is running
- ✅ Next run is tomorrow at 9:00 AM
- ✅ Last run was successful
- ✅ 1 recipe has been processed

---

## 📈 Step 9: Check Updated Statistics

### Endpoint: `GET /api/content/generation-stats`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "total_recipes": 150,
  "content_generated": 2,
  "pending_generation": 148,
  "completion_percentage": 1.33
}
```

Notice:
- `content_generated` increased from 0 to 2 (we tested 2 recipes)
- `pending_generation` decreased from 150 to 148
- `completion_percentage` is now 1.33%

---

## 🎨 Step 10: Test Different Configurations

### Test Professional Tone (No Emojis)

```json
{
  "target_platforms": ["linkedin", "facebook"],
  "limit": 1,
  "tone": "professional and informative",
  "include_emojis": false,
  "max_hashtags": 5
}
```

### Test Maximum Reach (All Platforms)

```json
{
  "target_platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin", "threads"],
  "limit": 1,
  "tone": "engaging and friendly",
  "include_emojis": true,
  "max_hashtags": 15
}
```

### Test Batch Processing (5 Recipes)

```json
{
  "target_platforms": ["instagram", "twitter"],
  "limit": 5,
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 8
}
```

---

## 🔧 Step 11: Update Scheduler Configuration

### Change Schedule Time

**Endpoint:** `PUT /api/scheduler/schedule`

```json
{
  "hour": 10,
  "minute": 30
}
```

This changes the daily run time to 10:30 AM.

### Change Target Platforms

**Endpoint:** `PUT /api/scheduler/platforms`

```json
{
  "platforms": ["instagram", "twitter", "pinterest"]
}
```

### Update Content Configuration

**Endpoint:** `PUT /api/scheduler/configuration`

```json
{
  "tone": "professional and informative",
  "include_emojis": false,
  "max_hashtags": 5
}
```

---

## 🛑 Step 12: Stop the Scheduler

### Endpoint: `POST /api/scheduler/stop`

1. Find the endpoint in Swagger UI
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response:**
```json
{
  "success": true,
  "message": "Scheduler stopped successfully"
}
```

The scheduler will no longer run automatically.

---

## 📋 Complete Testing Checklist

Use this checklist to test everything:

### ✅ Basic Tests
- [ ] Check content generation statistics
- [ ] Generate content for 1 recipe (Instagram only)
- [ ] Generate content for 1 recipe (all platforms)
- [ ] Generate content for 5 recipes (batch)

### ✅ Scheduler Tests
- [ ] Initialize scheduler
- [ ] Start scheduler
- [ ] Check scheduler status
- [ ] Run scheduler manually (run-now)
- [ ] Check updated statistics
- [ ] Update schedule time
- [ ] Update target platforms
- [ ] Update configuration
- [ ] Stop scheduler

### ✅ Different Configurations
- [ ] Test with emojis enabled
- [ ] Test with emojis disabled
- [ ] Test professional tone
- [ ] Test casual tone
- [ ] Test different hashtag counts
- [ ] Test different platform combinations

---

## 🎯 Expected Results Summary

After completing all tests, you should see:

1. **Content Generated:**
   - Multiple recipes processed
   - Content for different platforms
   - Different tones and styles

2. **Scheduler Working:**
   - Successfully initialized
   - Running status confirmed
   - Manual trigger works
   - Statistics updating correctly

3. **Database Updated:**
   - `content_generated` flag set to TRUE for processed recipes
   - Statistics reflect accurate counts

---

## 🔍 Troubleshooting in Swagger

### Error: "No unprocessed recipes found"

**Check statistics:**
```
GET /api/content/generation-stats
```

If `pending_generation: 0`, all recipes are processed.

### Error: "Scheduler already running"

**Stop it first:**
```
POST /api/scheduler/stop
```

Then start again:
```
POST /api/scheduler/start
```

### Error: Database connection failed

**Check your `.env` file:**
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME

---

## 📊 Sample Test Sequence

Here's a recommended testing sequence:

```
1. GET  /api/content/generation-stats          (Check initial state)
2. POST /api/content/generate-from-unprocessed (Test 1 recipe)
3. GET  /api/content/generation-stats          (Verify it worked)
4. POST /api/scheduler/initialize              (Setup scheduler)
5. POST /api/scheduler/start                   (Start scheduler)
6. GET  /api/scheduler/status                  (Check status)
7. POST /api/scheduler/run-now                 (Test immediately)
8. GET  /api/scheduler/status                  (Check run results)
9. GET  /api/content/generation-stats          (See progress)
10. POST /api/scheduler/stop                   (Stop when done testing)
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Content generation returns `"success": true`
✅ Generated content includes captions and hashtags
✅ Scheduler status shows `"is_running": true`
✅ Manual trigger (`run-now`) processes a recipe
✅ Statistics update after each generation
✅ Server logs show successful processing

---

## 📚 Next Steps

After testing in Swagger:

1. **Leave scheduler running** - It will process one recipe daily
2. **Monitor logs** - Check server console for daily runs
3. **Check statistics weekly** - Track progress
4. **Adjust configuration** - Fine-tune tone, platforms, hashtags

---

## 🚀 You're Ready!

Your content generation system is fully tested and working! The scheduler will now automatically process one recipe every day at your configured time.

**Happy content generating! 🎉**
