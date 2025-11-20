# 🔧 Quick Fix - Image Loading Error

## ✅ **Fixed: Image Batch Loading Error**

---

## **Error:**
```
[ERROR] Error fetching recipes: type object 'WPRMRecipeImage' has no attribute 'ID'
```

---

## **Problem:**

Used wrong table for image batch loading. Images are stored in `wp_tori_posts` table with `post_type='attachment'`, not in `WPRMRecipeImage` table.

---

## **Fix:**

**Before (Wrong):**
```python
images = db.query(WPRMRecipeImage).filter(
    WPRMRecipeImage.ID.in_(thumbnail_ids)
).all()
```

**After (Correct):**
```python
images = db.query(WPRMRecipe).filter(
    WPRMRecipe.ID.in_(thumbnail_ids),
    WPRMRecipe.post_type == 'attachment'
).all()
```

---

## **What to Do:**

Backend is already running with the fix. Just refresh your browser:

```bash
Ctrl + F5
```

Then test:
```
http://localhost:5173/cms/recipes
```

Should load fast now! ⚡
