# src/controllers/clips_controller.py

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from typing import List

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
from src.use_cases.manage_clips import ManageClipsUseCase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clips", tags=["Clips Management"])


# ============= CLIP GENERATION ENDPOINTS =============

@router.post("/generate", response_model=CreateClipsResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_clips(
    request: CreateClipsRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate video clips from a source video for multiple platforms.
    
    This endpoint submits the video to Vizard AI for processing.
    Clips will be generated asynchronously and can be retrieved later.
    
    **Workflow:**
    1. Submit video URL with target platforms
    2. Vizard processes video and generates clips
    3. Clips appear in pending dashboard for review
    4. Approve/reject clips
    5. Post approved clips to social media
    """
    try:
        logger.info(f"Generating clips for {len(request.target_platforms)} platforms")
        
        use_case = GenerateClipsUseCase()
        
        # Start clip generation in background
        background_tasks.add_task(
            use_case.create_clips_for_platforms,
            video_url=request.video_url,
            source_type=request.source_type,
            target_platforms=request.target_platforms,
            language=request.language,
            max_clips_per_platform=request.max_clips_per_platform,
            keywords=request.keywords,
            project_name=request.project_name,
            file_extension=request.file_extension
        )
        
        return CreateClipsResponse(
            success=True,
            message="Clip generation started successfully. Check back soon for results.",
            vizard_project_id=None,  # Will be updated when Vizard responds
            total_clips_requested=len(request.target_platforms) * request.max_clips_per_platform,
            platforms=[p.value for p in request.target_platforms]
        )
        
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
        clip_data = {
            "id": request.clip_id,
            "clip_url": "path/to/video.mp4",  # TODO: Get from database
            "title": "Sample Title",
            "description": "Sample Description"
        }
        
        results = await use_case.post_clip_to_platforms(
            clip_data=clip_data,
            platforms=request.platforms,
            custom_caption=request.custom_caption,
            custom_hashtags=request.custom_hashtags
        )
        
        return PostClipResponse(
            success=len(results["posted_platforms"]) > 0,
            message=f"Posted to {len(results['posted_platforms'])} platform(s)",
            clip_id=request.clip_id,
            posted_platforms=results["posted_platforms"],
            failed_platforms=results["failed_platforms"]
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
