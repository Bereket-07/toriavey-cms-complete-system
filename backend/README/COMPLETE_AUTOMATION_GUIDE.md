# 🤖 Complete Automation Guide - Tori Avey CMS

## 🎉 **Fully Automated Content Management System**

Your CMS now supports **complete automation** - from content generation to posting, with **zero human intervention** required!

---

## 🚀 **Automation Features**

### **1. Automated Content Generation (Scheduler)**
✅ Automatically generates content for WPRM recipes  
✅ Runs on schedule (interval or cron)  
✅ No human intervention needed  
✅ Configurable batch size and platforms  

### **2. Manual Review & Approval**
✅ Review AI-generated content  
✅ Approve or decline with reasons  
✅ Edit captions and hashtags  
✅ Bulk operations available  

### **3. Automated Posting**
✅ Post to multiple platforms  
✅ Schedule posts for optimal times  
✅ Track posting status  
✅ Retry failed posts  

### **4. Video Clip Generation**
✅ Generate clips from YouTube videos  
✅ OpusClip and Vizard integration  
✅ Approve/reject workflow  
✅ Post to social media  

---

## ⏰ **Automated Scheduler**

### **How It Works:**

```
1. Scheduler starts (interval or cron)
   ↓
2. Fetches unprocessed WPRM recipes from database
   ↓
3. Generates AI content for each recipe (Instagram, Twitter, Facebook)
   ↓
4. Saves to database with "generated" status
   ↓
5. Content appears in Review page
   ↓
6. (Optional) Human reviews and approves
   ↓
7. Approved content moves to "Ready to Post"
   ↓
8. (Optional) Human posts or auto-posts
   ↓
9. Repeat on schedule
```

### **Configuration Options:**

#### **Interval Mode:**
- **Interval:** 5-1440 minutes (1 minute to 24 hours)
- **Batch Size:** 1-50 recipes per run
- **Platforms:** Instagram, Twitter, Facebook (select any combination)

#### **Cron Mode:**
- **Cron Expression:** Standard cron format
- **Examples:**
  - `0 9 * * *` - Every day at 9 AM
  - `0 */6 * * *` - Every 6 hours
  - `0 9 * * 1` - Every Monday at 9 AM
  - `*/30 * * * *` - Every 30 minutes

### **Frontend Controls:**

**Location:** `http://localhost:5173/cms/scheduler`

**Features:**
- ✅ **Live Status** - See if scheduler is running
- ✅ **Countdown Timer** - Real-time countdown to next generation (HH:MM:SS)
- ✅ **Start/Stop** - One-click controls
- ✅ **Run Now** - Manual trigger (bypass schedule)
- ✅ **Platform Selection** - Choose which platforms to generate for
- ✅ **Configuration** - Change interval, batch size, cron expression

---

## 📊 **Backend API Endpoints**

### **Scheduler Endpoints:**

#### **1. Start Scheduler (Interval)**
```bash
POST /api/wprm-scheduler/start
{
  "interval_minutes": 60,
  "recipes_per_run": 10
}
```

#### **2. Start Scheduler (Cron)**
```bash
POST /api/wprm-scheduler/start-cron
{
  "cron_expression": "0 9 * * *",
  "recipes_per_run": 10
}
```

#### **3. Stop Scheduler**
```bash
POST /api/wprm-scheduler/stop
```

#### **4. Get Status**
```bash
GET /api/wprm-scheduler/status

Response:
{
  "is_running": true,
  "interval_minutes": 60,
  "batch_size": 10,
  "next_run": "2025-11-11T10:00:00Z",
  "last_run": "2025-11-11T09:00:00Z"
}
```

#### **5. Run Now (Manual Trigger)**
```bash
POST /api/wprm-scheduler/run-now
```

#### **6. Update Configuration**
```bash
PUT /api/wprm-scheduler/config
{
  "interval_minutes": 120,
  "recipes_per_run": 15,
  "platforms": ["instagram", "twitter"]
}
```

#### **7. Generate Single Recipe**
```bash
POST /api/wprm-scheduler/generate-single
{
  "recipe_id": 123,
  "platforms": ["instagram", "twitter", "facebook"]
}
```

#### **8. Generate Batch**
```bash
POST /api/wprm-scheduler/generate-batch
{
  "limit": 20,
  "platforms": ["instagram", "twitter"]
}
```

---

## 🎯 **Content Workflow**

### **Fully Automated (No Human Intervention):**

```
START: Scheduler runs automatically
   ↓
1. Fetch 10 unprocessed recipes from WordPress database
   ↓
2. For each recipe:
   - Extract recipe data (title, ingredients, instructions, image)
   - Generate AI content using Google Gemini
   - Create platform-specific captions (Instagram, Twitter, Facebook)
   - Generate hashtags
   - Save to database with "generated" status
   ↓
3. Wait for next scheduled run
   ↓
REPEAT FOREVER
```

### **Semi-Automated (Human Review):**

```
START: Scheduler generates content
   ↓
1. Content appears in Review page (/cms/review)
   ↓
2. Human reviews:
   - Views generated captions
   - Checks hashtags
   - Sees platform-specific content
   ↓
3. Human decides:
   - ✅ Approve → Moves to "Ready to Post"
   - ❌ Decline → Marked as declined
   - ✏️ Edit → Modify and approve
   ↓
4. Approved content in "Ready to Post" (/cms/pending)
   ↓
5. Human posts:
   - Post to specific platform
   - Post to all platforms
   ↓
6. Content marked as "posted"
   ↓
END
```

---

## 🤖 **Fully Automated Setup**

### **Option 1: Set It and Forget It**

**Goal:** Generate content automatically, no human review needed

**Steps:**
1. Start scheduler with desired interval
2. Let it run 24/7
3. Content generates automatically
4. (Optional) Auto-approve all content via backend script
5. (Optional) Auto-post via backend script

**Backend Script (Auto-Approve & Post):**
```python
import httpx
import asyncio

async def auto_approve_and_post():
    async with httpx.AsyncClient() as client:
        # Get generated content
        response = await client.get(
            "http://127.0.0.1:8000/api/content/wprm-recipes-generated-not-posted?limit=100"
        )
        recipes = response.json()
        
        for recipe in recipes:
            # Approve
            await client.post(
                f"http://127.0.0.1:8000/api/content/wprm-approve-content/{recipe['recipe_id']}"
            )
            
            # Post to all platforms
            # (Implement posting logic here)
            
        print(f"Auto-approved and posted {len(recipes)} recipes")

# Run every hour
while True:
    await auto_approve_and_post()
    await asyncio.sleep(3600)  # 1 hour
```

### **Option 2: Human Review Before Posting**

**Goal:** Generate automatically, human approves before posting

**Steps:**
1. Start scheduler
2. Content generates automatically
3. Human reviews in `/cms/review`
4. Human approves good content
5. Human posts from `/cms/pending`

**Best For:**
- Quality control
- Brand consistency
- Legal compliance
- Sensitive content

---

## 📱 **Frontend Pages**

### **1. Dashboard (`/cms/dashboard`)**
**Purpose:** Overview of CMS status

**Features:**
- Live statistics (total recipes, generated, pending, posted)
- Scheduler status with countdown
- Quick action cards
- Progress bars

**Automation:**
- ✅ Auto-refreshes every 5 seconds
- ✅ Shows real-time scheduler countdown

---

### **2. Recipes (`/cms/recipes`)**
**Purpose:** Browse all WPRM recipes

**Features:**
- Grid view with images
- Search by title
- Status badges (Not Generated, Generated, Pending, Posted)
- One-click generation

**Automation:**
- ✅ Scheduler automatically processes these recipes
- ✅ Status updates in real-time

---

### **3. Review (`/cms/review`)**
**Purpose:** Review AI-generated content

**Features:**
- Grid view with recipe images
- Platform badges (Instagram, Twitter, Facebook)
- Caption preview
- Hashtags display
- Approve/Decline buttons
- "View Full Details" link

**Automation:**
- ✅ Content appears here automatically after generation
- ✅ Can be skipped if auto-approval is enabled

---

### **4. Ready to Post (`/cms/pending`)**
**Purpose:** Post approved content

**Features:**
- Grid view with images
- Approved content only
- Post per platform buttons
- "Post to All" button
- Caption preview

**Automation:**
- ✅ Content moves here automatically after approval
- ✅ Can be auto-posted via backend script

---

### **5. Video Clips (`/cms/clips`)**
**Purpose:** Manage video clips

**Features:**
- Grid view with video thumbnails
- Duration badges
- Platform icons
- Approve/Reject/Post buttons
- Status indicators

**Automation:**
- ✅ Clips generated via OpusClip/Vizard
- ✅ Approval workflow
- ✅ Auto-posting available

---

### **6. Scheduler (`/cms/scheduler`)**
**Purpose:** Control automated content generation

**Features:**
- Live status display
- Real-time countdown timer (HH:MM:SS)
- Start/Stop buttons
- Configuration:
  - Interval (minutes) or Cron expression
  - Batch size (recipes per run)
  - Platform selection (Instagram, Twitter, Facebook)
- "Run Now" button (manual trigger)

**Automation:**
- ✅ **This is the automation control center!**
- ✅ Set it once, runs forever
- ✅ Live countdown shows time until next generation

---

### **7. Statistics (`/cms/stats`)**
**Purpose:** View content generation metrics

**Features:**
- Total recipes count
- Generated, pending, posted counts
- Status breakdown with progress bars
- Completion percentage
- Success metrics

**Automation:**
- ✅ Auto-updates with scheduler activity
- ✅ Real-time statistics

---

## 🎨 **UI/UX Features**

### **Visual Design:**
✨ **Modern Grid Layouts** - 3 columns on desktop, responsive  
🎨 **Gradient Backgrounds** - Beautiful fallbacks when no image  
🖼️ **Recipe/Clip Images** - Visual content in every card  
🎭 **Hover Animations** - Cards lift up, images zoom  
🏷️ **Status Badges** - Color-coded overlays on images  
⏱️ **Live Countdown** - Real-time scheduler timer  

### **Color Scheme:**
- 🟡 **Yellow** - Pending/Waiting
- 🔵 **Blue** - Review Needed
- 🟢 **Green** - Approved/Active/Success
- 🟣 **Purple** - Posted/Completed
- 🔴 **Red** - Declined/Stopped/Error

### **Interactions:**
- ✅ **One-Click Actions** - Every card has clear buttons
- 🔔 **Toast Notifications** - Instant feedback
- 📊 **Progress Bars** - Animated visual progress
- 🎯 **Platform Badges** - Clear platform indicators

---

## 🔧 **Setup Instructions**

### **Step 1: Configure Environment**

**Backend `.env`:**
```env
# Google Gemini API (for content generation)
GOOGLE_API_KEY=your_gemini_api_key

# WordPress Database
WORDPRESS_DB_HOST=localhost
WORDPRESS_DB_NAME=wordpress_db
WORDPRESS_DB_USER=wp_user
WORDPRESS_DB_PASSWORD=wp_password
WORDPRESS_DB_PREFIX=wp_tori_

# Composio (for social media posting)
COMPOSIO_API_KEY=your_composio_key
COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID=your_instagram_config
COMPOSIO_TWITTER_AUTH_CONFIG_ID=your_twitter_config
COMPOSIO_FACEBOOK_AUTH_CONFIG_ID=your_facebook_config

# Vizard/OpusClip (for video clips)
VIZARD_API_KEY=your_vizard_key
OPUSCLIP_API_KEY=your_opusclip_key

# Server
HOST=0.0.0.0
PORT=8000
```

**Frontend `.env`:**
```env
VITE_CMS_BACKEND_URL=http://127.0.0.1:8000
```

### **Step 2: Start Backend**
```bash
cd backend
.venv\Scripts\activate
uvicorn src.app:app --reload --port 8000
```

### **Step 3: Start Frontend**
```bash
cd frontend/tori-data-garden
npm run dev
```

### **Step 4: Access CMS**
```
http://localhost:5173/cms
```

### **Step 5: Start Automation**
1. Go to **Scheduler** page (`/cms/scheduler`)
2. Configure:
   - **Interval:** 60 minutes (or use cron)
   - **Batch Size:** 10 recipes
   - **Platforms:** Select Instagram, Twitter, Facebook
3. Click **"Start Scheduler"**
4. Watch the countdown timer!

---

## 📈 **Automation Scenarios**

### **Scenario 1: Daily Morning Posts**

**Goal:** Generate content every morning at 9 AM

**Setup:**
```
Scheduler Mode: Cron
Cron Expression: 0 9 * * *
Batch Size: 5 recipes
Platforms: Instagram, Twitter
```

**Result:**
- Every day at 9 AM, generates content for 5 recipes
- Content appears in Review page
- Human reviews and approves
- Posts throughout the day

---

### **Scenario 2: Continuous Generation**

**Goal:** Generate content every hour, 24/7

**Setup:**
```
Scheduler Mode: Interval
Interval: 60 minutes
Batch Size: 10 recipes
Platforms: Instagram, Twitter, Facebook
```

**Result:**
- Every hour, generates content for 10 recipes
- Builds up a queue of content
- Human reviews when available
- Never runs out of content

---

### **Scenario 3: Weekend Batch**

**Goal:** Generate a week's worth of content on weekends

**Setup:**
```
Scheduler Mode: Cron
Cron Expression: 0 9 * * 6 (Saturday 9 AM)
Batch Size: 50 recipes
Platforms: Instagram, Twitter, Facebook
```

**Result:**
- Every Saturday at 9 AM, generates 50 recipes
- Human reviews over the weekend
- Content ready for the week

---

### **Scenario 4: Fully Automated**

**Goal:** Zero human intervention

**Setup:**
1. Start scheduler (any mode)
2. Run auto-approval script (see above)
3. Enable auto-posting in backend

**Result:**
- Content generates automatically
- Auto-approved immediately
- Auto-posted to platforms
- **Completely hands-off!**

---

## 🎯 **Best Practices**

### **Content Generation:**
✅ Start with small batch sizes (5-10) to test  
✅ Monitor quality of AI-generated content  
✅ Adjust tone/style in backend if needed  
✅ Use cron for predictable schedules  
✅ Use interval for continuous generation  

### **Review Process:**
✅ Review at least first 10-20 posts manually  
✅ Look for brand voice consistency  
✅ Check hashtag relevance  
✅ Verify image quality  
✅ Test on one platform before all  

### **Automation:**
✅ Start with semi-automated (human review)  
✅ Move to fully automated after confidence  
✅ Monitor statistics regularly  
✅ Set up alerts for failures  
✅ Have backup content ready  

### **Performance:**
✅ Add database indexes (see QUICK_FIX_SLOW_LOADING.md)  
✅ Enable caching for frequently accessed data  
✅ Use connection pooling  
✅ Monitor API rate limits (Gemini, Composio)  
✅ Scale batch size based on API quotas  

---

## 🚀 **Advanced Features**

### **1. Batch Operations**

**Bulk Approve:**
```bash
POST /api/content/bulk-approve?approved_by=123
[1, 2, 3, 4, 5]
```

**Bulk Post:**
```bash
POST /api/content/bulk-post?posted_by=123
{
  "content_ids": [1, 2, 3],
  "platforms": ["instagram", "twitter"]
}
```

### **2. Custom Scheduling**

**Multiple Schedulers:**
- Run different schedules for different platforms
- Morning posts for Instagram
- Evening posts for Twitter
- Weekend posts for Facebook

### **3. A/B Testing**

**Test Different Captions:**
- Generate multiple captions per recipe
- Post different versions
- Track engagement
- Use best-performing style

### **4. Analytics Integration**

**Track Performance:**
- Post engagement metrics
- Best posting times
- Top-performing content
- Platform-specific analytics

---

## 📊 **Monitoring**

### **Dashboard Metrics:**
- **Total Recipes:** All recipes in database
- **Generated:** Content created by AI
- **Pending:** Awaiting review
- **Posted:** Published to platforms

### **Scheduler Status:**
- **Is Running:** Active/Stopped
- **Next Run:** Countdown timer
- **Last Run:** Timestamp
- **Configuration:** Interval, batch size, platforms

### **Statistics:**
- **Completion %:** Generated / Total
- **Success Rate:** Posted / Generated
- **Platform Breakdown:** Posts per platform
- **Time Series:** Generation over time

---

## 🎉 **Summary**

### **What You Have:**

✅ **Fully Automated CMS** - Generate content without human intervention  
✅ **Beautiful Grid UI** - Modern, professional interface  
✅ **Live Scheduler** - Real-time countdown and controls  
✅ **Multi-Platform** - Instagram, Twitter, Facebook support  
✅ **Video Clips** - OpusClip/Vizard integration  
✅ **Flexible Scheduling** - Interval or cron-based  
✅ **Manual Override** - Review and approve when needed  
✅ **Batch Operations** - Bulk approve and post  
✅ **Real-Time Stats** - Live metrics and progress  
✅ **Complete Workflow** - From recipe to post  

### **Automation Levels:**

1. **Manual:** Generate, review, approve, post (all manual)
2. **Semi-Automated:** Auto-generate, manual review/post
3. **Mostly Automated:** Auto-generate, auto-approve, manual post
4. **Fully Automated:** Auto-generate, auto-approve, auto-post

**Choose the level that fits your needs!**

---

## 🚀 **Get Started**

1. **Configure** environment variables
2. **Start** backend and frontend
3. **Access** CMS at `http://localhost:5173/cms`
4. **Go to** Scheduler page
5. **Configure** automation settings
6. **Click** "Start Scheduler"
7. **Watch** the magic happen! ✨

**Your content management is now automated!** 🎉🤖

---

## 📞 **Support**

- **API Docs:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/health
- **Frontend:** http://localhost:5173/cms
- **Documentation:** See `COMPLETE_CMS_FEATURES.md` and `BEAUTIFUL_GRID_UI_UPGRADE.md`

**Happy Automating!** 🚀✨
