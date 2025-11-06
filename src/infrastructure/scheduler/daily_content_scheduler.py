# src/infrastructure/scheduler/daily_content_scheduler.py

"""
Daily Content Generation Scheduler

This scheduler automatically picks one unprocessed recipe per day and generates
social media content for all configured platforms.

Features:
- Runs daily at a configured time (default: 9:00 AM)
- Picks one recipe with content_generated=False
- Generates content for all platforms
- Marks recipe as processed
- Logs all activities
- Can be started/stopped via API
"""

import logging
import asyncio
from datetime import datetime
from typing import List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.use_cases.batch_generate_content import BatchGenerateContentUseCase
from src.domain.schemas.content_schemas import ContentPlatform
from src.infrastructure.repository.recipe_repo import RecipeRepository

logger = logging.getLogger(__name__)


class DailyContentScheduler:
    """
    Scheduler for daily automated content generation.
    Picks one recipe per day and generates social media content.
    """
    
    def __init__(
        self,
        target_platforms: List[ContentPlatform] = None,
        schedule_hour: int = 9,
        schedule_minute: int = 0,
        tone: str = "engaging and friendly",
        include_emojis: bool = True,
        max_hashtags: int = 10
    ):
        """
        Initialize the daily content scheduler.
        
        Args:
            target_platforms: List of platforms to generate content for
            schedule_hour: Hour to run (0-23, default: 9 for 9 AM)
            schedule_minute: Minute to run (0-59, default: 0)
            tone: Content tone
            include_emojis: Whether to include emojis
            max_hashtags: Maximum hashtags per post
        """
        self.scheduler = AsyncIOScheduler()
        self.target_platforms = target_platforms or [
            ContentPlatform.INSTAGRAM,
            ContentPlatform.TWITTER,
            ContentPlatform.FACEBOOK
        ]
        self.schedule_hour = schedule_hour
        self.schedule_minute = schedule_minute
        self.tone = tone
        self.include_emojis = include_emojis
        self.max_hashtags = max_hashtags
        
        self.use_case = BatchGenerateContentUseCase()
        self.repo = RecipeRepository()
        
        self.is_running = False
        self.last_run_time: Optional[datetime] = None
        self.last_run_status: Optional[str] = None
        self.total_runs = 0
        self.successful_runs = 0
        self.failed_runs = 0
        
        logger.info(f"DailyContentScheduler initialized - will run daily at {schedule_hour:02d}:{schedule_minute:02d}")
    
    async def generate_daily_content(self):
        """
        Main task: Generate content for one unprocessed recipe.
        This runs automatically every day at the scheduled time.
        """
        try:
            logger.info("="*60)
            logger.info("🚀 DAILY CONTENT GENERATION STARTED")
            logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info("="*60)
            
            self.total_runs += 1
            self.last_run_time = datetime.now()
            
            # Check if there are unprocessed recipes
            stats = self.repo.get_content_generation_stats()
            logger.info(f"📊 Statistics: {stats['pending_generation']} recipes pending")
            
            if stats['pending_generation'] == 0:
                logger.info("✅ No unprocessed recipes found. All recipes have content generated!")
                self.last_run_status = "no_recipes"
                return
            
            # Generate content for ONE recipe
            logger.info(f"🎯 Generating content for 1 recipe on platforms: {[p.value for p in self.target_platforms]}")
            
            result = await self.use_case.generate_from_unprocessed_recipes(
                target_platforms=self.target_platforms,
                limit=1,  # Only process ONE recipe per day
                tone=self.tone,
                include_emojis=self.include_emojis,
                max_hashtags=self.max_hashtags
            )
            
            if result['successful'] > 0:
                recipe_info = result['results'][0]
                logger.info("="*60)
                logger.info("✅ DAILY CONTENT GENERATION SUCCESSFUL")
                logger.info(f"Recipe ID: {recipe_info['recipe_id']}")
                logger.info(f"Recipe Title: {recipe_info['recipe_title']}")
                logger.info(f"Platforms: {len(recipe_info.get('generated_contents', []))}")
                logger.info("="*60)
                
                self.successful_runs += 1
                self.last_run_status = "success"
            else:
                logger.error("❌ DAILY CONTENT GENERATION FAILED")
                logger.error(f"Error: {result.get('message', 'Unknown error')}")
                self.failed_runs += 1
                self.last_run_status = "failed"
            
            # Log updated statistics
            updated_stats = self.repo.get_content_generation_stats()
            logger.info(f"📊 Updated Statistics: {updated_stats['pending_generation']} recipes remaining")
            logger.info(f"Progress: {updated_stats['completion_percentage']}% complete")
            
        except Exception as e:
            logger.error(f"❌ Error in daily content generation: {e}", exc_info=True)
            self.failed_runs += 1
            self.last_run_status = f"error: {str(e)}"
    
    def start(self):
        """Start the scheduler"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        try:
            # Add the daily job
            self.scheduler.add_job(
                self.generate_daily_content,
                trigger=CronTrigger(
                    hour=self.schedule_hour,
                    minute=self.schedule_minute
                ),
                id='daily_content_generation',
                name='Daily Content Generation',
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            
            logger.info("="*60)
            logger.info("✅ DAILY CONTENT SCHEDULER STARTED")
            logger.info(f"Schedule: Every day at {self.schedule_hour:02d}:{self.schedule_minute:02d}")
            logger.info(f"Platforms: {[p.value for p in self.target_platforms]}")
            logger.info(f"Tone: {self.tone}")
            logger.info(f"Emojis: {self.include_emojis}")
            logger.info(f"Max Hashtags: {self.max_hashtags}")
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return
        
        try:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("🛑 Daily content scheduler stopped")
        except Exception as e:
            logger.error(f"Failed to stop scheduler: {e}")
            raise
    
    async def run_now(self):
        """
        Manually trigger content generation immediately (for testing).
        This bypasses the schedule and runs the task right away.
        """
        logger.info("🔧 Manual trigger: Running content generation now...")
        await self.generate_daily_content()
    
    def get_status(self) -> dict:
        """Get current scheduler status"""
        next_run = None
        if self.is_running and self.scheduler.get_jobs():
            job = self.scheduler.get_job('daily_content_generation')
            if job and job.next_run_time:
                next_run = job.next_run_time.strftime('%Y-%m-%d %H:%M:%S')
        
        return {
            "is_running": self.is_running,
            "schedule": f"{self.schedule_hour:02d}:{self.schedule_minute:02d} daily",
            "next_run": next_run,
            "last_run": self.last_run_time.strftime('%Y-%m-%d %H:%M:%S') if self.last_run_time else None,
            "last_run_status": self.last_run_status,
            "total_runs": self.total_runs,
            "successful_runs": self.successful_runs,
            "failed_runs": self.failed_runs,
            "target_platforms": [p.value for p in self.target_platforms],
            "configuration": {
                "tone": self.tone,
                "include_emojis": self.include_emojis,
                "max_hashtags": self.max_hashtags
            }
        }
    
    def update_schedule(self, hour: int, minute: int):
        """
        Update the schedule time.
        
        Args:
            hour: New hour (0-23)
            minute: New minute (0-59)
        """
        if not (0 <= hour <= 23):
            raise ValueError("Hour must be between 0 and 23")
        if not (0 <= minute <= 59):
            raise ValueError("Minute must be between 0 and 59")
        
        self.schedule_hour = hour
        self.schedule_minute = minute
        
        # Restart scheduler with new time if it's running
        if self.is_running:
            self.stop()
            self.start()
            logger.info(f"Schedule updated to {hour:02d}:{minute:02d}")
    
    def update_platforms(self, platforms: List[ContentPlatform]):
        """Update target platforms"""
        self.target_platforms = platforms
        logger.info(f"Target platforms updated: {[p.value for p in platforms]}")
    
    def update_configuration(
        self,
        tone: str = None,
        include_emojis: bool = None,
        max_hashtags: int = None
    ):
        """Update content generation configuration"""
        if tone:
            self.tone = tone
        if include_emojis is not None:
            self.include_emojis = include_emojis
        if max_hashtags:
            self.max_hashtags = max_hashtags
        
        logger.info(f"Configuration updated: tone={self.tone}, emojis={self.include_emojis}, hashtags={self.max_hashtags}")


# Global scheduler instance
_scheduler_instance: Optional[DailyContentScheduler] = None


def get_scheduler() -> DailyContentScheduler:
    """Get or create the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = DailyContentScheduler()
    return _scheduler_instance


def initialize_scheduler(
    target_platforms: List[ContentPlatform] = None,
    schedule_hour: int = 9,
    schedule_minute: int = 0,
    tone: str = "engaging and friendly",
    include_emojis: bool = True,
    max_hashtags: int = 10
) -> DailyContentScheduler:
    """
    Initialize the global scheduler with custom configuration.
    
    Args:
        target_platforms: List of platforms to generate content for
        schedule_hour: Hour to run (0-23)
        schedule_minute: Minute to run (0-59)
        tone: Content tone
        include_emojis: Whether to include emojis
        max_hashtags: Maximum hashtags per post
    
    Returns:
        Configured scheduler instance
    """
    global _scheduler_instance
    _scheduler_instance = DailyContentScheduler(
        target_platforms=target_platforms,
        schedule_hour=schedule_hour,
        schedule_minute=schedule_minute,
        tone=tone,
        include_emojis=include_emojis,
        max_hashtags=max_hashtags
    )
    return _scheduler_instance
