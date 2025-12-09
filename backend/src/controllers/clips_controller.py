# src/controllers/clips_controller.py

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from typing import List, Dict, Any

from src.domain.schemas.clip_schemas import (
    CreateClipsRequest,
    CreateClipsResponse,
    ApproveClipRequest,
    RejectClipRequest,
    PostClipRequest,
    PostClipResponse,
    PendingClipsResponse,
    ClipWithPostsResponse,
    ClipResponse,
    SocialPostResponse
)
from src.use_cases.generate_clips import GenerateClipsUseCase
from src.infrastructure.apis.composio import ComposioAuthRequired
from src.use_cases.manage_clips import ManageClipsUseCase
from src.infrastructure.repository.clip_repo import ClipRepository
from src.infrastructure.apis.vizard_api import VizardAPI

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clips", tags=["Clips Management"])


# ============= CLIP GENERATION ENDPOINTS =============

@router.post("/generate", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def generate_clips(
    request: CreateClipsRequest
):
    """
    Generate video clips from a source video for multiple platforms.
    
    This endpoint submits the video to Vizard AI for processing.
    Returns the project details for each platform immediately.
    """
    try:
        logger.info(f"Generating clips for {len(request.target_platforms)} platforms")
        from src.domain.schemas.clip_schemas import VideoSourceType
        
        use_case = GenerateClipsUseCase()
        
        # Await the result directly instead of using background tasks
        # This ensures we return the project IDs to the frontend
        results = await use_case.create_clips_for_platforms(
            video_url=request.video_url,
            source_type=request.source_type,
            target_platforms=request.target_platforms,
            language=request.language,
            max_clips_per_platform=request.max_clips_per_platform,
            keywords=request.keywords,
            project_name=request.project_name,
            file_extension=request.file_extension
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Failed to generate clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start clip generation: {str(e)}"
        )


@router.post("/generate-all", response_model=CreateClipsResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_all_platform_clips(
    video_url: str,
    source_type: str = "youtube",
    language: str = "en",
    max_clips: int = 5,
    keywords: str = None,
    background_tasks: BackgroundTasks = None
):
    """
    Quick endpoint to generate clips for ALL supported platforms at once.
    
    **Platforms included:**
    - YouTube Shorts
    - TikTok
    - Instagram Reels
    - Facebook Reels
    - LinkedIn
    - Twitter/X
    """
    try:
        from src.domain.schemas.clip_schemas import VideoSourceType
        
        use_case = GenerateClipsUseCase()
        
        background_tasks.add_task(
            use_case.create_all_platform_clips,
            video_url=video_url,
            source_type=VideoSourceType(source_type),
            language=language,
            max_clips=max_clips,
            keywords=keywords
        )
        
        return CreateClipsResponse(
            success=True,
            message="Generating clips for all platforms",
            vizard_project_id=None,
            total_clips_requested=max_clips * 6,  # 6 platforms
            platforms=["youtube_shorts", "tiktok", "instagram_reels", "facebook_reels", "linkedin", "twitter"]
        )
        
    except Exception as e:
        logger.error(f"Failed to generate all platform clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= CLIP REVIEW ENDPOINTS =============

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats")
async def get_clip_stats():
    """
    Get aggregated statistics for video clips.
    """
    try:
        repo = ClipRepository()
        return repo.get_clip_stats()
    except Exception as e:
        logger.error(f"Failed to get clip stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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


@router.get("/pending", response_model=PendingClipsResponse)
async def get_pending_clips():
    """
    Get all pending clips awaiting approval/rejection.
    
    Returns clips with their metadata and target platforms,
    ready for review in the dashboard.
    """
    try:
        # TODO: Fetch from database
        # For now, return mock data
        mock_clips = []
        
        return PendingClipsResponse(
            total_pending=len(mock_clips),
            clips=mock_clips
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch pending clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/clip/{clip_id}", response_model=ClipWithPostsResponse)
async def get_clip_details(clip_id: int):
    """
    Get detailed information about a specific clip including its social posts.
    """
    try:
        # TODO: Fetch from database
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clip {clip_id} not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch clip {clip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/approve")
async def approve_clip(request: ApproveClipRequest):
    """
    Approve a clip for posting to social media.
    
    Once approved, the clip can be posted using the /post endpoint.
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageClipsUseCase(entity_id=entity_id)
        
        # TODO: Fetch clip data from database
        clip_data = {"id": request.clip_id}
        
        result = await use_case.approve_clip(
            clip_id=request.clip_id,
            clip_data=clip_data,
            approved_by=request.approved_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to approve clip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/reject")
async def reject_clip(request: RejectClipRequest):
    """
    Reject a clip.
    
    Rejected clips will not be posted and can be filtered out of the dashboard.
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageClipsUseCase(entity_id=entity_id)
        
        result = await use_case.reject_clip(
            clip_id=request.clip_id,
            rejection_reason=request.rejection_reason,
            rejected_by=request.rejected_by
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to reject clip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============= POSTING ENDPOINTS =============

@router.post("/post", response_model=PostClipResponse)
async def post_clip_to_social_media(request: PostClipRequest):
    """
    Post an approved clip to specified social media platforms.
    
    **Requirements:**
    - Clip must be approved
    - Valid authentication for each platform
    - Clip video file must be accessible
    
    **Supported Platforms:**
    - YouTube Shorts (via Composio)
    - TikTok (coming soon)
    - Instagram Reels (coming soon)
    - Facebook Reels (coming soon)
    - LinkedIn (coming soon)
    - Twitter/X (coming soon)
    """
    try:
        # TODO: Get entity_id from auth/session
        entity_id = "default_user"
        
        use_case = ManageClipsUseCase(entity_id=entity_id)
        
        # TODO: Fetch clip data from database and verify it's approved
        # For now, we accept the URL from the frontend to enable immediate posting
        clip_data = {
            "id": request.clip_id,
            "clip_url": request.clip_url or "path/to/video.mp4", 
            "cover_url": request.cover_url,
            "title": request.custom_caption or "Video Clip", # Use caption as title if not provided
            "description": request.custom_caption or ""
        }
        
        results = await use_case.post_clip_to_platforms(
            clip_data=clip_data,
            platforms=request.platforms,
            custom_caption=request.custom_caption,
            custom_hashtags=request.custom_hashtags
        )
        
        # Update clip status in DB if successful
        if results["posted_platforms"]:
            try:
                repo = ClipRepository()
                # request.clip_id might be a string, try to convert to int
                clip_db_id = int(request.clip_id)
                repo.update_clip_status(clip_db_id, "posted")
                logger.info(f"Updated status to 'posted' for clip {clip_db_id}")
            except ValueError:
                logger.warning(f"Could not convert clip_id {request.clip_id} to int for status update")
            except Exception as e:
                logger.error(f"Failed to update clip status in DB: {e}")

        return PostClipResponse(
            success=len(results["posted_platforms"]) > 0,
            message=f"Posted to {len(results['posted_platforms'])} platform(s)",
            clip_id=request.clip_id,
            posted_platforms=results["posted_platforms"],
            failed_platforms=results["failed_platforms"]
        )
        
    except ComposioAuthRequired as e:
        logger.warning(f"Authentication required for posting: {e}")
        return PostClipResponse(
            success=False,
            message="Authentication required",
            clip_id=request.clip_id,
            posted_platforms=[],
            failed_platforms=[],
            auth_required=True,
            auth_url=e.auth_url
        )
    except Exception as e:
        logger.error(f"Failed to post clip: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the clips service"""
    return {
        "status": "healthy",
        "service": "clips_controller",
        "endpoints": [
            "POST /api/clips/generate",
            "POST /api/clips/generate-all",
            "GET /api/clips/pending",
            "GET /api/clips/clip/{clip_id}",
            "POST /api/clips/approve",
            "POST /api/clips/reject",
            "POST /api/clips/post"
        ]
    }
