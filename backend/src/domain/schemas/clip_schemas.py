# src/domain/schemas/clip_schemas.py

from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VideoSourceType(str, Enum):
    """Video source types"""
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    VIMEO = "vimeo"
    FACEBOOK = "facebook"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TWITCH = "twitch"
    LOOM = "loom"
    GOOGLE_DRIVE = "google_drive"
    STREAMYARD = "streamyard"
    RUMBLE = "rumble"
    REMOTE_FILE = "remote_file"


class TargetPlatform(str, Enum):
    """Target social media platforms"""
    YOUTUBE_SHORTS = "youtube_shorts"
    TIKTOK = "tiktok"
    INSTAGRAM_REELS = "instagram_reels"
    FACEBOOK_REELS = "facebook_reels"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"


class ClipStatusEnum(str, Enum):
    """Clip approval status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    POSTED = "posted"


# ============= REQUEST SCHEMAS =============

class CreateClipsRequest(BaseModel):
    """Request to create clips from a video URL"""
    video_url: str = Field(..., description="URL of the source video")
    source_type: VideoSourceType = Field(..., description="Type of video source")
    target_platforms: List[TargetPlatform] = Field(..., description="Platforms to generate clips for")
    language: str = Field(default="en", description="Spoken language in the video")
    max_clips_per_platform: int = Field(default=5, ge=1, le=20, description="Max clips per platform")
    keywords: Optional[str] = Field(None, description="Keywords to focus on")
    project_name: Optional[str] = Field(None, description="Custom project name")
    file_extension: Optional[str] = Field(None, description="File extension (required for remote files)")


class ApproveClipRequest(BaseModel):
    """Request to approve a clip"""
    clip_id: int = Field(..., description="ID of the clip to approve")
    approved_by: Optional[int] = Field(None, description="User ID who approved")


class RejectClipRequest(BaseModel):
    """Request to reject a clip"""
    clip_id: int = Field(..., description="ID of the clip to reject")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection")
    rejected_by: Optional[int] = Field(None, description="User ID who rejected")


class PostClipRequest(BaseModel):
    """Request to post a clip to social media"""
    clip_id: int = Field(..., description="ID of the clip to post")
    platforms: List[TargetPlatform] = Field(..., description="Platforms to post to")
    custom_caption: Optional[str] = Field(None, description="Custom caption override")
    custom_hashtags: Optional[str] = Field(None, description="Custom hashtags override")
    schedule_for: Optional[datetime] = Field(None, description="Schedule post for later")


# ============= RESPONSE SCHEMAS =============

class ClipResponse(BaseModel):
    """Response for a single clip"""
    id: int
    vizard_project_id: str
    clip_url: Optional[str]
    thumbnail_url: Optional[str]
    source_video_url: str
    source_platform: str
    title: Optional[str]
    description: Optional[str]
    duration: Optional[int]
    keywords: Optional[str]
    target_platforms: List[str]
    status: ClipStatusEnum
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    
    class Config:
        from_attributes = True


class SocialPostResponse(BaseModel):
    """Response for a social media post"""
    id: int
    clip_id: int
    platform: str
    caption: Optional[str]
    hashtags: Optional[str]
    is_posted: bool
    post_url: Optional[str]
    platform_post_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    posted_at: Optional[datetime]
    scheduled_for: Optional[datetime]
    
    class Config:
        from_attributes = True


class ClipWithPostsResponse(BaseModel):
    """Response for a clip with its social posts"""
    clip: ClipResponse
    social_posts: List[SocialPostResponse]


class CreateClipsResponse(BaseModel):
    """Response after creating clips"""
    success: bool
    message: str
    vizard_project_id: Optional[str]
    total_clips_requested: int
    platforms: List[str]


class PendingClipsResponse(BaseModel):
    """Response for pending clips dashboard"""
    total_pending: int
    clips: List[ClipWithPostsResponse]


class PostClipResponse(BaseModel):
    """Response after posting clips"""
    success: bool
    message: str
    clip_id: int
    posted_platforms: List[str]
    failed_platforms: List[dict]
