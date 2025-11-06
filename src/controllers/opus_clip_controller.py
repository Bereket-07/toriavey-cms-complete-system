"""
OpusClip Controller
API endpoints for OpusClip video processing
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import os

from src.infrastructure.video_processing.opus_clip_service import OpusClipService
from src.use_cases.process_video_with_opus import ProcessVideoWithOpusUseCase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/opus", tags=["OpusClip"])

# Initialize OpusClip service
OPUS_API_KEY = os.getenv("OPUS_API_KEY", "")
if not OPUS_API_KEY:
    logger.warning("OPUS_API_KEY not found in environment variables")

opus_service = OpusClipService(api_key=OPUS_API_KEY)
opus_use_case = ProcessVideoWithOpusUseCase(opus_service=opus_service)


# ==================== REQUEST/RESPONSE MODELS ====================

class CreateClipProjectRequest(BaseModel):
    """Request model for creating a clip project"""
    video_url: str = Field(..., description="URL of the video to process")
    title: Optional[str] = Field(None, description="Custom title for the project")
    curation_model: str = Field("ClipAnything", description="ClipBasic or ClipAnything")
    clip_durations: Optional[List[List[int]]] = Field(
        None,
        description="Duration ranges [[0, 90], [90, 180]]"
    )
    genre: str = Field("Auto", description="Video genre")
    topic_keywords: Optional[List[str]] = Field(
        None,
        description="Keywords to prioritize (ClipBasic only)"
    )
    custom_prompt: Optional[str] = Field(
        None,
        description="Custom prompt (ClipAnything only)"
    )
    layout_aspect_ratio: str = Field("portrait", description="portrait, landscape, or square")
    enable_remove_filler_words: bool = Field(False, description="Remove filler words")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for completion")
    notification_email: Optional[str] = Field(None, description="Email for completion notification")
    range_start_sec: Optional[int] = Field(None, description="Start time in seconds")
    range_end_sec: Optional[int] = Field(None, description="End time in seconds")


class GetProjectClipsRequest(BaseModel):
    """Request model for getting project clips"""
    project_id: str = Field(..., description="Project ID")


class ManageCollectionRequest(BaseModel):
    """Request model for collection management"""
    action: str = Field(..., description="create, get, delete, add_clip, remove_clip, export")
    collection_name: Optional[str] = Field(None, description="Name for new collection")
    collection_id: Optional[str] = Field(None, description="Collection ID")
    content_id: Optional[str] = Field(None, description="Clip content ID (projectId.curationId)")


class CensorClipRequest(BaseModel):
    """Request model for censoring a clip"""
    project_id: str = Field(..., description="Project ID")
    clip_id: str = Field(..., description="Clip ID")
    beep_sound: bool = Field(False, description="Add beep sound")


class GetCensorJobStatusRequest(BaseModel):
    """Request model for getting censor job status"""
    job_id: str = Field(..., description="Job ID")


class UploadAndCreateProjectRequest(BaseModel):
    """Request model for uploading video and creating project"""
    file_path: str = Field(..., description="Local path to video file")
    title: Optional[str] = Field(None, description="Project title")
    curation_model: str = Field("ClipAnything", description="ClipBasic or ClipAnything")
    clip_durations: Optional[List[List[int]]] = Field(None, description="Duration ranges")
    genre: str = Field("Auto", description="Video genre")


class ShareProjectRequest(BaseModel):
    """Request model for sharing a project"""
    project_id: str = Field(..., description="Project ID")
    visibility: str = Field("PUBLIC", description="DEFAULT or PUBLIC")


# ==================== ENDPOINTS ====================

@router.post("/create-project")
async def create_clip_project(request: CreateClipProjectRequest):
    """
    Create a new clip project from a video URL
    
    Supports:
    - YouTube, Vimeo, Google Drive, Zoom, and more
    - ClipBasic (talking-head videos) or ClipAnything (any video type)
    - Custom clip durations, genres, and prompts
    - Filler word removal
    - Webhook and email notifications
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.create_clips_from_video(
            video_url=request.video_url,
            title=request.title,
            curation_model=request.curation_model,
            clip_durations=request.clip_durations,
            genre=request.genre,
            topic_keywords=request.topic_keywords,
            custom_prompt=request.custom_prompt,
            layout_aspect_ratio=request.layout_aspect_ratio,
            enable_remove_filler_words=request.enable_remove_filler_words,
            webhook_url=request.webhook_url,
            notification_email=request.notification_email
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating clip project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}/status")
async def get_project_status(project_id: str):
    """
    Get the status of a clip project
    
    Returns project stage: PENDING, QUEUED, IMPORT, CURATE, REFINE, RENDER, UPLOAD, COMPLETE, STALLED
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        status = await opus_service.get_project_status(project_id)
        return {
            "success": True,
            "project_id": project_id,
            "stage": status.get("stage"),
            "model": status.get("model"),
            "created_at": status.get("createdAt"),
            "updated_at": status.get("updatedAt"),
            "details": status
        }
        
    except Exception as e:
        logger.error(f"Error getting project status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/project/clips")
async def get_project_clips(request: GetProjectClipsRequest):
    """
    Get all clips from a completed project
    
    Returns clips with:
    - Title, description, hashtags
    - Preview and export URLs
    - Duration and metadata
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.get_project_clips(request.project_id)
        
        if not result.get("success") and result.get("stage") != "COMPLETE":
            return result  # Return with stage info
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting project clips: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/project/share")
async def share_project(request: ShareProjectRequest):
    """
    Share a project by making it public
    
    PUBLIC visibility allows anyone to view, edit, and export the project
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_service.share_project(
            request.project_id,
            request.visibility
        )
        
        return {
            "success": True,
            "project_id": request.project_id,
            "visibility": request.visibility,
            "message": "Project shared successfully",
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Error sharing project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collections/manage")
async def manage_collection(request: ManageCollectionRequest):
    """
    Manage collections
    
    Actions:
    - create: Create a new collection
    - get: Get all collections or collections containing a clip
    - delete: Delete a collection (clips won't be deleted)
    - add_clip: Add a clip to a collection
    - remove_clip: Remove a clip from a collection
    - export: Export all clips from a collection with download URLs
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.manage_collection(
            action=request.action,
            collection_name=request.collection_name,
            collection_id=request.collection_id,
            content_id=request.content_id
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error managing collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clip/censor")
async def censor_clip(request: CensorClipRequest):
    """
    Create a censor job to censor words in a clip
    
    Optionally add beep sound to censored words
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.censor_clip(
            project_id=request.project_id,
            clip_id=request.clip_id,
            beep_sound=request.beep_sound
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating censor job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/censor-job/{job_id}/status")
async def get_censor_job_status(job_id: str):
    """
    Get the status of a censor job
    
    Status: CONCLUDED, FAILED, PROCESSING, QUEUED, UNKNOWN
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.get_censor_job_status(job_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting censor job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brand-templates")
async def get_brand_templates():
    """
    Get all brand templates for your account
    
    Returns templates with:
    - Template ID and name
    - Render preferences (layout, captions, fonts, etc.)
    - Default template indicator
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.get_brand_templates()
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting brand templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-and-create")
async def upload_and_create_project(request: UploadAndCreateProjectRequest):
    """
    Upload a local video file and create a clip project
    
    Supports video files up to 10GB
    """
    try:
        if not OPUS_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpusClip API key not configured"
            )
        
        result = await opus_use_case.upload_and_create_project(
            file_path=request.file_path,
            title=request.title,
            curation_model=request.curation_model,
            clip_durations=request.clip_durations,
            genre=request.genre
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading and creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if OpusClip API is configured"""
    return {
        "service": "OpusClip",
        "configured": bool(OPUS_API_KEY),
        "status": "ready" if OPUS_API_KEY else "not_configured"
    }
