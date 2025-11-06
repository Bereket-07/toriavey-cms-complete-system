# src/controllers/scheduler_controller.py

"""
Scheduler Controller

API endpoints to manage the daily content generation scheduler.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field

from src.infrastructure.scheduler.daily_content_scheduler import (
    get_scheduler,
    initialize_scheduler
)
from src.domain.schemas.content_schemas import ContentPlatform

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scheduler", tags=["Scheduler"])


# ============= REQUEST/RESPONSE SCHEMAS =============

class InitializeSchedulerRequest(BaseModel):
    """Request to initialize scheduler with configuration"""
    target_platforms: List[ContentPlatform] = Field(
        default=[ContentPlatform.INSTAGRAM, ContentPlatform.TWITTER, ContentPlatform.FACEBOOK],
        description="Platforms to generate content for"
    )
    schedule_hour: int = Field(default=9, ge=0, le=23, description="Hour to run (0-23)")
    schedule_minute: int = Field(default=0, ge=0, le=59, description="Minute to run (0-59)")
    tone: str = Field(default="engaging and friendly", description="Content tone")
    include_emojis: bool = Field(default=True, description="Include emojis in content")
    max_hashtags: int = Field(default=10, ge=1, le=30, description="Maximum hashtags per post")


class UpdateScheduleRequest(BaseModel):
    """Request to update schedule time"""
    hour: int = Field(ge=0, le=23, description="Hour to run (0-23)")
    minute: int = Field(ge=0, le=59, description="Minute to run (0-59)")


class UpdatePlatformsRequest(BaseModel):
    """Request to update target platforms"""
    platforms: List[ContentPlatform]


class UpdateConfigurationRequest(BaseModel):
    """Request to update content generation configuration"""
    tone: Optional[str] = None
    include_emojis: Optional[bool] = None
    max_hashtags: Optional[int] = Field(None, ge=1, le=30)


class SchedulerStatusResponse(BaseModel):
    """Scheduler status response"""
    is_running: bool
    schedule: str
    next_run: Optional[str]
    last_run: Optional[str]
    last_run_status: Optional[str]
    total_runs: int
    successful_runs: int
    failed_runs: int
    target_platforms: List[str]
    configuration: dict


# ============= ENDPOINTS =============

@router.post("/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_daily_scheduler(request: InitializeSchedulerRequest):
    """
    Initialize the daily content generation scheduler with custom configuration.
    
    This creates a new scheduler instance with your specified settings.
    The scheduler will automatically generate content for one recipe per day.
    
    **Example Request:**
    ```json
    {
      "target_platforms": ["instagram", "twitter", "facebook"],
      "schedule_hour": 9,
      "schedule_minute": 0,
      "tone": "warm and inviting",
      "include_emojis": true,
      "max_hashtags": 10
    }
    ```
    
    **Note:** This will replace any existing scheduler configuration.
    """
    try:
        logger.info("Initializing daily content scheduler...")
        
        scheduler = initialize_scheduler(
            target_platforms=request.target_platforms,
            schedule_hour=request.schedule_hour,
            schedule_minute=request.schedule_minute,
            tone=request.tone,
            include_emojis=request.include_emojis,
            max_hashtags=request.max_hashtags
        )
        
        return {
            "success": True,
            "message": f"Scheduler initialized successfully. Will run daily at {request.schedule_hour:02d}:{request.schedule_minute:02d}",
            "configuration": {
                "schedule": f"{request.schedule_hour:02d}:{request.schedule_minute:02d} daily",
                "platforms": [p.value for p in request.target_platforms],
                "tone": request.tone,
                "include_emojis": request.include_emojis,
                "max_hashtags": request.max_hashtags
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to initialize scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize scheduler: {str(e)}"
        )


@router.post("/start")
async def start_scheduler():
    """
    Start the daily content generation scheduler.
    
    Once started, the scheduler will automatically:
    - Run every day at the configured time
    - Pick one unprocessed recipe
    - Generate content for all configured platforms
    - Mark the recipe as processed
    
    **Example Response:**
    ```json
    {
      "success": true,
      "message": "Scheduler started successfully",
      "next_run": "2025-11-05 09:00:00"
    }
    ```
    """
    try:
        scheduler = get_scheduler()
        
        if scheduler.is_running:
            return {
                "success": False,
                "message": "Scheduler is already running",
                "status": scheduler.get_status()
            }
        
        scheduler.start()
        status_info = scheduler.get_status()
        
        return {
            "success": True,
            "message": "Scheduler started successfully",
            "next_run": status_info['next_run'],
            "schedule": status_info['schedule']
        }
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scheduler: {str(e)}"
        )


@router.post("/stop")
async def stop_scheduler():
    """
    Stop the daily content generation scheduler.
    
    This will prevent any scheduled content generation from running.
    You can restart it later using the /start endpoint.
    """
    try:
        scheduler = get_scheduler()
        
        if not scheduler.is_running:
            return {
                "success": False,
                "message": "Scheduler is not running"
            }
        
        scheduler.stop()
        
        return {
            "success": True,
            "message": "Scheduler stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop scheduler: {str(e)}"
        )


@router.get("/status", response_model=SchedulerStatusResponse)
async def get_scheduler_status():
    """
    Get the current status of the daily content scheduler.
    
    Returns information about:
    - Whether scheduler is running
    - Next scheduled run time
    - Last run time and status
    - Total runs, successes, and failures
    - Current configuration
    
    **Example Response:**
    ```json
    {
      "is_running": true,
      "schedule": "09:00 daily",
      "next_run": "2025-11-05 09:00:00",
      "last_run": "2025-11-04 09:00:00",
      "last_run_status": "success",
      "total_runs": 5,
      "successful_runs": 5,
      "failed_runs": 0,
      "target_platforms": ["instagram", "twitter", "facebook"],
      "configuration": {
        "tone": "engaging and friendly",
        "include_emojis": true,
        "max_hashtags": 10
      }
    }
    ```
    """
    try:
        scheduler = get_scheduler()
        status_info = scheduler.get_status()
        
        return SchedulerStatusResponse(**status_info)
        
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get scheduler status: {str(e)}"
        )


@router.post("/run-now")
async def run_scheduler_now():
    """
    Manually trigger content generation immediately (for testing).
    
    This bypasses the schedule and generates content for one recipe right away.
    Useful for testing the scheduler without waiting for the scheduled time.
    
    **Note:** This will still mark the recipe as processed.
    """
    try:
        scheduler = get_scheduler()
        
        logger.info("Manual trigger: Running content generation now...")
        await scheduler.run_now()
        
        return {
            "success": True,
            "message": "Content generation triggered successfully",
            "note": "Check logs for detailed results"
        }
        
    except Exception as e:
        logger.error(f"Failed to run scheduler manually: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run scheduler: {str(e)}"
        )


@router.put("/schedule")
async def update_schedule(request: UpdateScheduleRequest):
    """
    Update the schedule time.
    
    Changes when the daily content generation runs.
    If the scheduler is running, it will be restarted with the new time.
    
    **Example Request:**
    ```json
    {
      "hour": 10,
      "minute": 30
    }
    ```
    """
    try:
        scheduler = get_scheduler()
        scheduler.update_schedule(request.hour, request.minute)
        
        return {
            "success": True,
            "message": f"Schedule updated to {request.hour:02d}:{request.minute:02d}",
            "new_schedule": f"{request.hour:02d}:{request.minute:02d} daily"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to update schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update schedule: {str(e)}"
        )


@router.put("/platforms")
async def update_platforms(request: UpdatePlatformsRequest):
    """
    Update the target platforms for content generation.
    
    Changes which social media platforms content will be generated for.
    
    **Example Request:**
    ```json
    {
      "platforms": ["instagram", "twitter", "facebook", "pinterest"]
    }
    ```
    """
    try:
        scheduler = get_scheduler()
        scheduler.update_platforms(request.platforms)
        
        return {
            "success": True,
            "message": "Target platforms updated successfully",
            "platforms": [p.value for p in request.platforms]
        }
        
    except Exception as e:
        logger.error(f"Failed to update platforms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update platforms: {str(e)}"
        )


@router.put("/configuration")
async def update_configuration(request: UpdateConfigurationRequest):
    """
    Update content generation configuration.
    
    Changes how content is generated (tone, emojis, hashtags).
    Only updates the fields you provide.
    
    **Example Request:**
    ```json
    {
      "tone": "professional and informative",
      "include_emojis": false,
      "max_hashtags": 5
    }
    ```
    """
    try:
        scheduler = get_scheduler()
        scheduler.update_configuration(
            tone=request.tone,
            include_emojis=request.include_emojis,
            max_hashtags=request.max_hashtags
        )
        
        return {
            "success": True,
            "message": "Configuration updated successfully",
            "configuration": scheduler.get_status()['configuration']
        }
        
    except Exception as e:
        logger.error(f"Failed to update configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}"
        )


@router.get("/health")
async def scheduler_health_check():
    """Health check endpoint for the scheduler service"""
    return {
        "status": "healthy",
        "service": "scheduler_controller",
        "endpoints": [
            "POST /api/scheduler/initialize",
            "POST /api/scheduler/start",
            "POST /api/scheduler/stop",
            "GET /api/scheduler/status",
            "POST /api/scheduler/run-now",
            "PUT /api/scheduler/schedule",
            "PUT /api/scheduler/platforms",
            "PUT /api/scheduler/configuration"
        ]
    }
