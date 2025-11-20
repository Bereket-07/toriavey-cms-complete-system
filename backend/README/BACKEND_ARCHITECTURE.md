# Backend Architecture - Two Backend System

## 🏗️ Overview

Your application uses **two separate backends** for different purposes:

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              (localhost:5173)                       │
│                                                     │
│  ┌──────────────┐          ┌──────────────────┐   │
│  │ Content CMS  │          │    Analytics     │   │
│  │   Pages      │          │     Pages        │   │
│  └──────┬───────┘          └────────┬─────────┘   │
│         │                            │             │
└─────────┼────────────────────────────┼─────────────┘
          │                            │
          │                            │
          ▼                            ▼
  ┌───────────────┐          ┌─────────────────┐
  │  CMS Backend  │          │ Analytics       │
  │  Port: 7000   │          │ Backend         │
  │               │          │ Port: 8000      │
  │ - Generate    │          │ - Google        │
  │   Content     │          │   Analytics     │
  │ - Approve/    │          │ - Mediavine     │
  │   Reject      │          │ - ConvertKit    │
  │ - Stats       │          │ - Etc.          │
  └───────────────┘          └─────────────────┘
```

---

## 🎯 **Backend Separation**

### **CMS Backend (Port 7000)**

**Purpose:** Content Management System - AI-powered social media content generation

**Features:**
- ✨ Generate social media content from recipes
- ⏰ Review and approve/reject content
- 📊 View content statistics
- 📅 Schedule content
- ⚙️ Content settings

**Technologies:**
- FastAPI
- Google Gemini AI (LLM)
- Composio (Social Media APIs)
- Python 3.12+

**Endpoints:**
- `POST /api/content/generate` - Generate content
- `GET /api/content/pending` - Get pending content
- `POST /api/content/approve` - Approve content
- `POST /api/content/reject` - Reject content
- `GET /api/content/stats` - Get statistics
- `GET /health` - Health check
- `GET /docs` - API documentation

---

### **Analytics Backend (Port 8000)**

**Purpose:** Analytics and third-party integrations

**Features:**
- 📊 Google Analytics
- 💰 Mediavine revenue
- 🔍 Search Console
- 📧 ConvertKit email marketing
- 📌 Pinterest analytics
- ✨ Slickstream engagement
- 💌 Sparkloop newsletter

**Technologies:**
- Your existing analytics backend
- Google Analytics API
- Mediavine API
- Various third-party integrations

---

## 🔧 **Configuration**

### **Backend (.env)**

```bash
# CMS Backend - Run on port 7000
# Located in: ToriAveysCMS/.env

GOOGLE_API_KEY=your_google_api_key_here
COMPOSIO_API_KEY=your_composio_api_key_here
```

**Run Command:**
```bash
uvicorn src.app:app --reload --port 7000
```

---

### **Frontend (.env)**

```bash
# Frontend - Connects to BOTH backends
# Located in: frontend/tori-data-garden/.env

# CMS Backend (Content Management)
VITE_CMS_BACKEND_URL=http://localhost:7000

# Analytics Backend (Analytics features)
VITE_ANALYTICS_BACKEND_URL=http://localhost:8000

# Other configs
VITE_GA4_PROPERTY_ID=YOUR_GA4_PROPERTY_ID
Cal_key=your_calendar_api_key_here
```

---

## 🚀 **Running Both Backends**

### **Option 1: Separate Terminals**

**Terminal 1 - CMS Backend:**
```bash
cd "ToriAveysCMS"
.venv\Scripts\activate
uvicorn src.app:app --reload --port 7000
```

**Terminal 2 - Analytics Backend:**
```bash
cd "path/to/analytics/backend"
# Run your analytics backend on port 8000
```

**Terminal 3 - Frontend:**
```bash
cd "ToriAveysCMS/frontend/tori-data-garden"
npm run dev
```

---

### **Option 2: Single Backend (If you want to merge them)**

If you want to run everything on a single backend, you can:

1. Keep CMS backend as is
2. Update frontend `.env`:
   ```bash
   VITE_CMS_BACKEND_URL=http://localhost:8000
   VITE_ANALYTICS_BACKEND_URL=http://localhost:8000
   ```
3. Run backend on port 8000:
   ```bash
   uvicorn src.app:app --reload --port 8000
   ```

---

## 📂 **File Structure**

```
ToriAveysCMS/
├── src/                              # CMS Backend (Port 7000)
│   ├── app.py
│   ├── controllers/
│   │   └── content_controller.py
│   └── use_cases/
│       └── generate_content.py
├── .env                             # CMS Backend config
└── requirements.txt

frontend/
└── tori-data-garden/
    ├── src/
    │   ├── pages/
    │   │   ├── ContentGeneration.tsx    # Uses CMS Backend (7000)
    │   │   ├── ContentPending.tsx       # Uses CMS Backend (7000)
    │   │   ├── ContentStats.tsx         # Uses CMS Backend (7000)
    │   │   ├── GoogleAnalytics.tsx      # Uses Analytics Backend (8000)
    │   │   ├── Mediavine.tsx            # Uses Analytics Backend (8000)
    │   │   └── SocialMedia.tsx          # Uses Analytics Backend (8000)
    │   └── App.tsx
    └── .env                              # Frontend config (both backend URLs)
```

---

## 🔀 **Data Flow**

### **Content Generation Flow (CMS Backend)**

```
User Input (Frontend)
    ↓
ContentGeneration.tsx
    ↓
POST http://localhost:7000/api/content/generate
    ↓
CMS Backend
    ↓
Google Gemini AI
    ↓
Generated Content
    ↓
Frontend Display
```

### **Analytics Flow (Analytics Backend)**

```
User Request (Frontend)
    ↓
GoogleAnalytics.tsx
    ↓
GET http://localhost:8000/api/analytics/data
    ↓
Analytics Backend
    ↓
Google Analytics API
    ↓
Analytics Data
    ↓
Frontend Display
```

---

## ✅ **Benefits of Separation**

1. **Modularity** - Each backend has a specific purpose
2. **Scalability** - Scale CMS and analytics independently
3. **Maintenance** - Update one without affecting the other
4. **Performance** - Distribute load across two servers
5. **Development** - Work on features independently
6. **Deployment** - Deploy to different servers/services

---

## 🎯 **Port Assignments**

| Service | Port | Purpose |
|---------|------|---------|
| CMS Backend | 7000 | Content Management & AI Generation |
| Analytics Backend | 8000 | Analytics & Third-party Integrations |
| Frontend | 5173 | User Interface (React) |

---

## 🔍 **Testing Both Backends**

### **CMS Backend Test:**

```bash
# Health check
curl http://localhost:7000/health

# API docs
open http://localhost:7000/docs

# Generate content (test endpoint)
curl -X POST "http://localhost:7000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{"recipe_data": {"title": "Test"}, "target_platforms": ["instagram"]}'
```

### **Analytics Backend Test:**

```bash
# Health check
curl http://localhost:8000/health

# API docs (if available)
open http://localhost:8000/docs
```

---

## 🛠️ **Troubleshooting**

### **Port Already in Use**

```bash
# Check what's using port 7000
netstat -ano | findstr :7000

# Kill the process
taskkill /PID <process_id> /F

# Or use a different port
uvicorn src.app:app --reload --port 7001
```

### **Frontend Can't Connect**

1. Check both backends are running
2. Verify `.env` has correct URLs:
   - `VITE_CMS_BACKEND_URL=http://localhost:7000`
   - `VITE_ANALYTICS_BACKEND_URL=http://localhost:8000`
3. Check browser console for CORS errors
4. Restart frontend: `npm run dev`

### **CORS Issues**

If you get CORS errors, ensure your backend has CORS middleware configured:

```python
# In your FastAPI app
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📚 **Documentation**

- **CMS API:** http://localhost:7000/docs
- **Analytics API:** http://localhost:8000/docs (if available)
- **Frontend:** http://localhost:5173

---

## 🎉 **Summary**

✅ **Two Backends:**
- CMS Backend (Port 7000) - Content generation
- Analytics Backend (Port 8000) - Analytics features

✅ **One Frontend:**
- Connects to BOTH backends
- Routes content requests to port 7000
- Routes analytics requests to port 8000

✅ **Environment Variables:**
- `VITE_CMS_BACKEND_URL` - Points to CMS backend (7000)
- `VITE_ANALYTICS_BACKEND_URL` - Points to analytics backend (8000)

This architecture provides flexibility, scalability, and clear separation of concerns! 🚀
