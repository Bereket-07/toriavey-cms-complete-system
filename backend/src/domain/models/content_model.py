# src/domain/models/content_model.py

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ContentStatus(str, Enum):
    """Status of generated content"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    POSTED = "posted"
    SCHEDULED = "scheduled"


class ContentPlatform(str, Enum):
    """Social media platforms for text/image content"""
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    THREADS = "threads"
    FACEBOOK = "facebook"
    LINKEDIN = "linkedin"
    PINTEREST = "pinterest"


class ContentType(str, Enum):
    """Type of content"""
    RECIPE_POST = "recipe_post"
    BLOG_POST = "blog_post"
    PRODUCT_POST = "product_post"
    CUSTOM = "custom"


class Recipe(SQLModel, table=True):
    """Recipe data scraped from website"""
    __tablename__ = "recipes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Recipe metadata
    title: str = Field(index=True)
    url: str = Field(unique=True)
    description: Optional[str] = None
    cuisine: Optional[str] = None
    category: Optional[str] = None
    
    # Recipe details
    ingredients: str = Field(description="JSON array of ingredients")
    instructions: str = Field(description="JSON array of instructions")
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    total_time: Optional[str] = None
    servings: Optional[str] = None
    
    # Media
    image_url: Optional[str] = None
    additional_images: Optional[str] = Field(default=None, description="JSON array of image URLs")
    
    # SEO & Tags
    tags: Optional[str] = Field(default=None, description="JSON array of tags")
    keywords: Optional[str] = None
    
    # Metadata
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    generated_contents: List["GeneratedContent"] = Relationship(back_populates="recipe")


class GeneratedContent(SQLModel, table=True):
    """AI-generated social media content"""
    __tablename__ = "generated_contents"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Source
    recipe_id: Optional[int] = Field(default=None, foreign_key="recipes.id")
    content_type: ContentType = Field(default=ContentType.RECIPE_POST)
    source_url: Optional[str] = None
    
    # Content
    caption: str = Field(description="Main text content")
    hashtags: Optional[str] = Field(default=None, description="Space-separated hashtags")
    image_url: Optional[str] = None
    image_prompt: Optional[str] = Field(default=None, description="AI image generation prompt if needed")
    
    # Platform targeting
    target_platform: ContentPlatform = Field(index=True)
    platform_specific_data: Optional[str] = Field(default=None, description="JSON for platform-specific fields")
    
    # Status & Review
    status: ContentStatus = Field(default=ContentStatus.PENDING, index=True)
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejected_by: Optional[int] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Editing history
    original_caption: Optional[str] = None
    edit_count: int = Field(default=0)
    last_edited_at: Optional[datetime] = None
    last_edited_by: Optional[int] = None
    
    # LLM metadata
    llm_model: Optional[str] = Field(default=None, description="LLM model used for generation")
    generation_prompt: Optional[str] = Field(default=None, description="Prompt used for generation")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    recipe: Optional[Recipe] = Relationship(back_populates="generated_contents")
    social_posts: List["ContentPost"] = Relationship(back_populates="content")


class ContentPost(SQLModel, table=True):
    """Record of posted content to social media"""
    __tablename__ = "content_posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Content reference
    content_id: int = Field(foreign_key="generated_contents.id")
    
    # Platform details
    platform: ContentPlatform = Field(index=True)
    platform_post_id: Optional[str] = Field(default=None, description="ID from social platform")
    platform_url: Optional[str] = None
    
    # Posting details
    posted_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    posted_by: Optional[int] = None
    scheduled_for: Optional[datetime] = Field(default=None, index=True)
    
    # Performance metrics (can be updated later)
    likes: Optional[int] = Field(default=0)
    comments: Optional[int] = Field(default=0)
    shares: Optional[int] = Field(default=0)
    views: Optional[int] = Field(default=0)
    engagement_rate: Optional[float] = Field(default=0.0)
    
    # Status
    post_status: str = Field(default="posted", description="posted, failed, deleted")
    error_message: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    content: GeneratedContent = Relationship(back_populates="social_posts")


class ContentGenerationBatch(SQLModel, table=True):
    """Track batch content generation jobs"""
    __tablename__ = "content_generation_batches"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Batch details
    batch_name: str
    source_type: str = Field(description="recipe_scrape, manual_url, bulk_import")
    total_items: int = Field(default=0)
    processed_items: int = Field(default=0)
    successful_items: int = Field(default=0)
    failed_items: int = Field(default=0)
    
    # Configuration
    target_platforms: str = Field(description="JSON array of platforms")
    generation_config: Optional[str] = Field(default=None, description="JSON config for generation")
    
    # Status
    status: str = Field(default="processing", description="processing, completed, failed")
    error_message: Optional[str] = None
    
    # Timestamps
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # User
    created_by: Optional[int] = None
