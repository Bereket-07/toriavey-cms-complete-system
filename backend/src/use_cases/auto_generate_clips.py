import logging
import asyncio
from typing import List, Dict, Any

from src.infrastructure.scrapers.youtube_scraper import YouTubeScraper
from src.use_cases.generate_clips import GenerateClipsUseCase
from src.infrastructure.repository.clip_repo import ClipRepository
from src.domain.schemas.clip_schemas import VideoSourceType, TargetPlatform

logger = logging.getLogger(__name__)

class AutoGenerateClipsUseCase:
    """
    Use case to automatically fetch videos from a YouTube channel
    and generate clips for specified platforms, skipping duplicates.
    """
    
    def __init__(self):
        self.scraper = YouTubeScraper()
        self.clip_generator = GenerateClipsUseCase()
        self.repo = ClipRepository()
        
    async def execute(
        self, 
        channel_handle: str = "@ToriAvey", 
        platforms: List[str] = None,
        max_videos_to_process: int = 5
    ) -> Dict[str, Any]:
        """
        Execute the auto-generation process.
        
        Args:
            channel_handle: YouTube handle to scrape
            platforms: List of target platforms (e.g. ["tiktok", "instagram_reels"])
            max_videos_to_process: Max number of recent videos to check
            
        Returns:
            Summary of operations
        """
        if platforms is None:
            platforms = ["tiktok", "instagram_reels", "youtube_shorts"]
            
        print(f"DEBUG: AutoGenerate running for {channel_handle} on {platforms}")
        logger.info(f"Starting auto-clip generation for {channel_handle} on {platforms}")
        
        # 1. Get Channel ID
        channel_id = await self.scraper.get_channel_id(channel_handle)
        if not channel_id:
            print("DEBUG: Channel ID not found!")
            return {"success": False, "error": f"Could not find channel ID for {channel_handle}"}
            
        # 2. Get Latest Videos
        videos = await self.scraper.get_latest_videos(channel_id)
        if not videos:
            return {"success": True, "message": "No videos found", "processed": 0}
            
        # Process only the most recent ones
        videos = videos[:max_videos_to_process]
        
        results = {
            "processed": 0,
            "generated": 0,
            "skipped": 0,
            "errors": 0,
            "details": []
        }
        
        # 3. Process each video
        for video in videos:
            video_url = video["url"]
            print(f"DEBUG: Processing video url: {video_url}")
            video_title = video["title"]
            logger.info(f"Processing video: {video_title} ({video_url})")
            
            for platform_str in platforms:
                try:
                    # Map string to enum
                    try:
                        target_platform = TargetPlatform(platform_str)
                    except ValueError:
                        logger.warning(f"Invalid platform: {platform_str}")
                        continue
                        
                    # Check if exists in DB (using async wrapper if needed, but repo is sync)
                    # We are in an async function, so we should wrap sync DB calls if possible,
                    # but for now direct call is okay if not blocking too much.
                    # Ideally use asyncio.to_thread for DB calls.
                    exists = await asyncio.to_thread(
                        self.repo.project_exists, 
                        source_video_url=video_url, 
                        target_platform=platform_str
                    )
                    
                    if exists:
                        logger.info(f"Skipping {platform_str} for {video_title} - already exists")
                        results["skipped"] += 1
                        continue
                        
                    # Generate Clips
                    logger.info(f"Generating {platform_str} clips for {video_title}")
                    
                    # Call generator
                    # Note: create_clips_for_platforms is async
                    gen_result = await self.clip_generator.create_clips_for_platforms(
                        video_url=video_url,
                        source_type=VideoSourceType.YOUTUBE,
                        target_platforms=[target_platform],
                        language="en",
                        max_clips_per_platform=5,
                        keywords=None, # Could extract from title/desc
                        project_name=f"Auto: {video_title[:30]}... - {platform_str}"
                    )
                    
                    print(f"DEBUG: Gen result for {platform_str}: {gen_result}")
                    logger.info(f"Gen result for {platform_str}: {gen_result}")
                    
                    if gen_result:
                        # Vizard Rate Limit: 3 requests per minute (1 req / 20s).
                        # We wait 25s to be safe.
                        import time
                        print(f"DEBUG: Waiting 25s to respect Vizard rate limit...")
                        time.sleep(25)

                    if not gen_result:
                        logger.error(f"gen_result is None or empty for {platform_str}")
                        results["errors"] += 1
                        continue

                    platform_result = gen_result.get(platform_str)
                    
                    if platform_result and (platform_result.get("data") or {}).get("projectId"):
                         results["generated"] += 1
                         results["details"].append({
                             "video": video_title,
                             "platform": platform_str,
                             "status": "generated"
                         })
                    else:
                        # Check for error
                        print(f"DEBUG: Failure for {platform_str}. platform_result: {platform_result}")
                        err = platform_result.get("error") if platform_result else "Unknown error (result was None)"
                        if not err and platform_result:
                             # Capture whatever is in there if error is missing
                             err = f"Unexpected response structure: {platform_result}"
                        
                        results["errors"] += 1
                        results["details"].append({
                             "video": video_title,
                             "platform": platform_str,
                             "status": "error",
                             "error": str(err)
                         })
                        
                except Exception as e:
                    logger.error(f"Error processing {video_title} for {platform_str}: {e}")
                    results["errors"] += 1
                    results["details"].append({
                        "video": video_title,
                        "platform": platform_str,
                        "status": "error",
                        "error": str(e)
                    })
            
            results["processed"] += 1
            
        # Check if we did anything
        if results["generated"] == 0 and results["errors"] == 0:
            if results["skipped"] > 0:
                results["message"] = f"✨ All caught up! Checked {results['processed']} videos, but they were all already processed."
            else:
                results["message"] = "No videos processed."
        else:
            results["message"] = f"🎉 Finished! Generated {results['generated']} new clips. Skipped {results['skipped']} existing."
            
        logger.info(results["message"])
        return results
