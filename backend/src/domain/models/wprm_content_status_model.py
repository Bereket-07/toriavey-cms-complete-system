"""
WPRM Recipe Content Generation Status Model
Tracks content generation and posting status for each recipe
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Boolean, Text
from datetime import datetime
from enum import Enum
from src.infrastructure.repository.db_config import Base


class ContentStatus(str, Enum):
    """Content generation status"""
    NOT_GENERATED = "not_generated"  # No content generated yet
    GENERATED = "generated"  # Content generated, waiting for approval
    PENDING = "pending"  # Approved and waiting to be posted
    POSTED = "posted"  # Successfully posted to social media
    DECLINED = "declined"  # Content was declined/rejected (treat as not generated)
    FAILED = "failed"  # Generation or posting failed


class WPRMContentStatus(Base):
    """Track content generation and posting status for WPRM recipes"""
    __tablename__ = "wprm_content_status"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    recipe_id = Column(BigInteger, nullable=False, unique=True, index=True)  # WPRM recipe post ID
    
    # Content generation status (stored as string in DB)
    status = Column(String(50), default="not_generated", nullable=False)
    
    # Generation tracking
    content_generated = Column(Boolean, default=False, nullable=False)
    generation_date = Column(DateTime, nullable=True)
    generated_content = Column(Text, nullable=True)  # Store generated content JSON
    
    # Posting tracking
    posted = Column(Boolean, default=False, nullable=False)
    post_date = Column(DateTime, nullable=True)
    platforms_posted = Column(String(500), nullable=True)  # Comma-separated list of platforms
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    retry_count = Column(BigInteger, default=0, nullable=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<WPRMContentStatus recipe_id={self.recipe_id} status={self.status}>"
