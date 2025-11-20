# CMS Access Guide - No Authentication Required

## 🚀 Quick Access

The CMS is now **publicly accessible** without login! Just run the frontend and backend, then access the URLs below.

---

## 🌐 **Frontend URLs (Public Access)**

Once the frontend is running on `http://localhost:5173`, access these pages directly:

### **Content Generation**
```
http://localhost:5173/cms/generate
```
- Generate AI-powered social media content from recipes
- Select platforms (Instagram, Twitter, Facebook, LinkedIn, Threads)
- Customize tone, emojis, and hashtags
- **Choose alternative captions**

### **Pending Review**
```
http://localhost:5173/cms/pending
```
- View all pending generated content
- Approve or reject content
- See platform-specific previews

### **Statistics**
```
http://localhost:5173/cms/stats
```
- View content generation statistics
- Platform distribution charts
- Approval rates and metrics

### **Schedule**
```
http://localhost:5173/cms/schedule
```
- Schedule content for posting
- Manage posting queue

### **Calendar**
```
http://localhost:5173/cms/calendar
```
- View content calendar
- See scheduled posts

### **Settings**
```
http://localhost:5173/cms/settings
```
- Configure content management settings

---

## 🔗 **Backend API Endpoints**

Backend runs on `http://localhost:7000`

### **Core CMS Endpoints (WPRM Recipes)**

### **1. Generate Content from Recipe**

**Endpoint:**
```
POST http://localhost:7000/api/content/generate
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Classic Chocolate Chip Cookies",
      "description": "The best chocolate chip cookies with crispy edges and chewy centers",
      "ingredients": ["flour", "butter", "chocolate chips", "sugar", "eggs"],
      "instructions": ["Mix ingredients", "Bake at 350F", "Cool and enjoy"],
      "prep_time": "15 minutes",
      "cook_time": "12 minutes",
      "servings": "24 cookies",
      "cuisine": "American",
      "category": "Dessert",
      "tags": ["cookies", "dessert", "baking"]
    },
    "target_platforms": ["instagram", "twitter"],
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Generated content for 2 platform(s)",
  "generated_contents": [
    {
      "platform": "instagram",
      "caption": "🍪 Cookie craving? Satisfy it with these Classic Chocolate Chip Cookies!",
      "hashtags": ["cookies", "baking", "dessert"],
      "platform_specific": {
        "hook": "Warning: May cause extreme cookie cravings!",
        "cta": "Save this recipe!",
        "key_highlight": "Ready in 30 minutes"
      },
      "image_suggestions": ["Close-up of cookies", "Overhead shot"],
      "alternative_captions": [
        "The BEST chocolate chip cookie recipe you'll ever need! 🍪",
        "Happiness is a warm chocolate chip cookie. 😊"
      ],
      "selected_caption_index": 0
    }
  ],
  "total_generated": 2
}
```

---

### **2. Get Pending Content**

**Endpoint:**
```
GET http://localhost:7000/api/content/pending
```

**Example Request:**
```bash
curl -X GET "http://localhost:7000/api/content/pending"
```

---

### **3. Approve Content**

**Endpoint:**
```
POST http://localhost:7000/api/content/approve
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/content/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "approved_by": 123
  }'
```

---

### **4. Reject Content**

**Endpoint:**
```
POST http://localhost:7000/api/content/reject
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/content/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 1,
    "rejection_reason": "Not suitable for brand voice",
    "rejected_by": 123
  }'
```

---

### **5. Get Statistics**

**Endpoint:**
```
GET http://localhost:7000/api/content/stats
```

**Example Request:**
```bash
curl -X GET "http://localhost:7000/api/content/stats"
```

---

### **6. Select Alternative Caption**

**Endpoint:**
```
POST http://localhost:7000/api/content/select-caption
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/content/select-caption" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "caption_index": 1
  }'
```

---

### **7. Health Check**

**Endpoint:**
```
GET http://localhost:7000/health
```

**Example Request:**
```bash
curl http://localhost:7000/health
```

---

### **8. Get WPRM Recipes**

**Endpoint:**
```
GET http://localhost:7000/api/content/wprm-recipes?limit=20&offset=0
```

**Example Request:**
```bash
curl "http://localhost:7000/api/content/wprm-recipes?limit=20"
```

---

### **9. Get Recipes Needing Generation**

**Endpoint:**
```
GET http://localhost:7000/api/content/wprm-recipes-not-generated?limit=10
```

**Example Request:**
```bash
curl "http://localhost:7000/api/content/wprm-recipes-not-generated?limit=10"
```

---

### **10. Approve WPRM Content**

**Endpoint:**
```
POST http://localhost:7000/api/content/wprm-approve-content/{recipe_id}
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/content/wprm-approve-content/123"
```

---

### **11. Get WPRM Status Summary**

**Endpoint:**
```
GET http://localhost:7000/api/content/wprm-status-summary
```

**Example Request:**
```bash
curl "http://localhost:7000/api/content/wprm-status-summary"
```

---

### **12. Generate Single Recipe (Scheduler)**

**Endpoint:**
```
POST http://localhost:7000/api/wprm-scheduler/generate-single
```

**Example Request:**
```bash
curl -X POST "http://localhost:7000/api/wprm-scheduler/generate-single" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_id": 123,
    "target_platforms": ["instagram", "twitter"],
    "tone": "casual",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

---

### **13. API Documentation (Swagger)**

**Interactive API Docs:**
```
http://localhost:7000/docs
```

**ReDoc:**
```
http://localhost:7000/redoc
```

---

## 🚀 **How to Start Everything**

### **Step 1: Start Backend** (Terminal 1)

```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS"
.venv\Scripts\activate
uvicorn src.app:app --reload --port 7000
```

✅ Backend: `http://localhost:7000`

---

### **Step 2: Start Frontend** (Terminal 2)

```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS\frontend\tori-data-garden"
npm run dev
```

✅ Frontend: `http://localhost:5173`

---

### **Step 3: Access CMS (Browser)**

Open your browser and go to:

```
http://localhost:5173/cms/generate
```

🎉 **No login required!** Start generating content immediately.

---

## 📱 **Navigation**

The CMS has a top navigation bar with tabs:

```
┌────────────────────────────────────────────────────────┐
│  Tori Avey CMS                                         │
├────────────────────────────────────────────────────────┤
│  Generate Content │ Pending Review │ Statistics │ ... │
└────────────────────────────────────────────────────────┘
```

Click any tab to navigate between pages.

---

## 🎯 **Complete Workflow Example**

### **1. Generate Content**

Visit: `http://localhost:5173/cms/generate`

1. Enter recipe details:
   - Title: "Classic Chocolate Chip Cookies"
   - Description: "The best cookies ever!"
   - Prep Time: "15 minutes"
   - Cook Time: "12 minutes"

2. Select platforms:
   - ✅ Instagram
   - ✅ Twitter

3. Click **"Generate Content"**

4. See generated content with multiple caption options

5. Select your preferred caption

---

### **2. Review Pending Content**

Visit: `http://localhost:5173/cms/pending`

1. View all generated content
2. Click **"Approve"** or **"Reject"**
3. Content moves to appropriate queue

---

### **3. View Statistics**

Visit: `http://localhost:5173/cms/stats`

1. See total generated, pending, approved counts
2. View platform distribution
3. Check approval rates

---

## 🧪 **Testing with cURL**

### **Test Content Generation:**

```bash
curl -X POST "http://localhost:7000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Test Recipe",
      "description": "A test recipe"
    },
    "target_platforms": ["instagram"],
    "tone": "casual",
    "include_emojis": true,
    "max_hashtags": 5
  }'
```

### **Test Health Check:**

```bash
curl http://localhost:7000/health
```

---

## 📋 **Supported Platforms**

- 📸 **Instagram** - Visual, engaging content
- 🐦 **Twitter** - Concise, thread-ready
- 🧵 **Threads** - Conversational style
- 📘 **Facebook** - Community-focused
- 💼 **LinkedIn** - Professional tone

---

## 🎨 **Alternative Captions**

Every generation includes:
- **1 Main Caption** - The primary suggestion
- **2+ Alternative Captions** - Different variations

You can select your preferred caption by clicking the radio button next to it.

---

## 📊 **API Response Format**

All API responses follow this structure:

### **Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### **Error Response:**
```json
{
  "detail": "Error message here"
}
```

---

## 🔧 **Configuration**

### **Backend (.env)**
```bash
GOOGLE_API_KEY=your_google_api_key_here
COMPOSIO_API_KEY=your_composio_api_key_here
```

### **Frontend (.env)**
```bash
VITE_CMS_BACKEND_URL=http://localhost:7000
VITE_ANALYTICS_BACKEND_URL=http://localhost:8000
```

---

## 🐛 **Troubleshooting**

### **Can't Access Frontend**

1. Check frontend is running: `http://localhost:5173`
2. Try: `npm run dev` in frontend folder
3. Clear browser cache

### **Can't Connect to Backend**

1. Check backend is running: `http://localhost:7000/health`
2. Start backend: `uvicorn src.app:app --reload --port 7000`
3. Check `.env` file exists with API keys

### **CORS Errors**

If you see CORS errors in browser console:
1. Backend should have CORS middleware enabled
2. Check backend logs for errors
3. Try restarting both backend and frontend

---

## 📚 **Quick Links**

### **Frontend URLs:**
- Generate: http://localhost:5173/cms/generate
- Pending: http://localhost:5173/cms/pending
- Stats: http://localhost:5173/cms/stats
- Schedule: http://localhost:5173/cms/schedule
- Calendar: http://localhost:5173/cms/calendar
- Settings: http://localhost:5173/cms/settings

### **Backend URLs:**
- API Docs: http://localhost:7000/docs
- ReDoc: http://localhost:7000/redoc
- Health: http://localhost:7000/health

### **API Endpoints:**
- POST `/api/content/generate` - Generate content from recipe
- GET `/api/content/pending` - Get pending content
- POST `/api/content/approve` - Approve content
- POST `/api/content/reject` - Reject content
- GET `/api/content/stats` - Get statistics
- POST `/api/content/select-caption` - Select alternative caption
- GET `/api/content/wprm-recipes` - Get WPRM recipes
- GET `/api/content/wprm-recipes-not-generated` - Get recipes needing generation
- POST `/api/content/wprm-approve-content/{id}` - Approve WPRM content
- POST `/api/content/wprm-decline-content/{id}` - Decline WPRM content
- GET `/api/content/wprm-status-summary` - Get status summary
- POST `/api/wprm-scheduler/generate-single` - Generate single recipe
- POST `/api/wprm-scheduler/generate-batch` - Generate batch recipes

---

## ✅ **Summary**

✅ **No authentication required** - Access CMS directly  
✅ **Public URLs** - Start at `/cms/*`  
✅ **Backend API** - Running on port 7000  
✅ **Frontend** - Running on port 5173  
✅ **Navigation** - Top tabs for easy access  
✅ **Full features** - Generate, review, approve, statistics  

Start using the CMS immediately! 🚀
