# src/app.py

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from src.deps.auth import require_google_login

from src.controllers.clips_controller import router as clips_router
from src.controllers.content_controller import router as content_router
from src.controllers.opus_clip_controller import router as opus_router
from src.controllers.wprm_scheduler_controller import router as wprm_scheduler_router
from src.controllers.youtube_scheduler_controller import router as youtube_scheduler_router
from src.controllers.social_media_test_controller import router as social_test_router
from src.api.v1.auth.router import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Tori Avey CMS API starting up...")
    logger.info("📚 API Documentation available at /docs")
    logger.info("🎬 Clips Management API ready at /api/clips")
    logger.info("🍳 WPRM Content Management API ready at /api/content")
    logger.info("🎥 OpusClip API ready at /api/opus")
    logger.info("📅 WPRM Content Scheduler API ready at /api/wprm-scheduler")
    logger.info("🧪 Social Media Testing API ready at /api/test")
    
    # Start YouTube Clip Scheduler
    try:
        from src.infrastructure.scheduler.youtube_clip_scheduler import get_youtube_scheduler
        scheduler = get_youtube_scheduler()
        scheduler.start()
        logger.info("✅ YouTube Clip Scheduler initialized")
    except Exception as e:
        logger.error(f"❌ Failed to start YouTube Clip Scheduler: {e}")
        
    yield
    
    # Shutdown
    logger.info("👋 Tori Avey CMS API shutting down...")
    
    # Stop YouTube Clip Scheduler
    try:
        from src.infrastructure.scheduler.youtube_clip_scheduler import get_youtube_scheduler
        scheduler = get_youtube_scheduler()
        if scheduler.is_running:
            scheduler.stop()
            logger.info("✅ YouTube Clip Scheduler stopped")
    except Exception as e:
        logger.error(f"❌ Failed to stop YouTube Clip Scheduler: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Tori Avey CMS - Content Management System",
    lifespan=lifespan,
    description="""
    Automated content management and social media posting system.
    
    ## Features
    
    ### Video Clips (Vizard AI)
    * 🎬 Generate video clips from any source using Vizard AI
    * 📱 Support for multiple platforms (YouTube Shorts, TikTok, Instagram Reels, etc.)
    * ✅ Review and approve clips before posting
    * 🚀 Automated posting to social media
    
    ### Recipe Content (LLM-Powered)
    * 🍳 Scrape recipes from any website
    * 🤖 AI-generated captions and hashtags using Gemini
    * 📝 Platform-optimized content (Instagram, Twitter, Threads, etc.)
    * ✏️ Edit and regenerate content
    * 📊 Track posting status and analytics
    
    ## Workflows
    
    ### Video Clips Workflow
    1. **Generate Clips**: Submit a video URL to create clips for multiple platforms
    2. **Review**: View pending clips in the dashboard
    3. **Approve/Reject**: Decide which clips to post
    4. **Post**: Publish approved clips to social media
    
    ### Recipe Content Workflow
    1. **Generate Content**: Submit recipe URL(s) to scrape and generate posts
    2. **Review**: View AI-generated captions, hashtags, and images
    3. **Edit/Regenerate**: Refine content or regenerate with different parameters
    4. **Approve/Reject**: Decide which posts to publish
    5. **Post**: Publish approved content to social platforms
    6. **Post**: Publish approved content to social platforms
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://164.92.127.224",
        "*" # Keeping * for now as requested, but specific IPs are safer
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clips_router, dependencies=[Depends(require_google_login)])
app.include_router(content_router, dependencies=[Depends(require_google_login)])
app.include_router(opus_router, dependencies=[Depends(require_google_login)])
app.include_router(wprm_scheduler_router, dependencies=[Depends(require_google_login)])
app.include_router(youtube_scheduler_router, dependencies=[Depends(require_google_login)])
app.include_router(social_test_router, dependencies=[Depends(require_google_login)])  # Social media testing endpoints
app.include_router(auth_router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Tori Avey CMS API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "clips": "/api/clips",
            "content": "/api/content (WPRM Recipes)",
            "opus": "/api/opus",
            "scheduler": "/api/wprm-scheduler (WPRM Content Scheduler)",
            "test": "/api/test (Social Media Testing)"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "toriavey-cms",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000, reload=True)
