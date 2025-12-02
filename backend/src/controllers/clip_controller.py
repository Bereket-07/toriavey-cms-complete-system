import logging
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio

from src.infrastructure.apis.vizard_api import VizardAPI, VideoType
from src.infrastructure.repository.clip_repo import ClipRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clips", tags=["Video Clips"])

class GenerateClipRequest(BaseModel):
    video_url: str
    platforms: List[str]  # List of platforms: "youtube_shorts", "tiktok", "instagram_reels", etc.
    lang: str = "en"
    keywords: Optional[str] = None

@router.post("/generate")
async def generate_clips(request: GenerateClipRequest):
    """
    Generate video clips from a long-form video URL for multiple platforms.
    """
    try:
        vizard = VizardAPI()
        repo = ClipRepository()
        results = {}
        
        logger.info(f"Received clip generation request for URL: {request.video_url} on platforms: {request.platforms}")

        for platform in request.platforms:
            try:
                result = None
                platform_key = platform.lower()
                
                if platform_key == "youtube_shorts":
                    result = await vizard.create_youtube_shorts(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                elif platform_key == "tiktok":
                    result = await vizard.create_tiktok_clips(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                elif platform_key == "instagram_reels" or platform_key == "instagram":
                    result = await vizard.create_instagram_reels(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                elif platform_key == "facebook" or platform_key == "facebook_reels":
                    result = await vizard.create_facebook_reels(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                elif platform_key == "linkedin":
                    result = await vizard.create_linkedin_clips(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                elif platform_key == "twitter":
                    result = await vizard.create_twitter_clips(
                        video_url=request.video_url,
                        lang=request.lang,
                        keywords=request.keywords
                    )
                else:
                    logger.warning(f"Unsupported platform: {platform}")
                    results[platform] = {"error": "Unsupported platform"}
                    continue

                if result:
                    results[platform] = result
                    logger.info(f"Vizard response for {platform}: {result}")
                    
                    # Save project to DB
                    project_id = result.get("data", {}).get("projectId") or result.get("projectId")
                    logger.info(f"Extracted project ID: {project_id}")
                    
                    if project_id:
                        try:
                            logger.info(f"Saving project {project_id} to DB...")
                            repo.create_project({
                                "project_id": project_id,
                                "project_name": f"{platform} Project",
                                "source_video_url": request.video_url,
                                "source_platform": "unknown", # Could infer from URL
                                "target_platform": platform,
                                "language": request.lang,
                                "keywords": request.keywords
                            })
                            logger.info(f"Successfully saved project {project_id} to DB")
                        except Exception as db_err:
                            logger.error(f"Failed to save project to DB: {db_err}")
                    else:
                        logger.error(f"Could not extract project ID from result: {result}")

            except Exception as e:
                logger.error(f"Error generating clips for {platform}: {e}")
                results[platform] = {"error": str(e)}

        return results

    except Exception as e:
        logger.error(f"Failed to generate clips: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project/{project_id}")
async def get_project_status(project_id: str):
    """
    Get the status of a Vizard project.
    """
    try:
        repo = ClipRepository()
        
        # Check DB first
        project_details = repo.get_project_details(project_id)
        if project_details and project_details.get("status") == "completed":
            # Return cached result in Vizard API format structure for frontend compatibility
            return {
                "code": 2000,
                "data": {
                    "projectId": project_id,
                    "videos": project_details.get("generated_clips", [])
                }
            }

        # If not processed in DB, call API
        try:
            vizard = VizardAPI()
            result = await vizard.get_project(project_id)
            
            # Check if completed
            code = result.get("code") or result.get("data", {}).get("code")
            if code == 2000:
                # Save clips to DB
                # Check for videos in data object or at root
                videos = result.get("data", {}).get("videos") or result.get("videos", [])
                
                if videos:
                    logger.info(f"Saving {len(videos)} clips for project {project_id}")
                    repo.add_clips_to_project(project_id, videos)
                else:
                    logger.warning(f"Project {project_id} completed but no videos found in response: {result.keys()}")
            
            return result
        except Exception as e:
            logger.error(f"Vizard API error for project {project_id}: {e}")
            # Return a graceful error response instead of 500
            return {
                "code": 5000,
                "message": f"Failed to fetch project status from Vizard: {str(e)}",
                "data": {
                    "projectId": project_id,
                    "status": "error"
                }
            }

    except Exception as e:
        logger.error(f"Error getting project status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_projects():
    """
    List all generated projects and clips.
    """
    try:
        repo = ClipRepository()
        return repo.get_all_projects()
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))
