# OpusClip Integration - Complete Guide

## 🎯 Overview

OpusClip is now fully integrated into your CMS! You can choose between **Vizard AI** and **OpusClip** for video processing.

### **OpusClip Features:**
- ✅ **AI Video Clipping** - Automatically extract viral-worthy clips
- ✅ **ClipBasic** - Optimized for talking-head videos
- ✅ **ClipAnything** - Advanced model for ANY video type (vlogs, sports, TV shows, etc.)
- ✅ **Collections** - Organize clips into collections
- ✅ **Export & Download** - Get clips with thumbnails and download URLs
- ✅ **Brand Templates** - Custom styling and captions
- ✅ **Censor Jobs** - Automatically censor inappropriate words
- ✅ **Multi-Platform Support** - YouTube, Vimeo, Google Drive, Zoom, and more
- ✅ **Local Upload** - Upload videos up to 10GB

---

## 🚀 Quick Start

### Step 1: Get Your OpusClip API Key

1. Go to [OpusClip](https://www.opus.pro/)
2. Sign up or log in
3. Navigate to API settings
4. Copy your API key

### Step 2: Add API Key to .env

```bash
OPUS_API_KEY=your_opus_api_key_here
```

### Step 3: Start Server

```bash
python -m uvicorn src.app:app --reload
```

### Step 4: Open Swagger UI

```
http://localhost:8000/docs
```

Look for the **"OpusClip"** section!

---

## 📡 API Endpoints

### 1. Create Clip Project

**Endpoint:** `POST /api/opus/create-project`

Create clips from a video URL.

**Request Body:**
```json
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "title": "My Recipe Video Clips",
  "curation_model": "ClipAnything",
  "clip_durations": [[0, 90], [90, 180]],
  "genre": "Auto",
  "layout_aspect_ratio": "portrait",
  "enable_remove_filler_words": true,
  "notification_email": "your@email.com"
}
```

**Response:**
```json
{
  "success": true,
  "project_id": "P1234567890",
  "stage": "QUEUED",
  "message": "Clip project created successfully. Status: QUEUED"
}
```

**Curation Models:**
- `ClipBasic` - For talking-head videos (podcasts, interviews)
- `ClipAnything` - For ANY video type (vlogs, sports, cooking shows, etc.)

**Genres:**
- `Auto` (recommended)
- `Q&A`
- `Commentary`
- `Marketing`
- `Webinar`
- `Podcast`
- `How-to`
- `Vlog`
- `Gaming`
- And more...

---

### 2. Get Project Status

**Endpoint:** `GET /api/opus/project/{project_id}/status`

Check if your project is complete.

**Response:**
```json
{
  "success": true,
  "project_id": "P1234567890",
  "stage": "COMPLETE",
  "model": "ClipAnything",
  "created_at": "2025-11-05T20:00:00Z",
  "updated_at": "2025-11-05T20:15:00Z"
}
```

**Project Stages:**
- `PENDING` - Waiting to start
- `QUEUED` - In queue
- `IMPORT` - Importing video
- `CURATE` - AI is selecting clips
- `REFINE` - Refining clips
- `RENDER` - Rendering clips
- `UPLOAD` - Uploading clips
- `COMPLETE` - ✅ Ready!
- `STALLED` - Error occurred

---

### 3. Get Project Clips

**Endpoint:** `POST /api/opus/project/clips`

Get all clips from a completed project.

**Request Body:**
```json
{
  "project_id": "P1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "project_id": "P1234567890",
  "stage": "COMPLETE",
  "total_clips": 5,
  "clips": [
    {
      "clip_id": "P1234567890.CU123456",
      "title": "Amazing Chocolate Chip Cookie Recipe",
      "description": "Learn how to make perfect cookies...",
      "hashtags": "#cookies #baking #recipe",
      "duration_ms": 45000,
      "preview_url": "https://cdn.opus.pro/preview.mp4",
      "export_url": "https://cdn.opus.pro/export.mp4",
      "keywords": ["cookies", "baking"],
      "created_at": "2025-11-05T20:15:00Z"
    }
  ]
}
```

**Each clip includes:**
- ✅ Title and description
- ✅ Hashtags
- ✅ Preview URL (for viewing)
- ✅ Export URL (for downloading)
- ✅ Duration
- ✅ Keywords

---

### 4. Share Project

**Endpoint:** `POST /api/opus/project/share`

Make a project public so others can view/edit it.

**Request Body:**
```json
{
  "project_id": "P1234567890",
  "visibility": "PUBLIC"
}
```

---

### 5. Manage Collections

**Endpoint:** `POST /api/opus/collections/manage`

Organize clips into collections.

#### Create Collection

```json
{
  "action": "create",
  "collection_name": "Best Recipe Clips"
}
```

#### Get All Collections

```json
{
  "action": "get"
}
```

#### Add Clip to Collection

```json
{
  "action": "add_clip",
  "collection_id": "xmAwhhFi0IJt",
  "content_id": "P1234567890.CU123456"
}
```

#### Remove Clip from Collection

```json
{
  "action": "remove_clip",
  "collection_id": "xmAwhhFi0IJt",
  "content_id": "P1234567890.CU123456"
}
```

#### Export Collection

```json
{
  "action": "export",
  "collection_id": "xmAwhhFi0IJt"
}
```

**Export Response:**
```json
{
  "success": true,
  "action": "export",
  "total_clips": 10,
  "clips": [
    {
      "contentId": "P1234567890.CU123456",
      "uriForExport": "https://cdn.opus.pro/clip.mp4"
    }
  ]
}
```

#### Delete Collection

```json
{
  "action": "delete",
  "collection_id": "xmAwhhFi0IJt"
}
```

---

### 6. Censor Clip

**Endpoint:** `POST /api/opus/clip/censor`

Automatically censor inappropriate words in a clip.

**Request Body:**
```json
{
  "project_id": "P1234567890",
  "clip_id": "CU123456",
  "beep_sound": true
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "job_abc123",
  "message": "Censor job created successfully"
}
```

---

### 7. Get Censor Job Status

**Endpoint:** `GET /api/opus/censor-job/{job_id}/status`

Check if censoring is complete.

**Response:**
```json
{
  "success": true,
  "job_id": "job_abc123",
  "status": "CONCLUDED",
  "error": null
}
```

**Status Values:**
- `QUEUED` - Waiting
- `PROCESSING` - In progress
- `CONCLUDED` - ✅ Complete
- `FAILED` - Error
- `UNKNOWN` - Unknown status

---

### 8. Get Brand Templates

**Endpoint:** `GET /api/opus/brand-templates`

Get all your custom brand templates.

**Response:**
```json
{
  "success": true,
  "total_templates": 3,
  "templates": [
    {
      "templateId": "cm32g2poc0002t5bnhmg2kfyx",
      "name": "Karaoke Template",
      "isDefault": true,
      "preferences": {
        "layoutAspectRatio": "portrait",
        "enableCaption": true,
        "enableEmoji": true,
        "font": {
          "family": "Komika-axis",
          "color": "#ffffff"
        }
      }
    }
  ]
}
```

---

### 9. Upload Local Video

**Endpoint:** `POST /api/opus/upload-and-create`

Upload a video file from your computer (up to 10GB).

**Request Body:**
```json
{
  "file_path": "/path/to/video.mp4",
  "title": "My Cooking Video",
  "curation_model": "ClipAnything",
  "clip_durations": [[0, 90]],
  "genre": "How-to"
}
```

---

### 10. Health Check

**Endpoint:** `GET /api/opus/health`

Check if OpusClip is configured.

**Response:**
```json
{
  "service": "OpusClip",
  "configured": true,
  "status": "ready"
}
```

---

## 🎨 Use Cases

### Use Case 1: Process YouTube Video

```bash
curl -X POST "http://localhost:8000/api/opus/create-project" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "Recipe Clips",
    "curation_model": "ClipAnything",
    "clip_durations": [[0, 90], [90, 180]],
    "genre": "How-to",
    "layout_aspect_ratio": "portrait",
    "notification_email": "your@email.com"
  }'
```

---

### Use Case 2: Get Clips with Thumbnails

```bash
# Step 1: Create project
curl -X POST "http://localhost:8000/api/opus/create-project" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://youtube.com/watch?v=VIDEO_ID"}'

# Step 2: Wait for completion (check status)
curl "http://localhost:8000/api/opus/project/P1234567890/status"

# Step 3: Get clips
curl -X POST "http://localhost:8000/api/opus/project/clips" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "P1234567890"}'
```

---

### Use Case 3: Organize Clips into Collections

```bash
# Create collection
curl -X POST "http://localhost:8000/api/opus/collections/manage" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "collection_name": "Best Recipe Clips"
  }'

# Add clip to collection
curl -X POST "http://localhost:8000/api/opus/collections/manage" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_clip",
    "collection_id": "xmAwhhFi0IJt",
    "content_id": "P1234567890.CU123456"
  }'

# Export all clips from collection
curl -X POST "http://localhost:8000/api/opus/collections/manage" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "export",
    "collection_id": "xmAwhhFi0IJt"
  }'
```

---

## 🆚 Vizard AI vs OpusClip

| Feature | Vizard AI | OpusClip |
|---------|-----------|----------|
| **AI Clipping** | ✅ | ✅ |
| **Talking-Head Videos** | ✅ | ✅ ClipBasic |
| **Any Video Type** | ❌ | ✅ ClipAnything |
| **Collections** | ❌ | ✅ |
| **Brand Templates** | ❌ | ✅ |
| **Censor Jobs** | ❌ | ✅ |
| **Export URLs** | ✅ | ✅ |
| **Thumbnails** | ✅ | ✅ |
| **Local Upload** | ❌ | ✅ (up to 10GB) |
| **Custom Prompts** | ❌ | ✅ (ClipAnything) |

**Recommendation:**
- Use **Vizard AI** for simple, quick clipping
- Use **OpusClip** for advanced features, collections, and any video type

---

## 🔄 Complete Workflow Example

### Workflow: Process Recipe Video → Get Clips → Organize → Export

```python
import httpx
import asyncio

async def process_recipe_video():
    base_url = "http://localhost:8000"
    
    # Step 1: Create project
    print("Creating project...")
    response = await httpx.post(
        f"{base_url}/api/opus/create-project",
        json={
            "video_url": "https://youtube.com/watch?v=VIDEO_ID",
            "title": "Chocolate Chip Cookie Recipe",
            "curation_model": "ClipAnything",
            "clip_durations": [[0, 90]],
            "genre": "How-to",
            "layout_aspect_ratio": "portrait"
        }
    )
    project_id = response.json()["project_id"]
    print(f"Project created: {project_id}")
    
    # Step 2: Wait for completion
    print("Waiting for completion...")
    while True:
        status_response = await httpx.get(
            f"{base_url}/api/opus/project/{project_id}/status"
        )
        stage = status_response.json()["stage"]
        print(f"Status: {stage}")
        
        if stage == "COMPLETE":
            break
        elif stage == "STALLED":
            print("Error: Project stalled")
            return
        
        await asyncio.sleep(30)  # Check every 30 seconds
    
    # Step 3: Get clips
    print("Getting clips...")
    clips_response = await httpx.post(
        f"{base_url}/api/opus/project/clips",
        json={"project_id": project_id}
    )
    clips = clips_response.json()["clips"]
    print(f"Found {len(clips)} clips")
    
    # Step 4: Create collection
    print("Creating collection...")
    collection_response = await httpx.post(
        f"{base_url}/api/opus/collections/manage",
        json={
            "action": "create",
            "collection_name": "Cookie Recipe Clips"
        }
    )
    collection_id = collection_response.json()["collection"]["collectionId"]
    
    # Step 5: Add clips to collection
    print("Adding clips to collection...")
    for clip in clips:
        await httpx.post(
            f"{base_url}/api/opus/collections/manage",
            json={
                "action": "add_clip",
                "collection_id": collection_id,
                "content_id": clip["clip_id"]
            }
        )
    
    # Step 6: Export collection
    print("Exporting collection...")
    export_response = await httpx.post(
        f"{base_url}/api/opus/collections/manage",
        json={
            "action": "export",
            "collection_id": collection_id
        }
    )
    
    export_clips = export_response.json()["clips"]
    print(f"Exported {len(export_clips)} clips")
    
    # Print download URLs
    for clip in export_clips:
        print(f"Download: {clip['uriForExport']}")

# Run workflow
asyncio.run(process_recipe_video())
```

---

## 📊 Monitoring & Tracking

### Check Project Progress

```bash
# Get status
curl "http://localhost:8000/api/opus/project/P1234567890/status"

# Response shows stage
{
  "stage": "RENDER",  # Currently rendering
  "model": "ClipAnything",
  "created_at": "2025-11-05T20:00:00Z"
}
```

### Track Collections

```bash
# Get all collections
curl -X POST "http://localhost:8000/api/opus/collections/manage" \
  -H "Content-Type: application/json" \
  -d '{"action": "get"}'
```

---

## 🔧 Troubleshooting

### Issue: "OpusClip API key not configured"

**Solution:** Add `OPUS_API_KEY` to your `.env` file

```bash
OPUS_API_KEY=your_actual_api_key_here
```

---

### Issue: Project stuck in "QUEUED"

**Solution:** OpusClip is processing. Wait a few minutes and check status again.

---

### Issue: "Project is not complete yet"

**Solution:** Wait for project to reach "COMPLETE" stage before getting clips.

---

### Issue: No clips returned

**Solution:** Check project status. If "COMPLETE", the video may not have suitable clips.

---

## ✅ Summary

You now have **full OpusClip integration** with:

✅ **AI Video Clipping** - ClipBasic & ClipAnything
✅ **Collections** - Organize and manage clips
✅ **Export & Download** - Get clips with URLs
✅ **Brand Templates** - Custom styling
✅ **Censor Jobs** - Auto-censor inappropriate words
✅ **Local Upload** - Upload videos up to 10GB
✅ **Multi-Platform** - YouTube, Vimeo, Google Drive, etc.

**Choose your provider:**
- **Vizard AI** - Simple, fast clipping
- **OpusClip** - Advanced features, collections, any video type

**Start using OpusClip:**
```bash
# Add API key to .env
OPUS_API_KEY=your_key_here

# Start server
python -m uvicorn src.app:app --reload

# Open Swagger
http://localhost:8000/docs
```

**Happy clipping! 🎥🚀**
