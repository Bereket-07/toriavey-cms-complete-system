# src/domain/schemas/publish_schemas.py
 
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from src.domain.models.content_model import ContentPlatform
 
 
class PublishItem(BaseModel):
    """One platform's content to publish."""
    platform: ContentPlatform
    caption: str = Field(..., description="The post caption/body text.")
    hashtags: List[str] = Field(default_factory=list, description="Hashtags (without '#').")
    image_url: Optional[str] = Field(default=None, description="Image URL to attach, if any.")
    link: Optional[str] = Field(default=None, description="Optional destination link appended to text.")
 
 
class PublishRequest(BaseModel):
    """Request to publish generated content to one or more platforms."""
    entity_id: str = Field(..., description="Composio entity/user id whose connected accounts are used.")
    items: List[PublishItem] = Field(..., min_length=1, description="Per-platform content to publish.")
 
 
class PublishResult(BaseModel):
    """Result of publishing to a single platform."""
    platform: ContentPlatform
    successful: bool
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    auth_required: bool = False
 
 
class PublishResponse(BaseModel):
    """Aggregate result across all requested platforms."""
    success: bool = Field(..., description="True if at least one platform published successfully.")
    total: int
    succeeded: int
    failed: int
    results: List[PublishResult]
 