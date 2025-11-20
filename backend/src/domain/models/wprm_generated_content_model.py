# src/domain/models/wprm_generated_content_model.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from src.infrastructure.repository.db_config import Base


class ContentPlatform(str, Enum):
    """Social media platforms"""
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    PINTEREST = "pinterest"
    YOUTUBE_SHORTS = "youtube_shorts"
    THREADS = "threads"


class ContentStatusType(str, Enum):
    """Content status types"""
    GENERATED = "generated"      # Content generated, awaiting review
    PENDING = "pending"          # Approved, ready to post
    POSTED = "posted"            # Successfully posted
    DECLINED = "declined"        # Declined/rejected
    FAILED = "failed"            # Generation or posting failed


class WPRMGeneratedContent(Base):
    """
    Stores generated content for WPRM recipes per platform.
    Each record represents content for ONE platform for ONE recipe.
    
    Relational Structure:
    - recipe_id → wp_tori_posts.ID (WPRM recipe)
    - Multiple content records per recipe (one per platform)
    - Tracks status per platform independently
    """
    __tablename__ = "wprm_generated_content"
    
    # Primary Key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign Key to Recipe
    recipe_id = Column(Integer, nullable=False, index=True)  # Links to wp_tori_posts.ID
    
    # Platform
    platform = Column(String(50), nullable=False, index=True)  # instagram, tiktok, etc.
    
    # Generated Content (JSON structure)
    content = Column(JSON, nullable=True)  # Platform-specific content structure
    
    # Status Tracking
    status = Column(String(50), nullable=False, default='generated', index=True)  # generated, pending, posted, declined, failed
    
    # Metadata
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    posted_at = Column(DateTime, nullable=True)
    
    # Generation Info
    parsed = Column(Boolean, default=False)  # Whether LLM response was parsed successfully
    fallback_used = Column(Boolean, default=False)  # Whether fallback content was used
    
    # Posting Info
    post_id = Column(String(255), nullable=True)  # Social media post ID after posting
    post_url = Column(String(500), nullable=True)  # URL to the posted content
    
    # Error Tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Indexes for common queries
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    )
    
    def __repr__(self):
        return f"<WPRMGeneratedContent(id={self.id}, recipe_id={self.recipe_id}, platform={self.platform}, status={self.status})>"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "recipe_id": self.recipe_id,
            "platform": self.platform,
            "content": self.content,
            "status": self.status,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
            "parsed": self.parsed,
            "fallback_used": self.fallback_used,
            "post_id": self.post_id,
            "post_url": self.post_url,
            "error_message": self.error_message,
            "retry_count": self.retry_count
        }
