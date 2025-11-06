# Daily Content Generation Scheduler - Complete Guide

## 🎯 Overview

The Daily Content Generation Scheduler automatically picks **one recipe per day** and generates social media content for all configured platforms. This ensures consistent, automated content creation without manual intervention.

---

## ✨ Key Features

- ✅ **Automatic Daily Execution** - Runs at your specified time every day
- ✅ **One Recipe Per Day** - Processes exactly one unprocessed recipe
- ✅ **Multi-Platform Support** - Generates content for all configured social platforms
- ✅ **Smart Tracking** - Marks recipes as processed to avoid duplicates
- ✅ **Full Control** - Start, stop, and configure via API
- ✅ **Monitoring** - Track runs, successes, failures, and next execution time
- ✅ **Manual Trigger** - Test immediately without waiting for scheduled time

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Run Database Migration

```bash
python scripts/setup_batch_generation.py
```

### Step 3: Start Your Server

```bash
python -m uvicorn src.app:app --reload
```

### Step 4: Initialize & Start Scheduler

```bash
# Initialize with default settings (runs at 9:00 AM daily)
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter", "facebook"],
    "schedule_hour": 9,
    "schedule_minute": 0
  }'

# Start the scheduler
curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

## 📡 API Endpoints

### 1. Initialize Scheduler

**Endpoint:** `POST /api/scheduler/initialize`

**Description:** Set up the scheduler with your preferred configuration.

**Request:**
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

**Response:**
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

---

### 2. Start Scheduler

**Endpoint:** `POST /api/scheduler/start`

**Description:** Start the daily scheduler. It will run automatically at the configured time.

**Request:**
```bash
curl -X POST "http://localhost:8000/api/scheduler/start"
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "next_run": "2025-11-05 09:00:00",
  "schedule": "09:00 daily"
}
```

---

### 3. Stop Scheduler

**Endpoint:** `POST /api/scheduler/stop`

**Description:** Stop the scheduler. No automatic content generation will occur.

**Request:**
```bash
curl -X POST "http://localhost:8000/api/scheduler/stop"
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler stopped successfully"
}
```

---

### 4. Get Scheduler Status

**Endpoint:** `GET /api/scheduler/status`

**Description:** Check current scheduler status, statistics, and configuration.

**Request:**
```bash
curl http://localhost:8000/api/scheduler/status
```

**Response:**
```json
{
  "is_running": true,
  "schedule": "09:00 daily",
  "next_run": "2025-11-05 09:00:00",
  "last_run": "2025-11-04 09:00:00",
  "last_run_status": "success",
  "total_runs": 5,
  "successful_runs": 5,
  "failed_runs": 0,
  "target_platforms": ["instagram", "twitter", "facebook"],
  "configuration": {
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }
}
```

---

### 5. Run Now (Manual Trigger)

**Endpoint:** `POST /api/scheduler/run-now`

**Description:** Immediately generate content for one recipe (for testing).

**Request:**
```bash
curl -X POST "http://localhost:8000/api/scheduler/run-now"
```

**Response:**
```json
{
  "success": true,
  "message": "Content generation triggered successfully",
  "note": "Check logs for detailed results"
}
```

---

### 6. Update Schedule Time

**Endpoint:** `PUT /api/scheduler/schedule`

**Description:** Change when the scheduler runs daily.

**Request:**
```json
{
  "hour": 10,
  "minute": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule updated to 10:30",
  "new_schedule": "10:30 daily"
}
```

---

### 7. Update Target Platforms

**Endpoint:** `PUT /api/scheduler/platforms`

**Description:** Change which platforms content is generated for.

**Request:**
```json
{
  "platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Target platforms updated successfully",
  "platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin"]
}
```

---

### 8. Update Configuration

**Endpoint:** `PUT /api/scheduler/configuration`

**Description:** Update content generation settings (tone, emojis, hashtags).

**Request:**
```json
{
  "tone": "professional and informative",
  "include_emojis": false,
  "max_hashtags": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "configuration": {
    "tone": "professional and informative",
    "include_emojis": false,
    "max_hashtags": 5
  }
}
```

---

## 🔄 Daily Workflow

### What Happens Every Day

```
09:00 AM (or your configured time)
           ↓
Scheduler Wakes Up
           ↓
Check for Unprocessed Recipes
           ↓
Pick ONE Recipe (content_generated=False)
           ↓
Generate Content for All Platforms:
  - Instagram
  - Twitter
  - Facebook
  - (any other configured platforms)
           ↓
Mark Recipe as Processed (content_generated=True)
           ↓
Log Results & Statistics
           ↓
Wait Until Tomorrow 09:00 AM
```

---

## 📊 Monitoring & Logs

### Check Status Regularly

```bash
# Get current status
curl http://localhost:8000/api/scheduler/status

# Check content generation statistics
curl http://localhost:8000/api/content/generation-stats
```

### Log Output Example

```
============================================================
🚀 DAILY CONTENT GENERATION STARTED
Time: 2025-11-05 09:00:00
============================================================
📊 Statistics: 145 recipes pending
🎯 Generating content for 1 recipe on platforms: ['instagram', 'twitter', 'facebook']
============================================================
✅ DAILY CONTENT GENERATION SUCCESSFUL
Recipe ID: 123
Recipe Title: Classic Chocolate Chip Cookies
Platforms: 3
============================================================
📊 Updated Statistics: 144 recipes remaining
Progress: 3.33% complete
```

---

## ⚙️ Configuration Options

### Schedule Time

- **Hour:** 0-23 (24-hour format)
- **Minute:** 0-59
- **Example:** `"schedule_hour": 9, "schedule_minute": 0"` = 9:00 AM

### Target Platforms

Available platforms:
- `instagram`
- `twitter`
- `facebook`
- `linkedin`
- `pinterest`
- `threads`

### Content Tone

Suggested tones:
- `"engaging and friendly"` (default)
- `"warm and inviting"`
- `"professional and informative"`
- `"casual and fun"`
- `"elegant and sophisticated"`

### Emojis

- `true` - Include emojis in captions (default)
- `false` - No emojis

### Hashtags

- Range: 1-30
- Recommended: 5-10 for most platforms

---

## 🎯 Common Use Cases

### Use Case 1: Morning Content Generation

Generate content every morning at 8:00 AM for Instagram and Twitter:

```bash
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter"],
    "schedule_hour": 8,
    "schedule_minute": 0,
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 8
  }'

curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

### Use Case 2: Professional Content for LinkedIn

Generate professional content at 10:00 AM for LinkedIn and Facebook:

```bash
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["linkedin", "facebook"],
    "schedule_hour": 10,
    "schedule_minute": 0,
    "tone": "professional and informative",
    "include_emojis": false,
    "max_hashtags": 5
  }'

curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

### Use Case 3: Maximum Reach

Generate content for all platforms at 9:00 AM:

```bash
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "target_platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin", "threads"],
    "schedule_hour": 9,
    "schedule_minute": 0,
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }'

curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

## 🧪 Testing the Scheduler

### Test Before Going Live

1. **Initialize with test settings:**
   ```bash
   curl -X POST "http://localhost:8000/api/scheduler/initialize" \
     -H "Content-Type: application/json" \
     -d '{"target_platforms": ["instagram"], "schedule_hour": 9}'
   ```

2. **Run manually to test:**
   ```bash
   curl -X POST "http://localhost:8000/api/scheduler/run-now"
   ```

3. **Check the logs** for success/failure

4. **Review generated content quality**

5. **If satisfied, start the scheduler:**
   ```bash
   curl -X POST "http://localhost:8000/api/scheduler/start"
   ```

---

## 🔧 Troubleshooting

### Scheduler Not Running

**Check status:**
```bash
curl http://localhost:8000/api/scheduler/status
```

**If `is_running: false`, start it:**
```bash
curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

### No Recipes Being Processed

**Check if recipes are available:**
```bash
curl http://localhost:8000/api/content/generation-stats
```

**If `pending_generation: 0`, all recipes are processed.**

**To reprocess a recipe:**
```python
from src.infrastructure.repository.recipe_repo import RecipeRepository
repo = RecipeRepository()
repo.reset_content_generated(recipe_id=123)
```

---

### Content Generation Failed

**Check logs** for error messages.

**Common issues:**
- Missing `GOOGLE_API_KEY` in `.env`
- Database connection issues
- Invalid recipe data

**Test manually:**
```bash
curl -X POST "http://localhost:8000/api/scheduler/run-now"
```

---

### Change Schedule Time

**Update to run at 2:00 PM:**
```bash
curl -X PUT "http://localhost:8000/api/scheduler/schedule" \
  -H "Content-Type: application/json" \
  -d '{"hour": 14, "minute": 0}'
```

---

## 📈 Progress Tracking

### Daily Progress Check

```bash
# Morning: Check what will run today
curl http://localhost:8000/api/scheduler/status

# Evening: Check if it ran successfully
curl http://localhost:8000/api/scheduler/status

# Check overall progress
curl http://localhost:8000/api/content/generation-stats
```

### Weekly Summary

Track your progress over time:

```bash
# Get status
curl http://localhost:8000/api/scheduler/status

# Example output:
# total_runs: 7 (one per day for a week)
# successful_runs: 7
# failed_runs: 0
```

---

## 🔐 Production Considerations

### 1. Server Uptime

Ensure your server is always running:
- Use a process manager (PM2, systemd)
- Set up auto-restart on failure
- Monitor server health

### 2. Database Backups

- Regular backups of recipe data
- Backup before bulk operations

### 3. API Key Security

- Keep `GOOGLE_API_KEY` in `.env` file
- Never commit `.env` to version control
- Rotate keys periodically

### 4. Logging

- Monitor logs daily
- Set up alerts for failures
- Archive old logs

### 5. Rate Limits

- Google Gemini API has rate limits
- One recipe per day is well within limits
- Monitor API usage

---

## 🎨 Customization Examples

### Example 1: Weekend vs Weekday Content

You can set different schedules for different days (requires manual updates):

**Weekday (Professional):**
```json
{
  "target_platforms": ["linkedin", "twitter"],
  "schedule_hour": 9,
  "tone": "professional and informative"
}
```

**Weekend (Casual):**
```json
{
  "target_platforms": ["instagram", "facebook"],
  "schedule_hour": 10,
  "tone": "warm and inviting"
}
```

---

### Example 2: Seasonal Adjustments

**Summer (Casual & Fun):**
```json
{
  "tone": "casual and fun",
  "include_emojis": true,
  "max_hashtags": 15
}
```

**Winter (Warm & Cozy):**
```json
{
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

## 📚 Related Documentation

- **Batch Generation Guide:** `BATCH_CONTENT_GENERATION_GUIDE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Quick Start:** `QUICK_START_BATCH_GENERATION.md`
- **API Documentation:** http://localhost:8000/docs

---

## ✅ Summary

You now have a fully automated daily content generation system that:

- ✅ Runs automatically every day at your specified time
- ✅ Picks one recipe per day
- ✅ Generates content for all configured platforms
- ✅ Tracks progress and prevents duplicates
- ✅ Provides full monitoring and control
- ✅ Can be tested manually before going live
- ✅ Is production-ready with error handling

**Start your scheduler and enjoy automated content creation!**

```bash
# Initialize
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{"target_platforms": ["instagram", "twitter", "facebook"]}'

# Start
curl -X POST "http://localhost:8000/api/scheduler/start"

# Check status
curl http://localhost:8000/api/scheduler/status
```
