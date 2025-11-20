# WPRM CMS Frontend Guide

## ✅ **Frontend Now Matches Backend!**

The frontend has been completely updated to integrate with your **WordPress Recipe Maker (WPRM)** backend.

---

## 🌐 **New Frontend Pages (Public Access - No Login)**

### **1. WPRM Recipes** 📚
```
http://localhost:5173/cms/recipes
```

**Features:**
- Browse all WPRM recipes from your WordPress database
- Search recipes by title
- View recipe details (prep time, cook time, servings)
- See content generation status for each recipe
- **Generate content** button for recipes without content
- Pagination support (20 recipes per page)

**Status Badges:**
- 🟡 **Not Generated** - No content yet
- 🔵 **Generated** - Content created, needs review
- 🟢 **Pending** - Approved, ready to post
- 🟣 **Posted** - Already posted to social media
- 🔴 **Declined** - Rejected, needs regeneration

---

### **2. Review Content** ✅
```
http://localhost:5173/cms/review
```

**Features:**
- View all generated content waiting for review
- See AI-generated captions for each platform (Instagram, Twitter, Facebook)
- View alternative caption options
- See hashtags and platform-specific hooks/CTAs
- **Approve** content (moves to pending queue)
- **Decline** content with optional reason (will be regenerated)

**Content Display:**
- Main caption + alternative captions
- Hashtags
- Platform-specific hooks, CTAs, highlights
- Recipe information

---

### **3. Statistics** 📊
```
http://localhost:5173/cms/stats
```

**Features:**
- Total recipes count
- Content generated count
- Pending generation count
- Completion percentage
- Status breakdown with progress bars:
  - Not Generated
  - Generated (Awaiting Review)
  - Pending (Ready to Post)
  - Posted
  - Declined
- Success metrics (approval rate, posting rate)

---

## 🔗 **Backend Endpoints Used**

The frontend now correctly uses these backend endpoints:

### **Recipe Management:**
```
GET  /api/content/wprm-recipes?limit=20&offset=0
GET  /api/content/wprm-recipes/search/{query}
```

### **Content Generation:**
```
POST /api/wprm-scheduler/generate-single
```
**Request:**
```json
{
  "recipe_id": 123,
  "target_platforms": ["instagram", "twitter", "facebook"],
  "tone": "warm and inviting",
  "include_emojis": true,
  "max_hashtags": 10
}
```

### **Content Review:**
```
GET  /api/content/wprm-recipes-generated-not-posted?limit=20
POST /api/content/wprm-approve-content/{recipe_id}
POST /api/content/wprm-decline-content/{recipe_id}?reason=NotSuitable
```

### **Statistics:**
```
GET  /api/content/wprm-status-summary
```
**Response:**
```json
{
  "total_recipes": 500,
  "content_generated": 150,
  "pending_generation": 350,
  "completion_percentage": 30.0,
  "by_status": {
    "not_generated": 350,
    "generated": 50,
    "pending": 75,
    "posted": 25
  }
}
```

---

## 🎯 **Complete Workflow**

```
1. WPRM Recipes Page
   ↓
   Browse recipes from WordPress database
   ↓
2. Click "Generate Content" for a recipe
   ↓
   AI generates platform-specific content
   ↓
3. Content appears in "Review Content" page
   ↓
   Review generated captions, hashtags, etc.
   ↓
4. Approve or Decline
   ↓
   If Approved → Moves to "pending" status (ready to post)
   If Declined → Status reset to regenerate
   ↓
5. Statistics show real-time progress
   ↓
6. Post content to social media (future feature)
```

---

## 🚀 **How to Start**

### **Terminal 1 - Backend:**
```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS\backend"
.venv\Scripts\activate
uvicorn src.app:app --reload --port 7000
```

### **Terminal 2 - Frontend:**
```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS\frontend\tori-data-garden"
npm run dev
```

### **Browser:**
```
http://localhost:5173/cms/recipes
```

**No login required!** Start managing content immediately.

---

## 📱 **Navigation**

Top navigation tabs:

```
┌────────────────────────────────────────┐
│  Tori Avey CMS                         │
├────────────────────────────────────────┤
│  WPRM Recipes │ Review Content │ Stats │
└────────────────────────────────────────┘
```

---

## 🎨 **UI Features**

### **Recipe Cards:**
- Recipe title and summary
- Prep time, cook time, servings
- Status badge (color-coded)
- Generate button (for not_generated status)
- Review button (for generated status)

### **Review Interface:**
- Platform-specific content display
- Instagram, Twitter, Facebook tabs
- Alternative captions with selection
- Hashtag display
- Platform-specific hooks/CTAs
- Large approve/decline buttons

### **Statistics Dashboard:**
- Overview cards with icons
- Progress bars for each status
- Completion percentage gauge
- Success metrics
- Visual breakdown of recipe statuses

---

## 📊 **Status Tracking**

The frontend now properly tracks these WPRM content statuses:

| Status | Description | Action Available |
|--------|-------------|------------------|
| `not_generated` | Recipe needs content | Generate Content |
| `generated` | Content created, awaiting review | Review Content |
| `pending` | Approved, ready to post | Ready to Post |
| `posted` | Already posted | View Posted |
| `declined` | Rejected, needs regeneration | Regenerate |

---

## ✨ **Key Features**

✅ **WPRM Integration** - Direct connection to WordPress Recipe Maker  
✅ **Real-time Status** - See generation status for each recipe  
✅ **Search & Browse** - Find recipes easily  
✅ **AI Review** - Review generated content before posting  
✅ **Alternative Captions** - Multiple caption options to choose from  
✅ **Approval Workflow** - Approve/decline with reasons  
✅ **Statistics Dashboard** - Track progress and metrics  
✅ **No Authentication** - Public CMS access  
✅ **Responsive Design** - Works on all screen sizes  

---

## 🔧 **Configuration**

### **Frontend (.env)**
```bash
VITE_CMS_BACKEND_URL=http://localhost:7000
VITE_ANALYTICS_BACKEND_URL=http://localhost:8000
```

---

## 📝 **Example Usage**

### **1. Generate Content for a Recipe:**

1. Visit: http://localhost:5173/cms/recipes
2. Find a recipe with "Not Generated" status
3. Click **"Generate Content"** button
4. Wait for generation (uses Google Gemini AI)
5. Content appears in review queue

### **2. Review and Approve Content:**

1. Visit: http://localhost:5173/cms/review
2. See all recipes with generated content
3. Review captions, hashtags for each platform
4. Click **"Approve & Move to Pending"**
5. Content is ready for posting!

### **3. View Statistics:**

1. Visit: http://localhost:5173/cms/stats
2. See total recipes and completion percentage
3. View status breakdown
4. Track progress over time

---

## 🎯 **What Was Changed**

### **Removed:**
❌ Generic `ContentGeneration.tsx`  
❌ Generic `ContentPending.tsx`  
❌ Generic `ContentStats.tsx`  

### **Added:**
✅ `WPRMRecipes.tsx` - Browse WPRM recipes  
✅ `WPRMReview.tsx` - Review generated content  
✅ `WPRMStats.tsx` - WPRM-specific statistics  

### **Updated:**
🔄 Routes to use new pages  
🔄 Navigation to reflect WPRM workflow  
🔄 All API calls to use correct WPRM endpoints  

---

## 📚 **Technical Details**

### **API Integration:**
- Uses `CMS_BACKEND_URL` environment variable
- Fetches from `/api/content/wprm-*` endpoints
- Handles WPRM-specific data structures
- Properly parses generated_content JSON

### **State Management:**
- React hooks (useState, useEffect)
- Toast notifications for user feedback
- Loading states for async operations

### **UI Components:**
- shadcn/ui components
- Tailwind CSS styling
- Lucide icons
- Responsive design

---

## 🎉 **Summary**

Your frontend CMS now perfectly matches your WPRM backend!

✅ **Browse WPRM recipes** from WordPress  
✅ **Generate content** with AI (Gemini)  
✅ **Review generated content** with alternatives  
✅ **Approve/decline** with workflow  
✅ **Track statistics** in real-time  
✅ **No authentication required** for CMS  
✅ **Clean, modern UI** with Tailwind CSS  

Start using it now: **http://localhost:5173/cms/recipes** 🚀
