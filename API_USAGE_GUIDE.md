# Tori Avey CMS - API Usage Guide

Complete guide for using the FastAPI endpoints to manage video clips and social media posting.

## 🚀 Quick Start

### 1. Start the Server

```bash
# Install dependencies
pip install fastapi uvicorn httpx sqlmodel

# Run the server
python src/app.py

# Or use uvicorn directly
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

### 2. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📋 Complete Workflow

### Step 1: Generate Clips from Video

**Endpoint**: `POST /api/clips/generate`

Generate clips for specific platforms:

```bash
curl -X POST "http://localhost:8000/api/clips/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "source_type": "youtube",
    "target_platforms": ["youtube_shorts", "tiktok", "instagram_reels"],
    "language": "en",
    "max_clips_per_platform": 5,
    "keywords": "cooking, recipe, tutorial",
    "project_name": "Cooking Tutorial Clips"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Clip generation started successfully. Check back soon for results.",
  "vizard_project_id": null,
  "total_clips_requested": 15,
  "platforms": ["youtube_shorts", "tiktok", "instagram_reels"]
}
```

### Step 2: Generate for ALL Platforms (Quick Method)

**Endpoint**: `POST /api/clips/generate-all`

```bash
curl -X POST "http://localhost:8000/api/clips/generate-all?video_url=https://www.youtube.com/watch?v=example&source_type=youtube&language=en&max_clips=5&keywords=tutorial"
```

This generates clips for:
- YouTube Shorts
- TikTok
- Instagram Reels
- Facebook Reels
- LinkedIn
- Twitter/X

### Step 3: View Pending Clips

**Endpoint**: `GET /api/clips/pending`

```bash
curl -X GET "http://localhost:8000/api/clips/pending"
```

**Response**:
```json
{
  "total_pending": 15,
  "clips": [
    {
      "clip": {
        "id": 1,
        "vizard_project_id": "proj_abc123",
        "clip_url": "https://cdn.vizard.ai/clips/clip1.mp4",
        "thumbnail_url": "https://cdn.vizard.ai/thumbs/thumb1.jpg",
        "source_video_url": "https://www.youtube.com/watch?v=example",
        "source_platform": "youtube",
        "title": "Amazing Cooking Tip #1",
        "description": "Learn this quick cooking hack",
        "duration": 45,
        "keywords": "cooking, recipe",
        "target_platforms": ["youtube_shorts", "tiktok"],
        "status": "pending",
        "created_at": "2025-10-27T20:00:00Z",
        "updated_at": "2025-10-27T20:00:00Z"
      },
      "social_posts": []
    }
  ]
}
```

### Step 4: Approve a Clip

**Endpoint**: `POST /api/clips/approve`

```bash
curl -X POST "http://localhost:8000/api/clips/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "clip_id": 1,
    "approved_by": 123
  }'
```

**Response**:
```json
{
  "success": true,
  "clip_id": 1,
  "status": "approved",
  "approved_at": "2025-10-27T20:30:00Z",
  "approved_by": 123
}
```

### Step 5: Reject a Clip (Optional)

**Endpoint**: `POST /api/clips/reject`

```bash
curl -X POST "http://localhost:8000/api/clips/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "clip_id": 2,
    "rejection_reason": "Poor audio quality",
    "rejected_by": 123
  }'
```

### Step 6: Post Approved Clip to Social Media

**Endpoint**: `POST /api/clips/post`

```bash
curl -X POST "http://localhost:8000/api/clips/post" \
  -H "Content-Type: application/json" \
  -d '{
    "clip_id": 1,
    "platforms": ["youtube_shorts", "tiktok"],
    "custom_caption": "Check out this amazing cooking tip! 🍳",
    "custom_hashtags": "#cooking #recipe #foodie #tutorial"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Posted to 1 platform(s)",
  "clip_id": 1,
  "posted_platforms": ["youtube_shorts"],
  "failed_platforms": [
    {
      "platform": "tiktok",
      "error": "TikTok API integration pending"
    }
  ]
}
```

---

## 🎯 API Endpoints Reference

### Clip Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clips/generate` | POST | Generate clips for specific platforms |
| `/api/clips/generate-all` | POST | Generate clips for ALL platforms |

### Clip Review

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clips/pending` | GET | Get all pending clips |
| `/api/clips/clip/{clip_id}` | GET | Get specific clip details |
| `/api/clips/approve` | POST | Approve a clip |
| `/api/clips/reject` | POST | Reject a clip |

### Posting

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clips/post` | POST | Post approved clip to social media |

### System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/api/clips/health` | GET | Clips service health |

---

## 📝 Request Schemas

### CreateClipsRequest

```json
{
  "video_url": "string (required)",
  "source_type": "youtube|tiktok|vimeo|facebook|linkedin|twitter|twitch|loom|google_drive|streamyard|rumble|remote_file",
  "target_platforms": ["youtube_shorts", "tiktok", "instagram_reels", "facebook_reels", "linkedin", "twitter"],
  "language": "en (default)",
  "max_clips_per_platform": 5,
  "keywords": "optional string",
  "project_name": "optional string",
  "file_extension": "optional (required for remote_file)"
}
```

### PostClipRequest

```json
{
  "clip_id": 123,
  "platforms": ["youtube_shorts", "tiktok"],
  "custom_caption": "optional string",
  "custom_hashtags": "optional string",
  "schedule_for": "optional datetime"
}
```

---

## 🔧 Python Client Example

```python
import httpx
import asyncio

class ToriAveyCMSClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def generate_clips(self, video_url, platforms, language="en"):
        """Generate clips from video"""
        response = await self.client.post(
            f"{self.base_url}/api/clips/generate",
            json={
                "video_url": video_url,
                "source_type": "youtube",
                "target_platforms": platforms,
                "language": language,
                "max_clips_per_platform": 5
            }
        )
        return response.json()
    
    async def get_pending_clips(self):
        """Get all pending clips"""
        response = await self.client.get(
            f"{self.base_url}/api/clips/pending"
        )
        return response.json()
    
    async def approve_clip(self, clip_id):
        """Approve a clip"""
        response = await self.client.post(
            f"{self.base_url}/api/clips/approve",
            json={"clip_id": clip_id}
        )
        return response.json()
    
    async def post_clip(self, clip_id, platforms):
        """Post clip to social media"""
        response = await self.client.post(
            f"{self.base_url}/api/clips/post",
            json={
                "clip_id": clip_id,
                "platforms": platforms
            }
        )
        return response.json()


# Usage
async def main():
    client = ToriAveyCMSClient()
    
    # 1. Generate clips
    result = await client.generate_clips(
        video_url="https://www.youtube.com/watch?v=example",
        platforms=["youtube_shorts", "tiktok", "instagram_reels"]
    )
    print("Generated:", result)
    
    # 2. Wait for processing...
    await asyncio.sleep(60)
    
    # 3. Get pending clips
    pending = await client.get_pending_clips()
    print(f"Pending clips: {pending['total_pending']}")
    
    # 4. Approve first clip
    if pending['clips']:
        clip_id = pending['clips'][0]['clip']['id']
        await client.approve_clip(clip_id)
        
        # 5. Post to social media
        result = await client.post_clip(
            clip_id=clip_id,
            platforms=["youtube_shorts"]
        )
        print("Posted:", result)

asyncio.run(main())
```

---

## 🌐 JavaScript/TypeScript Client Example

```typescript
class ToriAveyCMSClient {
  constructor(private baseUrl: string = 'http://localhost:8000') {}
  
  async generateClips(videoUrl: string, platforms: string[]) {
    const response = await fetch(`${this.baseUrl}/api/clips/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: videoUrl,
        source_type: 'youtube',
        target_platforms: platforms,
        language: 'en',
        max_clips_per_platform: 5
      })
    });
    return response.json();
  }
  
  async getPendingClips() {
    const response = await fetch(`${this.baseUrl}/api/clips/pending`);
    return response.json();
  }
  
  async approveClip(clipId: number) {
    const response = await fetch(`${this.baseUrl}/api/clips/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clipId })
    });
    return response.json();
  }
  
  async postClip(clipId: number, platforms: string[]) {
    const response = await fetch(`${this.baseUrl}/api/clips/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clip_id: clipId,
        platforms: platforms
      })
    });
    return response.json();
  }
}

// Usage
const client = new ToriAveyCMSClient();

// Generate clips
const result = await client.generateClips(
  'https://www.youtube.com/watch?v=example',
  ['youtube_shorts', 'tiktok', 'instagram_reels']
);

console.log('Generated:', result);
```

---

## 🎨 Frontend Dashboard Integration

### React Example

```jsx
import { useState, useEffect } from 'react';

function ClipsDashboard() {
  const [pendingClips, setPendingClips] = useState([]);
  
  useEffect(() => {
    fetchPendingClips();
  }, []);
  
  const fetchPendingClips = async () => {
    const response = await fetch('http://localhost:8000/api/clips/pending');
    const data = await response.json();
    setPendingClips(data.clips);
  };
  
  const approveClip = async (clipId) => {
    await fetch('http://localhost:8000/api/clips/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clipId })
    });
    fetchPendingClips(); // Refresh
  };
  
  const rejectClip = async (clipId, reason) => {
    await fetch('http://localhost:8000/api/clips/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clipId, rejection_reason: reason })
    });
    fetchPendingClips(); // Refresh
  };
  
  const postClip = async (clipId, platforms) => {
    const response = await fetch('http://localhost:8000/api/clips/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_id: clipId, platforms })
    });
    const result = await response.json();
    alert(`Posted to ${result.posted_platforms.length} platform(s)`);
  };
  
  return (
    <div>
      <h1>Pending Clips ({pendingClips.length})</h1>
      {pendingClips.map(({ clip }) => (
        <div key={clip.id} className="clip-card">
          <video src={clip.clip_url} controls />
          <h3>{clip.title}</h3>
          <p>{clip.description}</p>
          <div className="platforms">
            {clip.target_platforms.map(p => (
              <span key={p} className="badge">{p}</span>
            ))}
          </div>
          <div className="actions">
            <button onClick={() => approveClip(clip.id)}>✅ Approve</button>
            <button onClick={() => rejectClip(clip.id, 'Not suitable')}>❌ Reject</button>
            <button onClick={() => postClip(clip.id, clip.target_platforms)}>🚀 Post</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Environment Variables

Add to your `.env` file:

```env
# Vizard AI
VIZARD_API_KEY=your_vizard_api_key

# Composio (for social media posting)
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_YOUTUBE_AUTH_CONFIG_ID=your_youtube_auth_config_id

# Database (optional, for persistence)
DATABASE_URL=postgresql://user:pass@localhost/toriavey_cms

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 📊 Architecture Flow

```
1. User submits video URL
   ↓
2. API calls Vizard AI to generate clips
   ↓
3. Clips are stored in database with "pending" status
   ↓
4. User reviews clips in dashboard
   ↓
5. User approves/rejects clips
   ↓
6. Approved clips are posted to social media via Composio
   ↓
7. Post status is tracked in database
```

---

## 🚀 Next Steps

1. **Add Database**: Implement SQLModel/SQLAlchemy for persistence
2. **Add Authentication**: JWT-based auth for API endpoints
3. **Add Webhooks**: Receive notifications from Vizard when clips are ready
4. **Add Scheduling**: Schedule posts for optimal times
5. **Add Analytics**: Track post performance across platforms
6. **Add Templates**: Custom templates for different content types

---

## 🐛 Troubleshooting

### Issue: "Module not found"
```bash
# Make sure you're in the project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue: "Connection refused"
```bash
# Check if server is running
curl http://localhost:8000/health
```

### Issue: "Vizard API key invalid"
```bash
# Verify your .env file has the correct key
echo $VIZARD_API_KEY
```

---

## 📞 Support

For issues or questions:
- Check API docs at `/docs`
- Review logs for error messages
- Ensure all environment variables are set
- Verify API keys are valid

Happy clipping! 🎬✨
