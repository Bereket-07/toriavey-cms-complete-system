# Content Generation API - Complete Guide

AI-powered social media content generation from recipes using LLM (Google Gemini).

## 🎯 Overview

This feature automatically:
1. **Scrapes** recipe data from any website
2. **Generates** platform-optimized captions and hashtags using AI
3. **Allows** manual editing and regeneration
4. **Posts** approved content to social media platforms

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
pip install fastapi uvicorn httpx beautifulsoup4 langchain-google-genai

# Set environment variables
export GOOGLE_API_KEY=your_gemini_api_key
export COMPOSIO_API_KEY=your_composio_key
```

### Start the Server

```bash
python src/app.py
# or
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

Access API docs: http://localhost:8000/docs

---

## 📋 Complete Workflow

### Step 1: Generate Content from Recipe URL

**Endpoint**: `POST /api/content/generate`

```bash
curl -X POST "http://localhost:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_url": "https://toriavey.com/toris-kitchen/chocolate-chip-cookies/",
    "target_platforms": ["instagram", "twitter", "threads"],
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 10,
    "custom_instructions": "Emphasize the family-friendly aspect"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Generated content for 3 platform(s)",
  "generated_contents": [
    {
      "id": 1,
      "recipe_id": 123,
      "content_type": "recipe_post",
      "caption": "🍪 The BEST Chocolate Chip Cookies you'll ever make!\n\nCrispy edges, chewy centers, and loaded with chocolate chips. This family recipe has been perfected over generations and it's finally yours to try! ✨\n\nPerfect for:\n✅ Weekend baking with kids\n✅ Holiday cookie exchanges\n✅ Anytime you need a sweet treat\n\nSave this recipe and tag us when you make them! 👇",
      "hashtags": "#chocolatechipcookies #baking #homemade #cookies #recipe #dessert #foodie #bakinglove #familyrecipe #sweettooth",
      "image_url": "https://toriavey.com/images/cookies.jpg",
      "target_platform": "instagram",
      "status": "pending",
      "created_at": "2025-10-27T20:00:00Z"
    }
  ],
  "recipe": {
    "id": 123,
    "title": "Classic Chocolate Chip Cookies",
    "url": "https://toriavey.com/toris-kitchen/chocolate-chip-cookies/",
    "description": "The best chocolate chip cookie recipe...",
    "ingredients": ["2 cups flour", "1 cup butter", "..."],
    "prep_time": "15 minutes",
    "cook_time": "12 minutes"
  },
  "total_generated": 3
}
```

### Step 2: View Pending Content

**Endpoint**: `GET /api/content/pending`

```bash
curl -X GET "http://localhost:8000/api/content/pending"
```

**Response**:
```json
{
  "total_pending": 15,
  "contents": [
    {
      "content": {
        "id": 1,
        "caption": "🍪 The BEST Chocolate Chip Cookies...",
        "hashtags": "#chocolatechipcookies #baking...",
        "target_platform": "instagram",
        "status": "pending"
      },
      "recipe": {
        "title": "Classic Chocolate Chip Cookies",
        "image_url": "https://..."
      },
      "social_posts": []
    }
  ],
  "grouped_by_recipe": {
    "Classic Chocolate Chip Cookies": [
      {"id": 1, "platform": "instagram"},
      {"id": 2, "platform": "twitter"},
      {"id": 3, "platform": "threads"}
    ]
  }
}
```

### Step 3: Edit Content (Optional)

**Endpoint**: `POST /api/content/edit`

```bash
curl -X POST "http://localhost:8000/api/content/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "caption": "🍪 Updated caption with more personality!",
    "hashtags": "#cookies #baking #homemade",
    "edited_by": 123
  }'
```

### Step 4: Regenerate Content (Optional)

**Endpoint**: `POST /api/content/regenerate`

If you're not satisfied with the generated content, regenerate with different parameters:

```bash
curl -X POST "http://localhost:8000/api/content/regenerate" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "tone": "professional and educational",
    "include_emojis": false,
    "max_hashtags": 5,
    "custom_instructions": "Focus on health benefits and nutritional value"
  }'
```

### Step 5: Approve Content

**Endpoint**: `POST /api/content/approve`

```bash
curl -X POST "http://localhost:8000/api/content/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "approved_by": 123
  }'
```

### Step 6: Reject Content (Optional)

**Endpoint**: `POST /api/content/reject`

```bash
curl -X POST "http://localhost:8000/api/content/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 2,
    "rejection_reason": "Caption doesn't match brand voice",
    "rejected_by": 123
  }'
```

### Step 7: Post to Social Media

**Endpoint**: `POST /api/content/post`

```bash
curl -X POST "http://localhost:8000/api/content/post" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "platforms": ["instagram", "twitter"],
    "posted_by": 123
  }'
```

**With Scheduling**:
```bash
curl -X POST "http://localhost:8000/api/content/post" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "platforms": ["instagram"],
    "schedule_for": "2025-10-28T14:00:00Z",
    "posted_by": 123
  }'
```

---

## 🔄 Batch Operations

### Generate Content from Multiple Recipes

**Endpoint**: `POST /api/content/generate-batch`

```bash
curl -X POST "http://localhost:8000/api/content/generate-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_urls": [
      "https://toriavey.com/recipe1/",
      "https://toriavey.com/recipe2/",
      "https://toriavey.com/recipe3/"
    ],
    "target_platforms": ["instagram", "twitter", "facebook"],
    "batch_name": "Weekly Recipe Posts",
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

### Bulk Approve

**Endpoint**: `POST /api/content/bulk-approve`

```bash
curl -X POST "http://localhost:8000/api/content/bulk-approve?approved_by=123" \
  -H "Content-Type: application/json" \
  -d '[1, 2, 3, 4, 5]'
```

### Bulk Post

**Endpoint**: `POST /api/content/bulk-post`

```bash
curl -X POST "http://localhost:8000/api/content/bulk-post?posted_by=123" \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": [1, 2, 3],
    "platforms": ["instagram", "twitter"]
  }'
```

---

## 📊 Analytics & Stats

### Get Content Statistics

**Endpoint**: `GET /api/content/stats`

```bash
curl -X GET "http://localhost:8000/api/content/stats"
```

**Response**:
```json
{
  "total_generated": 150,
  "pending": 25,
  "approved": 75,
  "rejected": 10,
  "posted": 40,
  "by_platform": {
    "instagram": 50,
    "twitter": 45,
    "threads": 30,
    "facebook": 25
  },
  "by_status": {
    "pending": 25,
    "approved": 75,
    "rejected": 10,
    "posted": 40
  },
  "recent_posts": [...]
}
```

---

## 🎨 Platform-Specific Optimizations

The AI automatically optimizes content for each platform:

### Instagram
- **Caption Length**: 150-300 characters
- **Style**: Visual storytelling, engaging hook
- **Hashtags**: 5-10 relevant tags
- **CTA**: Save, share, try this recipe
- **Emojis**: Strategic use to break up text

### Twitter/X
- **Character Limit**: Under 280 characters
- **Style**: Punchy, attention-grabbing
- **Hashtags**: 2-3 max
- **CTA**: Question or engagement driver

### Threads
- **Length**: 1-3 short paragraphs
- **Style**: Conversational, authentic
- **Hashtags**: 3-5 tags
- **CTA**: Encourage discussion

### Facebook
- **Length**: 300-500 characters
- **Style**: Story-driven, personal
- **Hashtags**: 3-5 tags
- **CTA**: Ask questions for comments

### LinkedIn
- **Style**: Professional yet approachable
- **Focus**: Health benefits, cooking tips, cultural aspects
- **Hashtags**: 2-3 professional tags
- **Angle**: Educational

### Pinterest
- **Style**: SEO-focused description
- **Content**: Key ingredients and benefits
- **Hashtags**: 5-8 descriptive tags
- **Format**: Clear recipe type in first line

---

## 🐍 Python Client Example

```python
import httpx
import asyncio

class ContentGeneratorClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def generate_content(self, recipe_url, platforms):
        """Generate content from recipe URL"""
        response = await self.client.post(
            f"{self.base_url}/api/content/generate",
            json={
                "recipe_url": recipe_url,
                "target_platforms": platforms,
                "tone": "engaging and friendly",
                "include_emojis": True,
                "max_hashtags": 10
            }
        )
        return response.json()
    
    async def get_pending_content(self):
        """Get all pending content"""
        response = await self.client.get(
            f"{self.base_url}/api/content/pending"
        )
        return response.json()
    
    async def edit_content(self, content_id, caption=None, hashtags=None):
        """Edit content"""
        response = await self.client.post(
            f"{self.base_url}/api/content/edit",
            json={
                "content_id": content_id,
                "caption": caption,
                "hashtags": hashtags
            }
        )
        return response.json()
    
    async def approve_content(self, content_id):
        """Approve content"""
        response = await self.client.post(
            f"{self.base_url}/api/content/approve",
            json={"content_id": content_id}
        )
        return response.json()
    
    async def post_content(self, content_id, platforms):
        """Post content to platforms"""
        response = await self.client.post(
            f"{self.base_url}/api/content/post",
            json={
                "content_id": content_id,
                "platforms": platforms
            }
        )
        return response.json()


# Usage
async def main():
    client = ContentGeneratorClient()
    
    # 1. Generate content
    result = await client.generate_content(
        recipe_url="https://toriavey.com/recipe/cookies/",
        platforms=["instagram", "twitter", "threads"]
    )
    print("Generated:", result)
    
    # 2. Get pending content
    pending = await client.get_pending_content()
    print(f"Pending: {pending['total_pending']}")
    
    # 3. Edit if needed
    if pending['contents']:
        content_id = pending['contents'][0]['content']['id']
        await client.edit_content(
            content_id=content_id,
            caption="Updated caption!"
        )
    
    # 4. Approve
    await client.approve_content(content_id)
    
    # 5. Post
    result = await client.post_content(
        content_id=content_id,
        platforms=["instagram", "twitter"]
    )
    print("Posted:", result)

asyncio.run(main())
```

---

## 🌐 JavaScript/TypeScript Client

```typescript
class ContentGeneratorClient {
  constructor(private baseUrl: string = 'http://localhost:8000') {}
  
  async generateContent(recipeUrl: string, platforms: string[]) {
    const response = await fetch(`${this.baseUrl}/api/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe_url: recipeUrl,
        target_platforms: platforms,
        tone: 'engaging and friendly',
        include_emojis: true,
        max_hashtags: 10
      })
    });
    return response.json();
  }
  
  async getPendingContent() {
    const response = await fetch(`${this.baseUrl}/api/content/pending`);
    return response.json();
  }
  
  async editContent(contentId: number, updates: any) {
    const response = await fetch(`${this.baseUrl}/api/content/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id: contentId,
        ...updates
      })
    });
    return response.json();
  }
  
  async approveContent(contentId: number) {
    const response = await fetch(`${this.baseUrl}/api/content/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId })
    });
    return response.json();
  }
  
  async postContent(contentId: number, platforms: string[]) {
    const response = await fetch(`${this.baseUrl}/api/content/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id: contentId,
        platforms: platforms
      })
    });
    return response.json();
  }
}

// Usage
const client = new ContentGeneratorClient();

// Generate content
const result = await client.generateContent(
  'https://toriavey.com/recipe/cookies/',
  ['instagram', 'twitter', 'threads']
);

console.log('Generated:', result);
```

---

## 🎨 React Dashboard Example

```jsx
import { useState, useEffect } from 'react';

function ContentDashboard() {
  const [pendingContent, setPendingContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  
  useEffect(() => {
    fetchPendingContent();
  }, []);
  
  const fetchPendingContent = async () => {
    const response = await fetch('http://localhost:8000/api/content/pending');
    const data = await response.json();
    setPendingContent(data.contents);
  };
  
  const editContent = async (contentId, updates) => {
    await fetch('http://localhost:8000/api/content/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, ...updates })
    });
    fetchPendingContent();
  };
  
  const approveContent = async (contentId) => {
    await fetch('http://localhost:8000/api/content/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId })
    });
    fetchPendingContent();
  };
  
  const rejectContent = async (contentId, reason) => {
    await fetch('http://localhost:8000/api/content/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, rejection_reason: reason })
    });
    fetchPendingContent();
  };
  
  const postContent = async (contentId, platforms) => {
    const response = await fetch('http://localhost:8000/api/content/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId, platforms })
    });
    const result = await response.json();
    alert(`Posted to ${result.posted_platforms.length} platform(s)`);
    fetchPendingContent();
  };
  
  return (
    <div className="content-dashboard">
      <h1>Pending Content ({pendingContent.length})</h1>
      
      <div className="content-grid">
        {pendingContent.map(({ content, recipe }) => (
          <div key={content.id} className="content-card">
            <img src={recipe.image_url} alt={recipe.title} />
            
            <div className="content-details">
              <h3>{recipe.title}</h3>
              <span className="platform-badge">{content.target_platform}</span>
              
              <div className="caption">
                <textarea
                  value={content.caption}
                  onChange={(e) => editContent(content.id, { caption: e.target.value })}
                  rows={6}
                />
              </div>
              
              <div className="hashtags">
                <input
                  type="text"
                  value={content.hashtags}
                  onChange={(e) => editContent(content.id, { hashtags: e.target.value })}
                  placeholder="Hashtags..."
                />
              </div>
              
              <div className="actions">
                <button onClick={() => approveContent(content.id)} className="btn-approve">
                  ✅ Approve
                </button>
                <button onClick={() => rejectContent(content.id, 'Not suitable')} className="btn-reject">
                  ❌ Reject
                </button>
                <button onClick={() => postContent(content.id, [content.target_platform])} className="btn-post">
                  🚀 Post Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 Environment Variables

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Composio (for social media posting)
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID=your_instagram_config
COMPOSIO_TWITTER_AUTH_CONFIG_ID=your_twitter_config

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost/toriavey_cms

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 🏗️ Architecture

```
User submits recipe URL
    ↓
Recipe Scraper extracts data (schema.org + HTML fallback)
    ↓
LLM (Gemini) generates platform-optimized content
    ↓
Content saved to database with "pending" status
    ↓
User reviews in dashboard
    ↓
User can: Edit, Regenerate, Approve, or Reject
    ↓
Approved content posted to social media via Composio
    ↓
Post status tracked in database
```

---

## 🚀 Next Steps

1. **Add Database Persistence**: Implement SQLModel/SQLAlchemy
2. **Add Authentication**: JWT-based auth for API
3. **Implement Social Media APIs**: Instagram, Twitter, Threads posting
4. **Add Image Generation**: DALL-E/Midjourney for custom images
5. **Add Scheduling**: Advanced post scheduling with optimal times
6. **Add Analytics**: Track engagement metrics
7. **Add A/B Testing**: Test different captions/hashtags
8. **Add Templates**: Custom templates for different content types

---

## 🐛 Troubleshooting

### Issue: "Recipe scraping failed"
- Check if the website has schema.org Recipe markup
- Try a different recipe URL
- Check network connectivity

### Issue: "LLM generation failed"
- Verify GOOGLE_API_KEY is set correctly
- Check Gemini API quota/limits
- Review error logs for details

### Issue: "Content not saving"
- Database connection not configured yet (TODO)
- Currently returns mock data

---

## 📞 Support

- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/content/health
- Logs: Check console output for detailed error messages

Happy content creating! 🎉✨
