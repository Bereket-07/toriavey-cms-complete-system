# WPRM Content Cleanup & Regeneration Guide

## 🔧 Problem: Empty Generated Content

Some recipes were marked as "generated" but have empty content for most platforms. This happened because the LLM response wasn't being parsed correctly.

---

## ✅ Solution: Reset & Regenerate

### **Step 1: Reset Empty Content**

This endpoint will find all recipes with empty content and reset them to `not_generated`:

```http
POST /api/content/wprm-reset-empty-content
```

**What it does:**
- Finds all recipes with status `generated`
- Checks if content is empty or invalid
- Resets empty recipes to `not_generated`
- Returns count of recipes reset

**Expected Response:**
```json
{
  "success": true,
  "message": "Reset 6 recipes with empty content",
  "recipes_reset": 6
}
```

---

### **Step 2: Regenerate Content**

Now that empty recipes are reset, generate fresh content:

```http
POST /api/wprm-scheduler/run-now
```

**Body (optional):**
```json
{
  "recipes_count": 5,
  "platforms": ["instagram", "tiktok", "facebook", "twitter", "pinterest"]
}
```

**What happens:**
- Picks recipes with `not_generated` status
- Generates content using LLM
- Saves properly formatted content
- Marks as `generated`

---

### **Step 3: Verify Generated Content**

Check that content is now properly generated:

```http
GET /api/content/wprm-recipes-generated-not-posted?limit=5
```

**Look for:**
- ✅ `"parsed": true` - means LLM generated proper JSON
- ✅ Actual caption/post text (not empty strings)
- ✅ Hashtags array with values
- ❌ `"fallback": true` - means LLM failed, used fallback

**Good Content Example:**
```json
{
  "instagram": {
    "caption": "🍽️ Tahini Sauce\n\nHow to make creamy, delicious...",
    "hashtags": ["tahini", "sauce", "middleeastern"],
    "hook": "Try this amazing Tahini Sauce!",
    "cta": "Save this recipe!",
    "parsed": true
  }
}
```

**Bad Content (will be reset):**
```json
{
  "instagram": {
    "content": "",
    "platform": "instagram",
    "parsed": false
  }
}
```

---

## 🔄 Complete Workflow

### **1. Clean Up Bad Content**
```http
POST /api/content/wprm-reset-empty-content
```
Response: `"recipes_reset": 6`

---

### **2. Check Status Summary**
```http
GET /api/content/wprm-status-summary
```

**Before Reset:**
```json
{
  "not_generated": 720,
  "generated": 6,  // ← These have empty content
  "pending": 0,
  "posted": 3
}
```

**After Reset:**
```json
{
  "not_generated": 726,  // ← Increased by 6
  "generated": 0,
  "pending": 0,
  "posted": 3
}
```

---

### **3. Generate Fresh Content**
```http
POST /api/wprm-scheduler/run-now
```

Body:
```json
{
  "recipes_count": 5
}
```

---

### **4. Review Generated Content**
```http
GET /api/content/wprm-recipes-generated-not-posted?limit=5
```

Check each recipe's `generated_content` - should have actual text now!

---

### **5. Approve Good Content**
```http
POST /api/content/wprm-approve-content/44570
```

Moves from `generated` → `pending`

---

### **6. View Pending (Ready to Post)**
```http
GET /api/content/wprm-recipes-pending
```

---

## 🎯 Quick Commands

### **Reset All Empty Content**
```bash
curl -X POST http://localhost:8000/api/content/wprm-reset-empty-content
```

### **Generate 10 Recipes**
```bash
curl -X POST http://localhost:8000/api/wprm-scheduler/run-now \
  -H "Content-Type: application/json" \
  -d '{"recipes_count": 10}'
```

### **Check Status**
```bash
curl http://localhost:8000/api/content/wprm-status-summary
```

---

## 🐛 Debugging

### **Check Logs**
The system now logs LLM responses:
```
INFO: Generating content for instagram...
INFO: LLM response for instagram: {"caption": "🍽️ Tahini Sauce...
```

### **If Content is Still Empty:**
1. Check `GOOGLE_API_KEY` is set correctly
2. Check LLM model is available (`gemini-2.0-flash-exp`)
3. Look for errors in logs
4. Fallback content should be used if LLM fails

### **Fallback Content**
If LLM fails, system generates basic content:
```json
{
  "caption": "🍽️ Tahini Sauce\n\nHow to make creamy...",
  "hashtags": ["recipe", "cooking", "food"],
  "parsed": false,
  "fallback": true  // ← Indicates fallback was used
}
```

---

## 📊 Status Flow

```
not_generated → [Generate] → generated → [Approve] → pending → [Post] → posted
                                  ↓
                            [Empty Content?]
                                  ↓
                            [Reset & Retry]
```

---

## ✅ Summary

1. **Reset empty content**: `POST /api/content/wprm-reset-empty-content`
2. **Generate fresh**: `POST /api/wprm-scheduler/run-now`
3. **Verify content**: `GET /api/content/wprm-recipes-generated-not-posted`
4. **Approve good ones**: `POST /api/content/wprm-approve-content/{id}`
5. **View pending**: `GET /api/content/wprm-recipes-pending`

**All recipes should now have proper content!** 🚀
