"""
WPRM Content Scheduler Controller
API endpoints for managing WPRM content generation scheduling
"""

import logging
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional

from src.infrastructure.scheduler.wprm_content_scheduler import get_scheduler
from src.use_cases.generate_wprm_content import GenerateWPRMContentUseCase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/wprm-scheduler", tags=["WPRM Content Scheduler"])


# ============= REQUEST SCHEMAS =============

class StartSchedulerRequest(BaseModel):
    """Request to start scheduler"""
    interval_minutes: Optional[int] = 60
    recipes_per_run: Optional[int] = 5


class StartCronSchedulerRequest(BaseModel):
    """Request to start scheduler with cron"""
    cron_expression: str  # e.g., "0 9 * * *" for 9 AM daily
    recipes_per_run: Optional[int] = 5


class UpdateConfigRequest(BaseModel):
    """Request to update scheduler config"""
    interval_minutes: Optional[int] = None
    recipes_per_run: Optional[int] = None
    platforms: Optional[List[str]] = None


class GenerateSingleRequest(BaseModel):
    """Request to generate content for single recipe"""
    recipe_id: int
    platforms: Optional[List[str]] = None


class GenerateBatchRequest(BaseModel):
    """Request to generate content for multiple recipes"""
    limit: int = 10
    platforms: Optional[List[str]] = None


# ============= ENDPOINTS =============

@router.post("/start")
async def start_scheduler(request: StartSchedulerRequest):
    """
    Start the WPRM content generation scheduler
    
    The scheduler will automatically generate content for recipes at regular intervals.
    
    Args:
        interval_minutes: How often to run (default: 60 minutes)
        recipes_per_run: How many recipes to process per run (default: 5)
    
    Returns:
        Scheduler status
    """
    try:
        scheduler = get_scheduler()
        scheduler.start(
            interval_minutes=request.interval_minutes,
            recipes_per_run=request.recipes_per_run
        )
        
        return {
            "success": True,
            "message": "Scheduler started successfully",
            "status": scheduler.get_status()
        }
        
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/start-cron")
async def start_cron_scheduler(request: StartCronSchedulerRequest):
    """
    Start scheduler with cron expression
    
    Cron format: "minute hour day month day_of_week"
    
    Examples:
    - "0 9 * * *" - Every day at 9 AM
    - "0 */6 * * *" - Every 6 hours
    - "0 9 * * 1" - Every Monday at 9 AM
    - "*/30 * * * *" - Every 30 minutes
    
    Args:
        cron_expression: Cron schedule expression
        recipes_per_run: How many recipes to process per run
    
    Returns:
        Scheduler status
    """
    try:
        scheduler = get_scheduler()
        scheduler.start_with_cron(
            cron_expression=request.cron_expression,
            recipes_per_run=request.recipes_per_run
        )
        
        return {
            "success": True,
            "message": f"Scheduler started with cron: {request.cron_expression}",
            "status": scheduler.get_status()
        }
        
    except Exception as e:
        logger.error(f"Failed to start cron scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/stop")
async def stop_scheduler():
    """
    Stop the WPRM content generation scheduler
    
    Returns:
        Success message
    """
    try:
        scheduler = get_scheduler()
        scheduler.stop()
        
        return {
            "success": True,
            "message": "Scheduler stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status")
async def get_scheduler_status():
    """
    Get current scheduler status
    
    Returns:
        Scheduler status including:
        - Is running
        - Configuration
        - Next run time
        - Content generation statistics
    """
    try:
        scheduler = get_scheduler()
        return {
            "success": True,
            **scheduler.get_status()
        }
        
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/run-now")
async def run_scheduler_now(background_tasks: BackgroundTasks):
    """
    Run content generation immediately (without waiting for schedule)
    
    Generates content for the configured number of recipes in the background.
    Returns immediately without blocking.
    
    Returns:
        Confirmation that generation has started
    """
    try:
        scheduler = get_scheduler()
        
        # Run generation in background without blocking
        background_tasks.add_task(scheduler.run_now)
        
        return {
            "success": True,
            "message": "Content generation started in background",
            "status": "running"
        }
        
    except Exception as e:
        logger.error(f"Failed to start generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/config")
async def update_scheduler_config(request: UpdateConfigRequest):
    """
    Update scheduler configuration
    
    Args:
        interval_minutes: New interval (will restart scheduler if running)
        recipes_per_run: New number of recipes per run
        platforms: New list of platforms
    
    Returns:
        Updated configuration
    """
    try:
        scheduler = get_scheduler()
        result = scheduler.update_config(
            interval_minutes=request.interval_minutes,
            recipes_per_run=request.recipes_per_run,
            platforms=request.platforms
        )
        
        return {
            "success": True,
            "message": "Configuration updated",
            **result
        }
        
    except Exception as e:
        logger.error(f"Failed to update config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/generate-single")
async def generate_single_recipe(request: GenerateSingleRequest):
    """
    Generate content for a single recipe immediately
    
    Args:
        recipe_id: Recipe post ID
        platforms: List of platforms (default: all)
    
    Returns:
        Generated content for all platforms
    """
    try:
        use_case = GenerateWPRMContentUseCase()
        result = use_case.generate_for_single_recipe(
            recipe_id=request.recipe_id,
            platforms=request.platforms
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Failed to generate content for recipe {request.recipe_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/generate-batch")
async def generate_batch_recipes(request: GenerateBatchRequest):
    """
    Generate content for multiple recipes immediately
    
    Args:
        limit: Maximum number of recipes to process
        platforms: List of platforms (default: all)
    
    Returns:
        Batch generation results
    """
    try:
        use_case = GenerateWPRMContentUseCase()
        result = use_case.generate_batch(
            limit=request.limit,
            platforms=request.platforms
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Failed to generate batch content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
