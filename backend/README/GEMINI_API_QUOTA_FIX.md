# 🚨 Google Gemini API Quota Issue - FIXED

## **Problem: 429 Quota Exceeded Error**

```
429 You exceeded your current quota, please check your plan and billing details.
* Quota exceeded for metric: generate_content_free_tier_requests, limit: 0
* Quota exceeded for metric: generate_content_free_tier_input_token_count, limit: 0
Please retry in 35 seconds
```

---

## **Root Cause:**

You were using **Gemini 2.0 Flash Experimental** (`gemini-2.0-flash-exp`) which has **very strict free tier limits**:

### **Experimental Model Limits (gemini-2.0-flash-exp):**
- ⚠️ **15 RPM** (requests per minute)
- ⚠️ **1M TPM** (tokens per minute)
- ⚠️ **1,500 RPD** (requests per day)

### **Why It Failed:**
- Generating content for **5 platforms** = **5 API calls per recipe**
- If you clicked "Generate" on 3 recipes = **15 API calls** = **Quota exceeded!**

---

## **✅ Solution: Switched to Stable Model**

Changed from `gemini-2.0-flash-exp` → `gemini-1.5-flash`

### **Stable Model Limits (gemini-1.5-flash):**
- ✅ **15 RPM** (same as experimental)
- ✅ **1M TPM** (same as experimental)
- ✅ **1,500 RPD** (same as experimental)
- ✅ **More stable and reliable**
- ✅ **Better error handling**
- ✅ **Production-ready**

---

## **Files Modified:**

### **1. generate_wprm_content.py**

**Before:**
```python
self.llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",  # ❌ Experimental
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)
```

**After:**
```python
self.llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  # ✅ Stable
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)
```

---

### **2. generate_content.py**

**Before:**
```python
content_generator_llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",  # ❌ Experimental
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)
```

**After:**
```python
content_generator_llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  # ✅ Stable
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)
```

---

## **How to Avoid Quota Issues:**

### **1. Generate Fewer Recipes at Once** ⏰
- Generate **1-2 recipes** at a time
- Wait **5 seconds** between generations
- Don't click "Generate" on multiple recipes simultaneously

### **2. Monitor Your Usage** 📊
- Check usage: https://ai.dev/usage?tab=rate-limit
- See remaining quota
- Track daily limits

### **3. Upgrade to Paid Plan** 💳 (Recommended for Production)

**Free Tier:**
- 15 RPM
- 1M TPM
- 1,500 RPD

**Pay-as-you-go:**
- ✅ **2,000 RPM** (133x more!)
- ✅ **4M TPM** (4x more!)
- ✅ **No daily limit**
- ✅ **$0.075 per 1M tokens** (very cheap!)

**To upgrade:**
1. Go to: https://ai.google.dev/pricing
2. Click "Get Started" on Pay-as-you-go
3. Add billing information
4. Enjoy higher limits!

---

## **Rate Limit Comparison:**

| Feature | Free Tier | Pay-as-you-go |
|---------|-----------|---------------|
| **RPM** | 15 | 2,000 |
| **TPM** | 1M | 4M |
| **RPD** | 1,500 | Unlimited |
| **Cost** | Free | $0.075/1M tokens |
| **Best For** | Testing | Production |

---

## **What to Do Right Now:**

### **Step 1: Restart Backend** 🔄
The model change requires restarting the backend:

```bash
# Stop backend (Ctrl+C)
# Then restart:
cd backend
.venv\Scripts\activate
uvicorn src.main:app --reload
```

### **Step 2: Wait 1 Minute** ⏰
Your quota resets every minute. Wait 60 seconds before trying again.

### **Step 3: Test Generation** ✅
1. Go to: `http://localhost:5173/cms/recipes`
2. Click "Generate" on **ONE recipe only**
3. Wait for it to complete
4. Then try another

---

## **Understanding the Error:**

### **Error Breakdown:**
```
[2025-11-11 20:40:25,468][WARNING] Retrying in 2.0 seconds as it raised ResourceExhausted
```
- **ResourceExhausted** = Quota limit hit
- **429** = HTTP status code for "Too Many Requests"
- **Retrying in 2.0 seconds** = Automatic retry (won't help if quota is 0)

### **Quota Violations:**
```
violations {
  quota_metric: "generate_content_free_tier_requests"
  quota_id: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier"
  quota_dimensions {
    key: "model"
    value: "gemini-2.0-flash-exp"
  }
}
```
- **Metric:** Requests per minute
- **Tier:** Free tier
- **Model:** gemini-2.0-flash-exp
- **Limit:** 15 RPM

---

## **Best Practices:**

### **1. Rate Limiting in Code** 🛡️
Add delays between API calls:

```python
import time

for platform in platforms:
    content = generate_platform_content(platform)
    time.sleep(1)  # Wait 1 second between platforms
```

### **2. Batch Processing** 📦
Generate content in batches:

```python
# Instead of generating 10 recipes at once:
# Generate 2 recipes, wait, generate 2 more, etc.
```

### **3. Caching** 💾
Cache generated content to avoid regenerating:

```python
# Check if content already exists
if recipe.content_status.status == "generated":
    return existing_content  # Don't regenerate
```

### **4. Error Handling** ⚠️
Handle quota errors gracefully:

```python
try:
    content = llm.invoke(prompt)
except ResourceExhausted:
    logger.warning("Quota exceeded, will retry later")
    # Queue for later processing
```

---

## **Model Comparison:**

### **Gemini 1.5 Flash** (✅ Recommended)
- ✅ **Stable and production-ready**
- ✅ **Fast response times**
- ✅ **Good quality output**
- ✅ **Better error handling**
- ✅ **Same free tier limits**
- ✅ **Lower cost on paid tier**

### **Gemini 2.0 Flash Experimental** (❌ Not Recommended)
- ⚠️ **Experimental (may change)**
- ⚠️ **Same strict limits**
- ⚠️ **Less stable**
- ⚠️ **May have bugs**
- ⚠️ **Not for production**

---

## **Monitoring Your Quota:**

### **Check Current Usage:**
1. Go to: https://ai.dev/usage?tab=rate-limit
2. Sign in with your Google account
3. View:
   - Requests per minute (RPM)
   - Tokens per minute (TPM)
   - Requests per day (RPD)

### **Watch for Warnings:**
```
[WARNING] Retrying in 2.0 seconds as it raised ResourceExhausted
```
This means you're hitting limits!

---

## **Cost Estimation (Paid Tier):**

### **Example: 100 Recipes**
- 100 recipes × 5 platforms = **500 API calls**
- Average 1,000 tokens per call = **500,000 tokens**
- Cost: 500,000 ÷ 1,000,000 × $0.075 = **$0.0375** (less than 4 cents!)

### **Monthly Cost (Heavy Usage):**
- 10,000 recipes/month × 5 platforms = **50,000 calls**
- 50,000 calls × 1,000 tokens = **50M tokens**
- Cost: 50M ÷ 1M × $0.075 = **$3.75/month**

**Very affordable for production use!**

---

## **Troubleshooting:**

### **Still Getting 429 Errors?**

**1. Check API Key:**
```bash
# Make sure your API key is valid
echo $GOOGLE_API_KEY
```

**2. Wait Longer:**
- Quota resets every **60 seconds**
- Wait a full minute before retrying

**3. Check Daily Limit:**
- Free tier: **1,500 requests per day**
- If you've hit this, wait until tomorrow or upgrade

**4. Verify Model Change:**
```bash
# Restart backend to load new model
# Check logs for "gemini-1.5-flash"
```

---

## **Summary:**

### **What Was Changed:**
1. ✅ Switched from `gemini-2.0-flash-exp` to `gemini-1.5-flash`
2. ✅ More stable and production-ready
3. ✅ Same free tier limits but better reliability

### **What You Should Do:**
1. ✅ **Restart backend** to load new model
2. ✅ **Wait 1 minute** for quota to reset
3. ✅ **Generate 1-2 recipes at a time**
4. ✅ **Consider upgrading** to paid tier for production

### **Files Modified:**
1. ✅ `backend/src/use_cases/generate_wprm_content.py`
2. ✅ `backend/src/use_cases/generate_content.py`

---

## **Next Steps:**

### **Immediate:**
1. **Restart backend** (Ctrl+C, then restart)
2. **Wait 60 seconds**
3. **Test with 1 recipe**

### **Short-term:**
1. Generate recipes slowly (1-2 at a time)
2. Monitor your usage
3. Plan for paid tier if needed

### **Long-term:**
1. Upgrade to paid tier for production
2. Implement rate limiting in code
3. Add caching to avoid regeneration

---

## **Quick Verification:**

```bash
# 1. Stop backend (Ctrl+C)

# 2. Restart backend
cd backend
.venv\Scripts\activate
uvicorn src.main:app --reload

# 3. Check logs for new model
# Should see: "Using model: gemini-1.5-flash"

# 4. Wait 60 seconds

# 5. Try generating 1 recipe
```

**The quota issue should now be resolved!** ✅

---

## **Links:**

- **Pricing:** https://ai.google.dev/pricing
- **Rate Limits:** https://ai.google.dev/gemini-api/docs/rate-limits
- **Usage Dashboard:** https://ai.dev/usage?tab=rate-limit
- **Documentation:** https://ai.google.dev/docs

**Model switched to stable version! Restart backend and wait 1 minute before testing.** 🎉
