# 🚀 Performance Optimization Guide

## 🔍 **Why Backend Might Be Slow**

### **Common Causes:**

1. **Database Queries**
   - Fetching large number of WPRM recipes
   - Complex joins or aggregations
   - No database indexes
   - Slow database connection

2. **AI Model Initialization**
   - Google Gemini API first call
   - Model loading time
   - Network latency

3. **Large Datasets**
   - WordPress database with thousands of recipes
   - Loading all data at once
   - No pagination on backend

4. **Network Issues**
   - Slow database server
   - API rate limiting
   - DNS resolution

---

## 🛠️ **Optimizations Implemented**

### **Frontend Optimizations:**

✅ **Pagination** - Load 20 recipes at a time
✅ **Loading States** - Show spinners while fetching
✅ **Error Boundaries** - Graceful error handling
✅ **Debounced Search** - Reduce API calls
✅ **Lazy Loading** - Load data only when needed

### **Recommended Backend Optimizations:**

1. **Add Database Indexes:**
```sql
-- Add indexes for faster queries
CREATE INDEX idx_recipe_status ON wp_tori_wprm_content_status(status);
CREATE INDEX idx_post_status ON wp_tori_posts(post_status);
CREATE INDEX idx_post_date ON wp_tori_posts(post_date);
```

2. **Implement Caching:**
```python
# Add Redis or in-memory cache
from functools import lru_cache

@lru_cache(maxsize=100)
def get_recipe_by_id(recipe_id):
    # Cache recipe data
    pass
```

3. **Optimize Queries:**
```python
# Use SELECT specific columns instead of SELECT *
# Add LIMIT to queries
# Use database connection pooling
```

4. **Lazy Load AI Models:**
```python
# Initialize Gemini only when needed
# Don't load on startup
```

---

## ⚡ **Quick Fixes**

### **1. Check Backend Startup Time**

Run backend and watch the console:
```bash
uvicorn src.app:app --reload --port 8000
```

Look for:
- Database connection time
- Model initialization
- Route registration

### **2. Test API Response Time**

```bash
# Test health endpoint
curl -w "@-" -o /dev/null -s http://127.0.0.1:8000/health <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

### **3. Check Database Connection**

Add connection pooling in your database config:
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Verify connections
)
```

---

## 🎯 **Frontend Loading Improvements**

I've added these to make loading feel faster:

### **1. Skeleton Loaders**
Instead of blank screen, show loading skeletons:
```tsx
{loading && (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
  </div>
)}
```

### **2. Optimistic Updates**
Update UI immediately, sync with backend later:
```tsx
const handleApprove = async (id) => {
  // Update UI first
  setItems(items.filter(item => item.id !== id));
  
  // Then call API
  await approveContent(id);
};
```

### **3. Parallel Loading**
Fetch multiple endpoints at once:
```tsx
const [status, scheduler] = await Promise.all([
  fetch('/api/content/wprm-status-summary'),
  fetch('/api/wprm-scheduler/status'),
]);
```

### **4. Debounced Search**
Reduce API calls during typing:
```tsx
const debouncedSearch = debounce(searchRecipes, 500);
```

---

## 📊 **Performance Monitoring**

### **Add Performance Logging**

```python
import time
from functools import wraps

def log_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start
        logger.info(f"{func.__name__} took {duration:.2f}s")
        return result
    return wrapper

@router.get("/wprm-recipes")
@log_performance
async def get_wprm_recipes():
    # Your code
    pass
```

### **Monitor Slow Queries**

```python
# Log queries taking > 1 second
import logging

logging.basicConfig(level=logging.INFO)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

---

## 🔧 **Specific Optimizations**

### **Dashboard Page:**

**Before:**
```tsx
// Multiple sequential calls
const status = await fetch('/api/status');
const scheduler = await fetch('/api/scheduler');
const recipes = await fetch('/api/recipes');
```

**After:**
```tsx
// Parallel calls
const [status, scheduler, recipes] = await Promise.all([
  fetch('/api/status'),
  fetch('/api/scheduler'),
  fetch('/api/recipes'),
]);
```

### **Recipe List:**

**Before:**
```python
# Load all recipes at once
recipes = db.query(Recipe).all()
```

**After:**
```python
# Paginate
recipes = db.query(Recipe).limit(20).offset(offset).all()
```

### **Search:**

**Before:**
```tsx
// Search on every keystroke
onChange={(e) => searchRecipes(e.target.value)}
```

**After:**
```tsx
// Debounce search
const debouncedSearch = useCallback(
  debounce((query) => searchRecipes(query), 500),
  []
);
```

---

## 💾 **Caching Strategy**

### **Frontend Caching (React Query)**

```bash
npm install @tanstack/react-query
```

```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['recipes'],
  queryFn: fetchRecipes,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### **Backend Caching**

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Simple in-memory cache
@lru_cache(maxsize=128)
def get_status_summary_cached():
    return get_status_summary()

# Or use Redis
import redis
r = redis.Redis()

def get_recipes(limit=20):
    cache_key = f"recipes:{limit}"
    cached = r.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    recipes = fetch_from_db(limit)
    r.setex(cache_key, 300, json.dumps(recipes))  # 5 min cache
    return recipes
```

---

## 🎯 **Expected Performance**

### **Target Response Times:**

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| `/health` | < 50ms | < 100ms |
| `/wprm-recipes?limit=20` | < 200ms | < 500ms |
| `/wprm-status-summary` | < 100ms | < 300ms |
| `/generate-single` | 2-5s | < 10s |
| `/scheduler/status` | < 50ms | < 100ms |

### **Page Load Times:**

| Page | Target | Acceptable |
|------|--------|------------|
| Dashboard | < 1s | < 2s |
| Recipes | < 1s | < 2s |
| Review | < 1.5s | < 3s |
| Scheduler | < 500ms | < 1s |

---

## 🚨 **Troubleshooting Slow Performance**

### **1. Backend Taking Long to Start**

**Check:**
```bash
# Add timing to startup
time uvicorn src.app:app --reload --port 8000
```

**Fix:**
- Remove heavy imports from top-level
- Lazy load AI models
- Don't connect to database on startup

### **2. First API Call Slow**

**Cause:** Database connection initialization

**Fix:**
```python
# Warm up connection pool on startup
@app.on_event("startup")
async def warmup():
    # Make a simple query
    db.execute("SELECT 1")
```

### **3. Every API Call Slow**

**Cause:** No database indexes or slow queries

**Fix:**
- Add indexes to frequently queried columns
- Use `EXPLAIN` to analyze queries
- Enable query logging

### **4. Frontend Feels Slow**

**Causes:**
- Waiting for API responses
- No loading states
- Rendering too much data

**Fixes:**
- Add loading skeletons
- Implement virtual scrolling
- Use pagination
- Show optimistic updates

---

## 📈 **Performance Checklist**

### **Backend:**
- [ ] Database indexes on frequently queried columns
- [ ] Connection pooling configured
- [ ] Queries use LIMIT and OFFSET
- [ ] Caching for expensive operations
- [ ] Lazy loading of AI models
- [ ] Async operations where possible
- [ ] Query performance logging

### **Frontend:**
- [ ] Loading states on all pages
- [ ] Skeleton loaders for better UX
- [ ] Pagination implemented
- [ ] Debounced search
- [ ] Parallel API calls
- [ ] Error boundaries
- [ ] Optimistic updates

### **Database:**
- [ ] Indexes on status columns
- [ ] Indexes on date columns
- [ ] Connection pool configured
- [ ] Regular VACUUM/ANALYZE (PostgreSQL)
- [ ] Query optimization

---

## 🎉 **Summary**

**Quick Wins:**
1. ✅ Add loading skeletons (already done)
2. ✅ Parallel API calls (already done)
3. ✅ Pagination (already done)
4. 🔄 Add database indexes
5. 🔄 Implement caching
6. 🔄 Optimize slow queries

**Long-term:**
- Implement Redis caching
- Add CDN for static assets
- Database read replicas
- API rate limiting
- Request batching

Your frontend is already optimized! The slow loading is likely from:
1. Large number of recipes in database
2. Missing database indexes
3. No caching on backend

Add those backend optimizations and it'll be much faster! 🚀
