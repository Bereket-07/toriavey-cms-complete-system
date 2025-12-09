import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import asyncio

from src.use_cases.auto_generate_clips import AutoGenerateClipsUseCase

logger = logging.getLogger(__name__)

class YouTubeClipScheduler:
    """Scheduler for automatic YouTube clip generation."""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.use_case = AutoGenerateClipsUseCase()
        self.is_running = False
        
        # Default config
        self.config = {
            "channel_handle": "@ToriAvey",
            "interval_minutes": 60 * 24, # Run once a day by default
            "platforms": ["instagram_reels", "youtube_shorts", "facebook_reels"],
            "max_videos": 3
        }
        
    def start(self, interval_minutes: int = None):
        """Start the scheduler with interval."""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
            
        if interval_minutes:
            self.config["interval_minutes"] = interval_minutes
            
        # Re-instantiate scheduler to allow restarts after shutdown
        if not self.scheduler.running:
            self.scheduler = BackgroundScheduler()
            
        from datetime import datetime
        
        self.scheduler.add_job(
            func=self._run_job,
            trigger=IntervalTrigger(minutes=self.config["interval_minutes"]),
            id="youtube_clip_auto_gen",
            name="YouTube Clip Auto Generation",
            replace_existing=True,
            next_run_time=datetime.now() # Run immediately on start
        )
        
        try:
            self.scheduler.start()
            self.is_running = True
            print(f"DEBUG: Scheduler started. Job added with ID youtube_clip_auto_gen")
            logger.info(f"✅ YouTube Clip Scheduler started! Checking {self.config['channel_handle']} every {self.config['interval_minutes']} mins.")
        except Exception as e:
            print(f"DEBUG: Expected Scheduler Error (Startup): {e}")
            logger.error(f"Failed to start scheduler: {e}")
            # If start fails (e.g. Shutdown detected), try forcing a new instance and retry
            self.scheduler = BackgroundScheduler()
            print("DEBUG: Created NEW scheduler instance")
            self.scheduler.add_job(
                func=self._run_job,
                trigger=IntervalTrigger(minutes=self.config["interval_minutes"]),
                id="youtube_clip_auto_gen",
                name="YouTube Clip Auto Generation",
                replace_existing=True,
                next_run_time=datetime.now() # Run immediately on start
            )
            self.scheduler.start()
            self.is_running = True
            print("DEBUG: Scheduler started (recovered)")
            logger.info(f"✅ YouTube Clip Scheduler started (recovered)! Checking {self.config['channel_handle']} every {self.config['interval_minutes']} mins.")


    def start_with_cron(self, cron_expression: str):
        """Start scheduler with cron expression."""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
            
        # Parse cron expression (simple split for now, assuming standard 5-part cron)
        parts = cron_expression.split()
        if len(parts) != 5:
            raise ValueError("Invalid cron expression. Format: 'minute hour day month day_of_week'")
            
        from apscheduler.triggers.cron import CronTrigger
        
        # Re-instantiate scheduler to allow restarts
        self.scheduler = BackgroundScheduler()
        
        self.scheduler.add_job(
            func=self._run_job,
            trigger=CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4]
            ),
            id="youtube_clip_auto_gen",
            name="YouTube Clip Auto Generation",
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        logger.info(f"✅ YouTube Clip Scheduler started with cron: {cron_expression}")

    def stop(self):
        """Stop the scheduler."""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("⏹️ YouTube Clip Scheduler stopped.")
            
    def run_now(self):
        """Run the job immediately."""
        logger.info("🚀 Triggering immediate run...")
        return self._run_job()
        
    def get_status(self):
        """Get scheduler status."""
        next_run = None
        if self.is_running:
            jobs = self.scheduler.get_jobs()
            if jobs:
                next_run = str(jobs[0].next_run_time)
                
        return {
            "is_running": self.is_running,
            "config": self.config,
            "next_run": next_run
        }
        
    def update_config(self, interval_minutes: int = None, platforms: list = None, max_videos: int = None):
        """Update configuration."""
        restart_needed = False
        
        if interval_minutes and interval_minutes != self.config["interval_minutes"]:
            self.config["interval_minutes"] = interval_minutes
            restart_needed = True
            
        if platforms:
            self.config["platforms"] = platforms
            
        if max_videos:
            self.config["max_videos"] = max_videos
            
        if restart_needed and self.is_running:
            logger.info("Restarting scheduler with new config...")
            self.stop()
            self.start()
            
        return self.config

    def _run_job(self):
        """Wrapper to run async use case in sync scheduler job."""
        print("DEBUG: _run_job TRIGGERED!")
        try:
            logger.info("🚀 Starting YouTube auto-clip generation job...")
            print("DEBUG: Executing use case...")
            # Create a new event loop for this thread if needed, or use asyncio.run
            result = asyncio.run(self.use_case.execute(
                channel_handle=self.config["channel_handle"],
                platforms=self.config["platforms"],
                max_videos_to_process=self.config["max_videos"]
            ))
            print(f"DEBUG: Use case finished. Result: {result}")
            logger.info(f"✅ YouTube auto-clip generation job finished. {result.get('message', '')}")
            return result
        except Exception as e:
            print(f"DEBUG: _run_job FAILED: {e}")
            logger.error(f"❌ YouTube auto-clip generation job failed: {e}")
            return {"success": False, "error": str(e)}

# Global instance
_scheduler_instance = None

def get_youtube_scheduler() -> YouTubeClipScheduler:
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = YouTubeClipScheduler()
    return _scheduler_instance
