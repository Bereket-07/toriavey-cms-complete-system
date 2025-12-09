import logging
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional

from src.infrastructure.scheduler.youtube_clip_scheduler import get_youtube_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/youtube-scheduler", tags=["YouTube Clip Scheduler"])

# ============= REQUEST SCHEMAS =============

class StartSchedulerRequest(BaseModel):
    """Request to start scheduler"""
    interval_minutes: Optional[int] = 60 * 24

class StartCronSchedulerRequest(BaseModel):
    """Request to start scheduler with cron"""
    cron_expression: str  # e.g., "0 9 * * *"

class UpdateConfigRequest(BaseModel):
    """Request to update scheduler config"""
    interval_minutes: Optional[int] = None
    platforms: Optional[List[str]] = None
    max_videos: Optional[int] = None

# ============= ENDPOINTS =============

@router.post("/start")
async def start_scheduler(request: StartSchedulerRequest):
    """Start the YouTube clip scheduler"""
    try:
        scheduler = get_youtube_scheduler()
        scheduler.start(interval_minutes=request.interval_minutes)
        return {
            "success": True,
            "message": "Scheduler started successfully",
            "status": scheduler.get_status()
        }
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-cron")
async def start_cron_scheduler(request: StartCronSchedulerRequest):
    """Start scheduler with cron expression"""
    try:
        scheduler = get_youtube_scheduler()
        scheduler.start_with_cron(cron_expression=request.cron_expression)
        return {
            "success": True,
            "message": f"Scheduler started with cron: {request.cron_expression}",
            "status": scheduler.get_status()
        }
    except Exception as e:
        logger.error(f"Failed to start cron scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_scheduler():
    """Stop the scheduler"""
    try:
        scheduler = get_youtube_scheduler()
        scheduler.stop()
        return {"success": True, "message": "Scheduler stopped successfully"}
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_scheduler_status():
    """Get current scheduler status"""
    try:
        scheduler = get_youtube_scheduler()
        return {"success": True, **scheduler.get_status()}
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-now")
async def run_scheduler_now(background_tasks: BackgroundTasks):
    """Run generation immediately in background"""
    try:
        scheduler = get_youtube_scheduler()
        background_tasks.add_task(scheduler.run_now)
        return {
            "success": True,
            "message": "YouTube clip generation started in background",
            "status": "running"
        }
    except Exception as e:
        logger.error(f"Failed to start generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/config")
async def update_scheduler_config(request: UpdateConfigRequest):
    """Update scheduler configuration"""
    try:
        scheduler = get_youtube_scheduler()
        result = scheduler.update_config(
            interval_minutes=request.interval_minutes,
            platforms=request.platforms,
            max_videos=request.max_videos
        )
        return {
            "success": True,
            "message": "Configuration updated",
            "config": result
        }
    except Exception as e:
        logger.error(f"Failed to update config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
