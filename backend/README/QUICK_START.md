# Quick Start Guide - Full Stack CMS

Get your backend CMS and frontend running together in 5 minutes!

---

## 🚀 **Quick Start**

### **Step 1: Start CMS Backend** (Terminal 1)

```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS"

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start CMS backend server on port 7000
uvicorn src.app:app --reload --port 7000
```

✅ CMS Backend runs on: **http://localhost:7000**

**Note:** If you have an analytics backend, run it separately on port 8000

---

### **Step 2: Start Frontend** (Terminal 2)

```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS\frontend\tori-data-garden"

# Install dependencies (first time only)
npm install

# Create .env file with both backend URLs
echo VITE_CMS_BACKEND_URL=http://localhost:7000 > .env
echo VITE_ANALYTICS_BACKEND_URL=http://localhost:8000 >> .env

# Start frontend
npm run dev
```

✅ Frontend runs on: **http://localhost:5173**

---

## 🎯 **Access the Application**

1. **Open Browser:** http://localhost:5173
2. **Login** (if required)
3. **Navigate to Content CMS** section in sidebar

### **New Content CMS Pages:**
- 🪄 **Generate Content** - Create AI-powered social media posts
- ⏰ **Pending Review** - Review and approve generated content
- 📊 **Statistics** - View content performance metrics
- 📅 **Schedule** - Schedule posts
- 🗓️ **Calendar** - View content calendar
- ⚙️ **Settings** - Configure content settings

---

## ✨ **Try It Out**

### **Generate Your First Content:**

1. Click **"Generate Content"** in sidebar
2. Enter recipe details:
   - Title: "Classic Chocolate Chip Cookies"
   - Description: "The best cookies ever!"
   - Prep Time: "15 minutes"
   - Cook Time: "12 minutes"
3. Select platforms: **Instagram**, **Twitter**
4. Click **"Generate Content"**
5. 🎉 See AI-generated captions with alternatives!
6. **Select your preferred caption** by clicking the radio buttons
7. Review platform-specific hooks, CTAs, and image suggestions

### **Review and Approve:**

1. Click **"Pending Review"** in sidebar
2. See your generated content
3. Click **"Approve"** or **"Reject"**
4. Content moves to approved queue

### **View Statistics:**

1. Click **"Statistics"** in sidebar
2. See total generated, pending, approved, posted counts
3. View platform distribution charts
4. Check approval and posting rates

---

## 🔧 **Configuration**

### **Backend (.env)**

```bash
GOOGLE_API_KEY=your_google_api_key_here
COMPOSIO_API_KEY=your_composio_api_key_here
```

### **Frontend (.env)**

```bash
# CMS Backend (Content Management)
VITE_CMS_BACKEND_URL=http://localhost:7000

# Analytics Backend (Google Analytics, Mediavine, etc.)
VITE_ANALYTICS_BACKEND_URL=http://localhost:8000

VITE_GA4_PROPERTY_ID=YOUR_GA4_PROPERTY_ID
Cal_key=your_calendar_api_key_here
```

---

## 📊 **API Documentation**

Once CMS backend is running, access:
- **Swagger UI:** http://localhost:7000/docs
- **ReDoc:** http://localhost:7000/redoc

Test endpoints directly from the browser!

---

## 🐛 **Troubleshooting**

### Backend Won't Start

```bash
# Check if port 7000 is in use
netstat -ano | findstr :7000

# Kill the process if needed
taskkill /PID <process_id> /F

# Or use a different port
uvicorn src.app:app --reload --port 7001
```

### Frontend Can't Connect

1. Check CMS backend is running: http://localhost:7000/health
2. Verify `.env` has correct `VITE_CMS_BACKEND_URL=http://localhost:7000`
3. Check browser console for CORS errors
4. Ensure analytics backend is on port 8000 if using analytics features

### Module Not Found Errors (Backend)

```bash
# Reinstall dependencies
pip install -r requirements.txt

# Or install specific package
pip install fastapi uvicorn langchain-google-genai
```

### Module Not Found Errors (Frontend)

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 **File Structure**

```
ToriAveysCMS/
├── src/                              # Backend
│   ├── app.py                       # FastAPI application
│   ├── controllers/
│   │   └── content_controller.py    # Content API endpoints
│   ├── use_cases/
│   │   └── generate_content.py      # Content generation logic
│   └── domain/
│       └── schemas/
│           └── content_schemas.py   # Request/response schemas
├── frontend/
│   └── tori-data-garden/            # Frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── ContentGeneration.tsx  # Generate page
│       │   │   ├── ContentPending.tsx     # Pending page
│       │   │   └── ContentStats.tsx       # Stats page
│       │   ├── components/
│       │   │   └── AppSidebar.tsx         # Sidebar menu
│       │   └── App.tsx                    # Routes
│       └── .env                     # Frontend config
├── requirements.txt                 # Python dependencies
├── .env                            # Backend config
└── QUICK_START.md                  # This file
```

---

## 🎯 **Workflow**

```
1. User enters recipe data
   ↓
2. Frontend sends to backend
   ↓
3. Backend calls Google Gemini AI
   ↓
4. AI generates platform-specific content
   ↓
5. Frontend displays content with alternatives
   ↓
6. User selects preferred captions
   ↓
7. User approves/rejects content
   ↓
8. Approved content ready for posting
```

---

## 🚦 **Health Checks**

### CMS Backend Health

```bash
curl http://localhost:7000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "toriavey-cms",
  "version": "1.0.0"
}
```

### Analytics Backend Health (if separate)

```bash
curl http://localhost:8000/health
```

### Frontend Health

Open: http://localhost:5173

Should see the Tori Avey Analytics Dashboard

---

## 📚 **Documentation**

- **Backend API:** See `/docs` endpoint
- **Frontend Integration:** `BACKEND_INTEGRATION.md`
- **Content Generation Guide:** `CONTENT_GENERATION_USAGE.md`
- **Caption Selection:** `CAPTION_SELECTION_GUIDE.md`
- **Testing:** `TESTING_GUIDE.md`

---

## ✅ **Checklist**

- [ ] CMS Backend running on port 7000
- [ ] Analytics Backend running on port 8000 (if separate)
- [ ] Frontend running on port 5173
- [ ] `.env` files configured (both backend and frontend)
- [ ] Can access CMS docs at http://localhost:7000/docs
- [ ] Can access frontend at http://localhost:5173
- [ ] Content CMS menu visible in sidebar
- [ ] Can generate content successfully
- [ ] Can select alternative captions
- [ ] Can approve/reject content
- [ ] Can view statistics

---

## 🎉 **You're All Set!**

Your full-stack CMS is ready to use! Start generating amazing social media content powered by AI.

**Need Help?**
- Check `FRONTEND_INTEGRATION_SUMMARY.md` for detailed changes
- See `BACKEND_INTEGRATION.md` for API documentation
- Review `TESTING_GUIDE.md` for testing instructions

Happy content creating! 🚀
