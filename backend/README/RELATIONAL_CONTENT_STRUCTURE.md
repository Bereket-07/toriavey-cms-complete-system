# WPRM Content - New Relational Database Structure

## 🎯 Overview

We've redesigned the content storage to use a proper relational structure instead of storing JSON blobs. This provides better scalability, queryability, and data integrity.

---

## 📊 Database Schema

### **Old Structure (JSON Blob)**
```
wprm_content_status
├── recipe_id
├── status (one status for all platforms)
└── generated_content (JSON blob with all platforms)
```

**Problems:**
- ❌ Can't query individual platforms
- ❌ Can't have different status per platform
- ❌ Hard to reuse content
- ❌ JSON parsing overhead
- ❌ No proper indexing

---

### **New Structure (Relational)**

#### **Table 1: `wprm_content_status`** (Overall Tracking)
```sql
wprm_content_status
├── id (PK)
├── recipe_id (FK → wp_tori_posts.ID)
├── status (overall status: not_generated, in_progress, completed)
├── generation_date
├── last_updated
└── notes
```

#### **Table 2: `wprm_generated_content`** (Content Storage)
```sql
wprm_generated_content
├── id (PK)
├── recipe_id (FK → wp_tori_posts.ID)
├── platform (instagram, tiktok, facebook, etc.)
├── content (JSON - platform-specific structure)
├── status (generated, pending, posted, declined, failed)
├── generated_at
├── updated_at
├── posted_at
├── parsed (boolean)
├── fallback_used (boolean)
├── post_id (social media post ID)
├── post_url (URL to posted content)
├── error_message
├── retry_count
└── UNIQUE(recipe_id, platform)
```

---

## 🔗 Relationships

```
wp_tori_posts (WordPress)
    ↓ (1:1)
wprm_content_status (Overall tracking)
    ↓ (1:N)
wprm_generated_content (Per-platform content)
    - One record per platform per recipe
    - Each with its own status
```

---

## ✅ Benefits

### **1. Independent Platform Status**
```sql
-- Recipe 123 can have:
- Instagram: posted ✅
- TikTok: pending ⏳
- Facebook: declined ❌
- Twitter: generated 📝
```

### **2. Easy Queries**
```sql
-- Get all Instagram content ready to post
SELECT * FROM wprm_generated_content 
WHERE platform = 'instagram' AND status = 'pending';

-- Get all content for a recipe
SELECT * FROM wprm_generated_content 
WHERE recipe_id = 123;

-- Get recipes with at least one posted platform
SELECT DISTINCT recipe_id FROM wprm_generated_content 
WHERE status = 'posted';
```

### **3. Content Reusability**
- Keep declined content for reference
- Regenerate specific platforms without affecting others
- Track posting history per platform

### **4. Better Performance**
- Proper indexes on recipe_id, platform, status
- No JSON parsing for queries
- Efficient joins

---

## 📝 Content Structure Per Platform

### **Instagram**
```json
{
  "caption": "🍽️ Tahini Sauce...",
  "hashtags": ["tahini", "sauce", "recipe"],
  "hook": "Try this amazing recipe!",
  "cta": "Save for later!",
  "image_url": "https://..."
}
```

### **TikTok**
```json
{
  "caption": "Easy Tahini Sauce! 🔥",
  "hashtags": ["tahini", "recipe", "cooking"],
  "video_hook": "Watch how easy this is!",
  "video_url": "https://..."
}
```

### **Facebook**
```json
{
  "post": "Check out this delicious Tahini Sauce recipe...",
  "hashtags": ["recipe", "cooking"],
  "link": "https://toriavey.com/recipe/..."
}
```

---

## 🔄 Status Flow

### **Per Platform:**
```
not_generated → generated → pending → posted
                    ↓
                declined
                    ↓
                 failed
```

### **Overall Recipe Status:**
```
not_generated → in_progress → completed
```

---

## 🚀 Migration Steps

### **Step 1: Create New Table**
```bash
python scripts/create_wprm_generated_content_table.py
```

This will:
1. Create `wprm_generated_content` table
2. Ask if you want to migrate existing data
3. Convert JSON blobs to relational records

---

### **Step 2: Verify Migration**
```sql
-- Check migrated data
SELECT recipe_id, platform, status, parsed 
FROM wprm_generated_content 
LIMIT 10;

-- Count records per platform
SELECT platform, COUNT(*) as count 
FROM wprm_generated_content 
GROUP BY platform;

-- Check status distribution
SELECT status, COUNT(*) as count 
FROM wprm_generated_content 
GROUP BY status;
```

---

### **Step 3: Update Code**
The repository and use cases will be updated to use the new structure:
- `WPRMGeneratedContentRepository` - New repository for relational content
- `WPRMContentStatusRepository` - Updated for overall tracking
- `GenerateWPRMContentUseCase` - Updated to save per-platform

---

## 📊 Example Queries

### **Get Recipes Ready to Post on Instagram**
```python
repo = WPRMGeneratedContentRepository()
content = repo.get_content_by_status('pending')
instagram_content = [c for c in content if c.platform == 'instagram']
```

### **Get All Content for a Recipe**
```python
repo = WPRMGeneratedContentRepository()
all_content = repo.get_content_by_recipe(recipe_id=123)

# Group by platform
content_by_platform = {c.platform: c for c in all_content}
```

### **Update Status for Specific Platform**
```python
repo = WPRMGeneratedContentRepository()
repo.update_status(
    recipe_id=123,
    platform='instagram',
    status='posted'
)
```

### **Mark as Posted with Details**
```python
repo = WPRMGeneratedContentRepository()
repo.mark_as_posted(
    recipe_id=123,
    platform='instagram',
    post_id='ABC123',
    post_url='https://instagram.com/p/ABC123'
)
```

---

## 🎯 API Endpoints (Updated)

### **Get Content by Recipe**
```http
GET /api/content/wprm-recipe-content/{recipe_id}
```

**Response:**
```json
{
  "recipe_id": 123,
  "content": [
    {
      "platform": "instagram",
      "status": "posted",
      "content": {...},
      "posted_at": "2025-11-06T12:00:00",
      "post_url": "https://instagram.com/p/ABC123"
    },
    {
      "platform": "tiktok",
      "status": "pending",
      "content": {...}
    }
  ]
}
```

### **Get Content by Platform & Status**
```http
GET /api/content/wprm-content-by-platform?platform=instagram&status=pending
```

### **Update Platform Status**
```http
POST /api/content/wprm-update-platform-status
{
  "recipe_id": 123,
  "platform": "instagram",
  "status": "posted",
  "post_id": "ABC123",
  "post_url": "https://instagram.com/p/ABC123"
}
```

---

## 🔧 Repository Methods

### **WPRMGeneratedContentRepository**

#### **Create/Update Content**
```python
create_content(recipe_id, platform, content, status, parsed, fallback_used)
```

#### **Query Methods**
```python
get_content_by_recipe(recipe_id)
get_content_by_recipe_platform(recipe_id, platform)
get_content_by_status(status, limit, offset)
get_recipes_by_status(status, limit, offset)
```

#### **Update Methods**
```python
update_status(recipe_id, platform, status)
update_all_platforms_status(recipe_id, status)
mark_as_posted(recipe_id, platform, post_id, post_url)
```

#### **Delete Methods**
```python
delete_content(recipe_id, platform=None)  # Delete all or specific platform
```

#### **Analytics**
```python
get_status_summary()  # Get counts by status
```

---

## 📈 Performance Improvements

### **Indexes**
```sql
-- Primary queries
INDEX idx_recipe_id (recipe_id)
INDEX idx_platform (platform)
INDEX idx_status (status)

-- Composite queries
INDEX idx_recipe_platform (recipe_id, platform)
INDEX idx_recipe_status (recipe_id, status)

-- Unique constraint
UNIQUE KEY unique_recipe_platform (recipe_id, platform)
```

### **Query Performance**
- ✅ No JSON parsing overhead
- ✅ Efficient filtering by platform/status
- ✅ Fast joins with recipe table
- ✅ Proper indexing for common queries

---

## 🧪 Testing

### **1. Create Table**
```bash
python scripts/create_wprm_generated_content_table.py
```

### **2. Test Repository**
```python
from src.infrastructure.repository.wprm_generated_content_repo import WPRMGeneratedContentRepository

repo = WPRMGeneratedContentRepository()

# Create content
repo.create_content(
    recipe_id=123,
    platform='instagram',
    content={'caption': 'Test', 'hashtags': ['test']},
    status='generated',
    parsed=True
)

# Query
content = repo.get_content_by_recipe(123)
print(content)
```

### **3. Test API**
```bash
# Get content for recipe
curl http://localhost:8000/api/content/wprm-recipe-content/123

# Update status
curl -X POST http://localhost:8000/api/content/wprm-update-platform-status \
  -H "Content-Type: application/json" \
  -d '{"recipe_id": 123, "platform": "instagram", "status": "posted"}'
```

---

## ✅ Summary

### **Old System:**
- ❌ JSON blob storage
- ❌ One status for all platforms
- ❌ Hard to query
- ❌ No platform independence

### **New System:**
- ✅ Relational structure
- ✅ Independent platform status
- ✅ Easy queries
- ✅ Reusable content
- ✅ Better performance
- ✅ Proper tracking

**The new structure is production-ready and scalable!** 🚀
