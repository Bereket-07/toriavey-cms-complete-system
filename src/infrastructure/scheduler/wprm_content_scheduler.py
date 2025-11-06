"""
WPRM Content Generation Scheduler
Automatically generates content for WPRM recipes on a schedule
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from src.use_cases.generate_wprm_content import GenerateWPRMContentUseCase
from src.infrastructure.repository.wprm_content_status_repo import WPRMContentStatusRepository

logger = logging.getLogger(__name__)


class WPRMContentScheduler:
    """Scheduler for automatic WPRM content generation"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.use_case = GenerateWPRMContentUseCase()
        self.status_repo = WPRMContentStatusRepository()
        self.is_running = False
        
        # Default configuration
        self.config = {
            "recipes_per_run": 5,
            "interval_minutes": 60,  # Run every hour by default
            "platforms": ["instagram", "tiktok", "facebook", "twitter", "pinterest"]
        }
    
    def start(self, interval_minutes: int = None, recipes_per_run: int = None):
        """
        Start the scheduler
        
        Args:
            interval_minutes: How often to run (in minutes)
            recipes_per_run: How many recipes to process per run
        """
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        # Update config
        if interval_minutes:
            self.config["interval_minutes"] = interval_minutes
        if recipes_per_run:
            self.config["recipes_per_run"] = recipes_per_run
        
        # Add job
        self.scheduler.add_job(
            func=self._generate_content_job,
            trigger=IntervalTrigger(minutes=self.config["interval_minutes"]),
            id="wprm_content_generation",
            name="WPRM Content Generation",
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        logger.info(f"✅ WPRM Content Scheduler started!")
        logger.info(f"   Interval: Every {self.config['interval_minutes']} minutes")
        logger.info(f"   Recipes per run: {self.config['recipes_per_run']}")
        logger.info(f"   Platforms: {', '.join(self.config['platforms'])}")
    
    def start_with_cron(self, cron_expression: str, recipes_per_run: int = None):
        """
        Start scheduler with cron expression
        
        Args:
            cron_expression: Cron expression (e.g., "0 9 * * *" for 9 AM daily)
            recipes_per_run: How many recipes to process per run
        """
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        if recipes_per_run:
            self.config["recipes_per_run"] = recipes_per_run
        
        # Parse cron expression
        parts = cron_expression.split()
        if len(parts) != 5:
            raise ValueError("Invalid cron expression. Format: 'minute hour day month day_of_week'")
        
        self.scheduler.add_job(
            func=self._generate_content_job,
            trigger=CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4]
            ),
            id="wprm_content_generation",
            name="WPRM Content Generation",
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        logger.info(f"✅ WPRM Content Scheduler started with cron!")
        logger.info(f"   Schedule: {cron_expression}")
        logger.info(f"   Recipes per run: {self.config['recipes_per_run']}")
    
    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return
        
        self.scheduler.shutdown()
        self.is_running = False
        logger.info("⏹️  WPRM Content Scheduler stopped")
    
    def run_now(self) -> Dict[str, Any]:
        """Run content generation immediately"""
        logger.info("🚀 Running content generation now...")
        return self._generate_content_job()
    
    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status"""
        summary = self.status_repo.get_status_summary()
        
        next_run = None
        if self.is_running:
            jobs = self.scheduler.get_jobs()
            if jobs:
                next_run = str(jobs[0].next_run_time)
        
        return {
            "is_running": self.is_running,
            "config": self.config,
            "next_run": next_run,
            "content_status": summary
        }
    
    def update_config(
        self, 
        interval_minutes: int = None,
        recipes_per_run: int = None,
        platforms: list = None
    ):
        """Update scheduler configuration"""
        restart_needed = False
        
        if interval_minutes and interval_minutes != self.config["interval_minutes"]:
            self.config["interval_minutes"] = interval_minutes
            restart_needed = True
        
        if recipes_per_run:
            self.config["recipes_per_run"] = recipes_per_run
        
        if platforms:
            self.config["platforms"] = platforms
        
        # Restart if running and interval changed
        if restart_needed and self.is_running:
            logger.info("Restarting scheduler with new interval...")
            self.stop()
            self.start()
        
        return {
            "success": True,
            "config": self.config,
            "restarted": restart_needed
        }
    
    def _generate_content_job(self) -> Dict[str, Any]:
        """Job function to generate content"""
        try:
            logger.info(f"📝 Starting content generation job...")
            logger.info(f"   Processing {self.config['recipes_per_run']} recipes")
            
            # Generate content
            result = self.use_case.generate_batch(
                limit=self.config["recipes_per_run"],
                platforms=self.config["platforms"]
            )
            
            logger.info(f"✅ Content generation completed!")
            logger.info(f"   Successful: {result['successful']}")
            logger.info(f"   Failed: {result['failed']}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Content generation job failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global scheduler instance
_scheduler_instance: Optional[WPRMContentScheduler] = None


def get_scheduler() -> WPRMContentScheduler:
    """Get or create scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = WPRMContentScheduler()
    return _scheduler_instance
