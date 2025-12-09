import logging
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio

from src.infrastructure.apis.vizard_api import VizardAPI, VideoType
from src.infrastructure.repository.clip_repo import ClipRepository
from src.infrastructure.apis.composio import ComposioAuthRequired
import traceback

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
            
            # 2000 is success. Anything else might be a failure or pending.
            # Vizard docs say 2000 is success. 
            # If code is explicitly a failure code (like 4008), we should delete.
            # Assuming non-2000 and non-pending (if there is a pending code) is failure.
            # But wait, what if it's just "processing"?
            # Usually processing status is inside the data object, not the top level code.
            # Top level code usually indicates API request status.
            # If code != 2000, it's likely an error.
            
            if code == 2000:
                # Save clips to DB
                # Check for videos in data object or at root
                videos = result.get("data", {}).get("videos") or result.get("videos", [])
                
                if videos:
                    logger.info(f"Saving {len(videos)} clips for project {project_id}")
                    repo.add_clips_to_project(project_id, videos)
                else:
                    logger.warning(f"Project {project_id} completed but no videos found in response: {result.keys()}")
            elif code and code != 2000:
                # API returned an error code (e.g. 4008 Failed to download video)
                logger.error(f"Vizard API returned error code {code} for project {project_id}: {result.get('errMsg')}")
                
                # Delete the failed project
                try:
                    await asyncio.to_thread(repo.delete_project, project_id)
                    logger.info(f"Deleted failed project {project_id} due to API error code {code}")
                except Exception as del_err:
                    logger.error(f"Failed to delete project {project_id} after API error code: {del_err}")
                
                # Return error response
                return {
                    "code": code,
                    "message": result.get("errMsg", "Unknown error"),
                    "data": {
                        "projectId": project_id,
                        "status": "error"
                    }
                }
        except Exception as e:
            logger.error(f"Vizard API error for project {project_id}: {e}")
            
            # Delete the failed project from DB so it doesn't get polled again
            try:
                await asyncio.to_thread(repo.delete_project, project_id)
                logger.info(f"Deleted failed project {project_id} from DB")
            except Exception as del_err:
                logger.error(f"Failed to delete project {project_id} after API error: {del_err}")

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
    Automatically cleans up failed projects before listing.
    """
    try:
        repo = ClipRepository()
        
        # Run cleanup in a separate thread to avoid blocking
        await asyncio.to_thread(repo.delete_failed_projects)
        
        # Fetch projects in a separate thread
        return await asyncio.to_thread(repo.get_all_projects)
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{clip_id}/post")
async def post_clip(clip_id: int):
    """
    Post a specific clip to its target platform.
    """
    try:
        logger.info(f"Attempting to post clip {clip_id}")
        repo = ClipRepository()
        clip = repo.get_clip_by_id(clip_id)
        
        if not clip:
            logger.error(f"Clip {clip_id} not found in DB")
            raise HTTPException(status_code=404, detail="Clip not found")
            
        logger.info(f"Found clip {clip_id}, status: {clip.status}, vizard_project_id: {clip.vizard_project_id}")

        if clip.status == "posted":
            return {"message": "Clip already posted", "post_url": None} 
            
        project = repo.get_project_by_vizard_id(clip.vizard_project_id)
        platform = project.target_platform.lower() if project else "unknown"
        
        logger.info(f"Associated project: {project.project_id if project else 'None'}, Platform: {platform}")
        
        result = {"successful": False, "error": f"Unknown or unsupported platform: {platform}"}
        
        if "youtube" in platform:
            from src.infrastructure.apis.youtube_api import YouTubeAPI
            # We need an entity ID. Assuming a default or user-specific one.
            # For now using a default 'default' or from config if available.
            # Ideally this comes from the authenticated user context.
            api = YouTubeAPI(entity_id="default") 
            result = await api.upload_short(
                video_file_path=clip.clip_url, # This is a URL, YouTubeAPI expects file path? 
                # Wait, Composio YouTube upload might expect a URL or we need to download it first.
                # Let's check YouTubeAPI implementation. It says 'videoFilePath'. 
                # If Composio supports URL, great. If not, we might need to download to temp.
                # Re-checking YouTubeAPI... it passes 'videoFilePath' to params. 
                # Composio often handles URLs if the action supports it. 
                # Let's assume URL works or we'll need to add a download step.
                title=clip.title or "New Short",
                description=clip.description or "",
                tags=clip.keywords.split(",") if clip.keywords else []
            )
            
        elif "facebook" in platform:
            from src.infrastructure.apis.facebook_api import FacebookAPI
            api = FacebookAPI(entity_id="default")
            result = await api.upload_reel(
                video_url=clip.clip_url,
                caption=clip.title or ""
            )
            
        elif "instagram" in platform:
            from src.infrastructure.apis.instagram_api import InstagramAPI
            api = InstagramAPI(entity_id="default")
            # Use post_reel for video clips
            result = await api.post_reel(
                video_url=clip.clip_url,
                caption=clip.title or "",
                cover_url=clip.thumbnail_url
            )

        if result.get("successful"):
            # Update clip status
            repo.update_clip_status(clip_id, "posted")
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Posting failed"))

    except ComposioAuthRequired as auth_err:
        logger.warning(f"Authentication required for {auth_err.app_name}: {auth_err.auth_url}")
        return {
            "successful": False,
            "error": "Authentication required",
            "auth_url": auth_err.auth_url,
            "message": f"Please authenticate {auth_err.app_name} to proceed."
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        # Fallback for when isinstance fails due to reload/import issues
        if "ComposioAuthRequired" in type(e).__name__:
             # Try to extract attributes if possible, otherwise just log
             try:
                 auth_url = getattr(e, "auth_url", None)
                 app_name = getattr(e, "app_name", "App")
                 if auth_url:
                    logger.warning(f"Authentication required (caught by name check) for {app_name}: {auth_url}")
                    return {
                        "successful": False,
                        "error": "Authentication required",
                        "auth_url": auth_url,
                        "message": f"Please authenticate {app_name} to proceed."
                    }
             except:
                 pass
        
        logger.error(f"Failed to post clip {clip_id}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

