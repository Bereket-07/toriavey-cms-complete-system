# src/domain/schemas/content_schemas.py

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from src.domain.models.content_model import ContentStatus, ContentPlatform, ContentType


# ============= REQUEST SCHEMAS =============

class RecipeDataInput(BaseModel):
    """Recipe data from database"""
    title: str = Field(description="Recipe title")
    description: Optional[str] = Field(default=None, description="Recipe description")
    url: Optional[str] = Field(default=None, description="Original recipe URL")
    image_url: Optional[str] = Field(default=None, description="Recipe image URL")
    ingredients: List[str] = Field(default=[], description="List of ingredients")
    instructions: List[str] = Field(default=[], description="List of instructions")
    prep_time: Optional[str] = Field(default=None, description="Preparation time")
    cook_time: Optional[str] = Field(default=None, description="Cooking time")
    total_time: Optional[str] = Field(default=None, description="Total time")
    servings: Optional[str] = Field(default=None, description="Number of servings")
    cuisine: Optional[str] = Field(default=None, description="Cuisine type")
    category: Optional[str] = Field(default=None, description="Recipe category")
    tags: List[str] = Field(default=[], description="Recipe tags")


class GenerateContentFromRecipeRequest(BaseModel):
    """Request to generate social media content from recipe data (from database)"""
    recipe_id: Optional[int] = Field(default=None, description="Recipe ID from database (if applicable)")
    recipe_data: RecipeDataInput = Field(description="Recipe data from database")
    target_platforms: List[ContentPlatform] = Field(
        description="Platforms to generate content for",
        min_items=1
    )
    tone: Optional[str] = Field(
        default="engaging and friendly",
        description="Tone for the generated content"
    )
    include_emojis: bool = Field(default=True, description="Include emojis in captions")
    max_hashtags: int = Field(default=10, ge=1, le=30, description="Maximum number of hashtags")
    custom_instructions: Optional[str] = Field(
        default=None,
        description="Additional instructions for content generation"
    )


class GenerateContentBatchRequest(BaseModel):
    """Request to generate content from multiple recipes"""
    recipe_ids: List[int] = Field(description="List of recipe IDs from database", min_items=1)
    target_platforms: List[ContentPlatform]
    batch_name: Optional[str] = Field(default=None, description="Name for this batch")
    tone: Optional[str] = Field(default="engaging and friendly")
    include_emojis: bool = Field(default=True)
    max_hashtags: int = Field(default=10, ge=1, le=30)


class SelectAlternativeCaptionRequest(BaseModel):
    """Request to select an alternative caption"""
    platform: ContentPlatform = Field(description="Platform to update")
    caption_index: int = Field(
        description="Index of alternative caption to use (0 = main caption, 1+ = alternative captions)",
        ge=0
    )


class EditContentRequest(BaseModel):
    """Request to edit generated content"""
    content_id: int
    caption: Optional[str] = Field(default=None, description="Updated caption")
    hashtags: Optional[str] = Field(default=None, description="Updated hashtags")
    image_url: Optional[str] = Field(default=None, description="Updated image URL")
    edited_by: Optional[int] = Field(default=None, description="User ID who edited")


class ApproveContentRequest(BaseModel):
    """Request to approve content"""
    content_id: int
    approved_by: Optional[int] = Field(default=None, description="User ID who approved")


class RejectContentRequest(BaseModel):
    """Request to reject content"""
    content_id: int
    rejection_reason: Optional[str] = Field(default=None, description="Reason for rejection")
    rejected_by: Optional[int] = Field(default=None, description="User ID who rejected")


class PostContentRequest(BaseModel):
    """Request to post content to social media"""
    content_id: int
    platforms: Optional[List[ContentPlatform]] = Field(
        default=None,
        description="Platforms to post to (defaults to content's target platform)"
    )
    schedule_for: Optional[datetime] = Field(
        default=None,
        description="Schedule post for future time (ISO format)"
    )
    posted_by: Optional[int] = Field(default=None, description="User ID who posted")


class RegenerateContentRequest(BaseModel):
    """Request to regenerate content with different parameters"""
    content_id: int
    tone: Optional[str] = Field(default=None, description="New tone")
    include_emojis: Optional[bool] = Field(default=None)
    max_hashtags: Optional[int] = Field(default=None, ge=1, le=30)
    custom_instructions: Optional[str] = Field(default=None)


# ============= RESPONSE SCHEMAS =============

class SimpleRecipeResponse(BaseModel):
    """Simplified recipe data response (for generation)"""
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    image_url: Optional[str] = None
    cuisine: Optional[str] = None
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    servings: Optional[str] = None


class SimpleGeneratedContentResponse(BaseModel):
    """Simplified generated content response (for generation)"""
    platform: str
    caption: str
    hashtags: List[str]
    platform_specific: Dict[str, Any]
    image_suggestions: Optional[List[str]] = []
    alternative_captions: Optional[List[str]] = []
    selected_caption_index: int = Field(
        default=0,
        description="Index of currently selected caption (0 = main, 1+ = alternatives)"
    )


class RecipeResponse(BaseModel):
    """Recipe data response (full database model)"""
    id: int
    title: str
    url: str
    description: Optional[str]
    cuisine: Optional[str]
    category: Optional[str]
    ingredients: List[str]
    instructions: List[str]
    prep_time: Optional[str]
    cook_time: Optional[str]
    total_time: Optional[str]
    servings: Optional[str]
    image_url: Optional[str]
    tags: Optional[List[str]]
    scraped_at: datetime


class GeneratedContentResponse(BaseModel):
    """Generated content response"""
    id: int
    recipe_id: Optional[int]
    content_type: ContentType
    caption: str
    hashtags: Optional[str]
    image_url: Optional[str]
    target_platform: ContentPlatform
    status: ContentStatus
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    rejected_by: Optional[int]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    edit_count: int
    last_edited_at: Optional[datetime]
    llm_model: Optional[str]
    created_at: datetime
    updated_at: datetime


class ContentWithRecipeResponse(BaseModel):
    """Content with associated recipe data"""
    content: GeneratedContentResponse
    recipe: Optional[RecipeResponse]
    social_posts: List[Dict[str, Any]] = []


class SimpleGenerateContentResponse(BaseModel):
    """Simplified response after generating content (no database fields)"""
    success: bool
    message: str
    generated_contents: List[SimpleGeneratedContentResponse]
    recipe: Optional[SimpleRecipeResponse]
    total_generated: int


class GenerateContentResponse(BaseModel):
    """Response after generating content (with database fields)"""
    success: bool
    message: str
    generated_contents: List[GeneratedContentResponse]
    recipe: Optional[RecipeResponse]
    total_generated: int


class GenerateBatchResponse(BaseModel):
    """Response after batch generation"""
    success: bool
    message: str
    batch_id: int
    batch_name: str
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    status: str


class PendingContentsResponse(BaseModel):
    """Response with pending contents"""
    total_pending: int
    contents: List[ContentWithRecipeResponse]
    grouped_by_recipe: Optional[Dict[str, List[GeneratedContentResponse]]] = None


class PostContentResponse(BaseModel):
    """Response after posting content"""
    success: bool
    message: str
    content_id: int
    posted_platforms: List[str]
    failed_platforms: List[Dict[str, str]]
    scheduled_for: Optional[datetime]


class EditContentResponse(BaseModel):
    """Response after editing content"""
    success: bool
    message: str
    content: GeneratedContentResponse


class SelectCaptionResponse(BaseModel):
    """Response after selecting alternative caption"""
    success: bool
    message: str
    platform: str
    selected_caption: str
    selected_index: int


class ContentStatsResponse(BaseModel):
    """Statistics for content"""
    total_generated: int
    pending: int
    approved: int
    rejected: int
    posted: int
    by_platform: Dict[str, int]
    by_status: Dict[str, int]
    recent_posts: List[GeneratedContentResponse]


# ============= INTERNAL SCHEMAS =============

class ScrapedRecipeData(BaseModel):
    """Internal schema for scraped recipe data"""
    title: str
    url: str
    description: Optional[str] = None
    cuisine: Optional[str] = None
    category: Optional[str] = None
    ingredients: List[str]
    instructions: List[str]
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    total_time: Optional[str] = None
    servings: Optional[str] = None
    image_url: Optional[str] = None
    additional_images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    keywords: Optional[str] = None


class ContentGenerationContext(BaseModel):
    """Context for LLM content generation"""
    recipe: ScrapedRecipeData
    target_platform: ContentPlatform
    tone: str = "engaging and friendly"
    include_emojis: bool = True
    max_hashtags: int = 10
    custom_instructions: Optional[str] = None
    brand_voice: Optional[str] = None


class GeneratedContentData(BaseModel):
    """LLM-generated content data"""
    caption: str
    hashtags: List[str]
    platform_specific: Optional[Dict[str, Any]] = None
    image_suggestions: Optional[List[str]] = None
    alternative_captions: Optional[List[str]] = None
