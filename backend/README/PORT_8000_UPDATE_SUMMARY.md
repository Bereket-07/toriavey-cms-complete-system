# ✅ Backend URL Updated to Port 8000

All frontend and documentation files have been updated to use **port 8000** for your CMS backend.

---

## 🔧 **What Was Updated**

### **Frontend Configuration**

#### **.env.example**
```bash
VITE_CMS_BACKEND_URL=http://127.0.0.1:8000
```

#### **Frontend Pages (Default Fallback)**
- `WPRMRecipes.tsx` → `http://127.0.0.1:8000`
- `WPRMReview.tsx` → `http://127.0.0.1:8000`
- `WPRMStats.tsx` → `http://127.0.0.1:8000`

---

## 🚀 **How to Start**

### **1. Start Backend (Port 8000)**
```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS\backend"
.venv\Scripts\activate
uvicorn src.app:app --reload --port 8000
```

✅ Backend running at: **http://127.0.0.1:8000**

---

### **2. Create .env File for Frontend**
```bash
cd "frontend\tori-data-garden"
```

Create `.env` file:
```bash
VITE_CMS_BACKEND_URL=http://127.0.0.1:8000
Cal_key=cal_live_b6362ba6ba028a86cc982773ef7e71ce
VITE_GA4_PROPERTY_ID=259260498
```

---

### **3. Start Frontend**
```bash
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## 🌐 **URLs**

### **Frontend CMS Pages:**
```
http://localhost:5173/cms/recipes
http://localhost:5173/cms/review
http://localhost:5173/cms/stats
```

### **Backend API:**
```
http://127.0.0.1:8000/docs          (Swagger UI)
http://127.0.0.1:8000/redoc         (ReDoc)
http://127.0.0.1:8000/health        (Health Check)
```

---

## 📊 **API Endpoints (Port 8000)**

### **Most Used:**
```bash
# Get WPRM recipes
GET http://127.0.0.1:8000/api/content/wprm-recipes

# Generate content for recipe
POST http://127.0.0.1:8000/api/wprm-scheduler/generate-single

# Get recipes needing generation
GET http://127.0.0.1:8000/api/content/wprm-recipes-not-generated

# Get recipes for review
GET http://127.0.0.1:8000/api/content/wprm-recipes-generated-not-posted

# Approve content
POST http://127.0.0.1:8000/api/content/wprm-approve-content/{recipe_id}

# Decline content
POST http://127.0.0.1:8000/api/content/wprm-decline-content/{recipe_id}

# Get statistics
GET http://127.0.0.1:8000/api/content/wprm-status-summary
```

---

## 🧪 **Quick Test**

### **1. Test Backend Health:**
```bash
curl http://127.0.0.1:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "toriavey-cms",
  "version": "1.0.0"
}
```

---

### **2. Test API Docs:**
Open in browser:
```
http://127.0.0.1:8000/docs
```

You should see the Swagger UI interface.

---

### **3. Test Frontend:**
Open in browser:
```
http://localhost:5173/cms/recipes
```

You should see the WPRM Recipes page.

---

## ✅ **Summary**

✅ **Backend URL:** `http://127.0.0.1:8000`  
✅ **Frontend URL:** `http://localhost:5173`  
✅ **CMS Pages:** `/cms/recipes`, `/cms/review`, `/cms/stats`  
✅ **API Docs:** `http://127.0.0.1:8000/docs`  
✅ **No login required** for CMS  

**All files updated!** Ready to use! 🚀

---

## 📚 **Updated Documentation**

The following files now reference port 8000:
- ✅ `.env.example`
- ✅ `WPRMRecipes.tsx`
- ✅ `WPRMReview.tsx`
- ✅ `WPRMStats.tsx`
- ✅ `COMPLETE_API_ENDPOINTS.md`

---

## 🎯 **Next Steps**

1. Start backend on port 8000
2. Create `.env` file in frontend folder
3. Start frontend
4. Access: **http://localhost:5173/cms/recipes**
5. Start managing your WPRM recipes! 🎉
