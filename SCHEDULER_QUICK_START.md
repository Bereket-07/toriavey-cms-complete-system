# Daily Scheduler - Quick Start

## 🚀 3-Step Setup

### 1. Install & Setup
```bash
pip install -r requirements.txt
python scripts/setup_batch_generation.py
```

### 2. Start Server
```bash
python -m uvicorn src.app:app --reload
```

### 3. Initialize & Start Scheduler
```bash
# Initialize (runs at 9:00 AM daily)
curl -X POST "http://localhost:8000/api/scheduler/initialize" \
  -H "Content-Type: application/json" \
  -d '{"target_platforms": ["instagram", "twitter", "facebook"]}'

# Start
curl -X POST "http://localhost:8000/api/scheduler/start"
```

---

## 📡 Essential Commands

### Check Status
```bash
curl http://localhost:8000/api/scheduler/status
```

### Test Now (Don't Wait for Schedule)
```bash
curl -X POST "http://localhost:8000/api/scheduler/run-now"
```

### Stop Scheduler
```bash
curl -X POST "http://localhost:8000/api/scheduler/stop"
```

### Change Time (e.g., to 10:30 AM)
```bash
curl -X PUT "http://localhost:8000/api/scheduler/schedule" \
  -H "Content-Type: application/json" \
  -d '{"hour": 10, "minute": 30}'
```

---

## 🎯 What It Does

- ✅ Runs **automatically every day** at your specified time
- ✅ Picks **ONE recipe** with `content_generated=False`
- ✅ Generates content for **all configured platforms**
- ✅ Marks recipe as **processed** (content_generated=True)
- ✅ Logs everything for **monitoring**

---

## 📊 Monitor Progress

```bash
# Scheduler status
curl http://localhost:8000/api/scheduler/status

# Overall progress
curl http://localhost:8000/api/content/generation-stats
```

---

## 🎨 Common Configurations

### Morning Instagram & Twitter (8:00 AM)
```json
{
  "target_platforms": ["instagram", "twitter"],
  "schedule_hour": 8,
  "schedule_minute": 0,
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 8
}
```

### Professional LinkedIn (10:00 AM)
```json
{
  "target_platforms": ["linkedin", "facebook"],
  "schedule_hour": 10,
  "schedule_minute": 0,
  "tone": "professional and informative",
  "include_emojis": false,
  "max_hashtags": 5
}
```

### Maximum Reach (9:00 AM)
```json
{
  "target_platforms": ["instagram", "twitter", "facebook", "pinterest", "linkedin"],
  "schedule_hour": 9,
  "schedule_minute": 0,
  "tone": "engaging and friendly",
  "include_emojis": true,
  "max_hashtags": 10
}
```

---

## 🔧 Troubleshooting

### Not Running?
```bash
curl -X POST "http://localhost:8000/api/scheduler/start"
```

### No Recipes?
```bash
curl http://localhost:8000/api/content/generation-stats
```

### Test It First
```bash
curl -X POST "http://localhost:8000/api/scheduler/run-now"
```

---

## 📚 Full Documentation

- **Complete Guide:** `DAILY_SCHEDULER_GUIDE.md`
- **Batch Generation:** `BATCH_CONTENT_GENERATION_GUIDE.md`
- **API Docs:** http://localhost:8000/docs

---

## ✅ You're Ready!

Your scheduler will now automatically generate content for one recipe every day!
