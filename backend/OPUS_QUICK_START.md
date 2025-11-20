# OpusClip - Quick Start

## 🚀 3-Step Setup

### 1. Add API Key
```bash
# Add to .env file
OPUS_API_KEY=your_opus_api_key_here
```

### 2. Start Server
```bash
python -m uvicorn src.app:app --reload
```

### 3. Open Swagger
```
http://localhost:8000/docs
```

Look for **"OpusClip"** section!

---

## 📡 Essential Endpoints

### Create Project
```bash
POST /api/opus/create-project
{
  "video_url": "https://youtube.com/watch?v=VIDEO_ID",
  "curation_model": "ClipAnything",
  "genre": "How-to"
}
```

### Check Status
```bash
GET /api/opus/project/{project_id}/status
```

### Get Clips
```bash
POST /api/opus/project/clips
{
  "project_id": "P1234567890"
}
```

### Create Collection
```bash
POST /api/opus/collections/manage
{
  "action": "create",
  "collection_name": "My Clips"
}
```

### Export Collection
```bash
POST /api/opus/collections/manage
{
  "action": "export",
  "collection_id": "xmAwhhFi0IJt"
}
```

---

## 🎯 What You Get

Each clip includes:
- ✅ Title & description
- ✅ Hashtags
- ✅ Preview URL
- ✅ **Export/Download URL**
- ✅ Duration
- ✅ Keywords

---

## 🆚 Vizard vs OpusClip

| Feature | Vizard | OpusClip |
|---------|--------|----------|
| AI Clipping | ✅ | ✅ |
| Any Video Type | ❌ | ✅ |
| Collections | ❌ | ✅ |
| Templates | ❌ | ✅ |
| Export URLs | ✅ | ✅ |

**Use OpusClip for:**
- Advanced clipping (ClipAnything)
- Collections & organization
- Brand templates
- Any video type (not just talking-head)

---

## 🔄 Quick Workflow

```
1. Create Project → Get project_id
2. Check Status → Wait for "COMPLETE"
3. Get Clips → Get download URLs
4. Create Collection → Organize clips
5. Export → Download all
```

---

## 📚 Full Documentation

- **Complete Guide:** `OPUS_CLIP_GUIDE.md`
- **Implementation:** `OPUS_CLIP_IMPLEMENTATION_SUMMARY.md`
- **Swagger UI:** http://localhost:8000/docs

---

## ✅ You're Ready!

OpusClip is fully integrated with **10 endpoints** and **all features** from the documentation!

Start clipping! 🎥🚀
