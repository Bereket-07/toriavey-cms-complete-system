# src/infrastructure/repository/wprm_generated_content_repo.py

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from src.domain.models.wprm_generated_content_model import (
    WPRMGeneratedContent,
    ContentPlatform,
    ContentStatusType
)
from src.infrastructure.repository.db_config import get_db

logger = logging.getLogger(__name__)


class WPRMGeneratedContentRepository:
    """Repository for WPRM generated content (relational structure)"""
    
    def __init__(self):
        self.db = get_db()
    
    def create_content(
        self,
        recipe_id: int,
        platform: str,
        content: Dict[str, Any],
        status: str = 'generated',
        parsed: bool = False,
        fallback_used: bool = False
    ) -> WPRMGeneratedContent:
        """Create or update generated content for a recipe+platform"""
        try:
            with self.db as db:
                # Check if content already exists
                existing = db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id,
                    WPRMGeneratedContent.platform == platform
                ).first()
                
                if existing:
                    # Update existing
                    existing.content = content
                    existing.status = status
                    existing.parsed = parsed
                    existing.fallback_used = fallback_used
                    existing.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(existing)
                    logger.info(f"Updated content for recipe {recipe_id}, platform {platform}")
                    return existing
                else:
                    # Create new
                    new_content = WPRMGeneratedContent(
                        recipe_id=recipe_id,
                        platform=platform,
                        content=content,
                        status=status,
                        parsed=parsed,
                        fallback_used=fallback_used
                    )
                    db.add(new_content)
                    db.commit()
                    db.refresh(new_content)
                    logger.info(f"Created content for recipe {recipe_id}, platform {platform}")
                    return new_content
                    
        except Exception as e:
            logger.error(f"Error creating content: {e}")
            raise
    
    def get_content_by_recipe(self, recipe_id: int) -> List[WPRMGeneratedContent]:
        """Get all content for a recipe (all platforms)"""
        try:
            with self.db as db:
                return db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id
                ).all()
        except Exception as e:
            logger.error(f"Error getting content for recipe {recipe_id}: {e}")
            raise
    
    def get_content_by_recipe_platform(self, recipe_id: int, platform: str) -> Optional[WPRMGeneratedContent]:
        """Get content for a specific recipe and platform"""
        try:
            with self.db as db:
                return db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id,
                    WPRMGeneratedContent.platform == platform
                ).first()
        except Exception as e:
            logger.error(f"Error getting content for recipe {recipe_id}, platform {platform}: {e}")
            raise
    
    def get_content_by_status(self, status: str, limit: int = 50, offset: int = 0) -> List[WPRMGeneratedContent]:
        """Get all content with a specific status"""
        try:
            with self.db as db:
                return db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.status == status
                ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting content by status {status}: {e}")
            raise
    
    def get_recipes_by_status(self, status: str, limit: int = 50, offset: int = 0) -> List[int]:
        """Get unique recipe IDs with content in a specific status"""
        try:
            with self.db as db:
                result = db.query(WPRMGeneratedContent.recipe_id).filter(
                    WPRMGeneratedContent.status == status
                ).distinct().offset(offset).limit(limit).all()
                return [r[0] for r in result]
        except Exception as e:
            logger.error(f"Error getting recipes by status {status}: {e}")
            raise
    
    def update_status(self, recipe_id: int, platform: str, status: str) -> WPRMGeneratedContent:
        """Update status for a specific recipe+platform"""
        try:
            with self.db as db:
                content = db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id,
                    WPRMGeneratedContent.platform == platform
                ).first()
                
                if content:
                    content.status = status
                    content.updated_at = datetime.utcnow()
                    
                    # Set posted_at if status is posted
                    if status == 'posted' and not content.posted_at:
                        content.posted_at = datetime.utcnow()
                    
                    db.commit()
                    db.refresh(content)
                    logger.info(f"Updated status to {status} for recipe {recipe_id}, platform {platform}")
                    return content
                else:
                    raise ValueError(f"Content not found for recipe {recipe_id}, platform {platform}")
                    
        except Exception as e:
            logger.error(f"Error updating status: {e}")
            raise
    
    def update_all_platforms_status(self, recipe_id: int, status: str) -> int:
        """Update status for all platforms of a recipe"""
        try:
            with self.db as db:
                contents = db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id
                ).all()
                
                count = 0
                for content in contents:
                    content.status = status
                    content.updated_at = datetime.utcnow()
                    
                    if status == 'posted' and not content.posted_at:
                        content.posted_at = datetime.utcnow()
                    
                    count += 1
                
                db.commit()
                logger.info(f"Updated status to {status} for {count} platforms of recipe {recipe_id}")
                return count
                
        except Exception as e:
            logger.error(f"Error updating all platforms status: {e}")
            raise
    
    def mark_as_posted(self, recipe_id: int, platform: str, post_id: str = None, post_url: str = None) -> WPRMGeneratedContent:
        """Mark content as posted with optional post details"""
        try:
            with self.db as db:
                content = db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id,
                    WPRMGeneratedContent.platform == platform
                ).first()
                
                if content:
                    content.status = 'posted'
                    content.posted_at = datetime.utcnow()
                    content.updated_at = datetime.utcnow()
                    
                    if post_id:
                        content.post_id = post_id
                    if post_url:
                        content.post_url = post_url
                    
                    db.commit()
                    db.refresh(content)
                    logger.info(f"Marked as posted: recipe {recipe_id}, platform {platform}")
                    return content
                else:
                    raise ValueError(f"Content not found for recipe {recipe_id}, platform {platform}")
                    
        except Exception as e:
            logger.error(f"Error marking as posted: {e}")
            raise
    
    def delete_content(self, recipe_id: int, platform: str = None) -> int:
        """Delete content for a recipe (all platforms or specific platform)"""
        try:
            with self.db as db:
                query = db.query(WPRMGeneratedContent).filter(
                    WPRMGeneratedContent.recipe_id == recipe_id
                )
                
                if platform:
                    query = query.filter(WPRMGeneratedContent.platform == platform)
                
                count = query.delete()
                db.commit()
                logger.info(f"Deleted {count} content records for recipe {recipe_id}")
                return count
                
        except Exception as e:
            logger.error(f"Error deleting content: {e}")
            raise
    
    def get_status_summary(self) -> Dict[str, Any]:
        """Get summary of content status across all recipes"""
        try:
            with self.db as db:
                # Count unique recipes by status
                from sqlalchemy import func, distinct
                
                total_recipes = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).scalar()
                
                generated = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).filter(
                    WPRMGeneratedContent.status == 'generated'
                ).scalar()
                
                pending = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).filter(
                    WPRMGeneratedContent.status == 'pending'
                ).scalar()
                
                posted = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).filter(
                    WPRMGeneratedContent.status == 'posted'
                ).scalar()
                
                declined = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).filter(
                    WPRMGeneratedContent.status == 'declined'
                ).scalar()
                
                failed = db.query(func.count(distinct(WPRMGeneratedContent.recipe_id))).filter(
                    WPRMGeneratedContent.status == 'failed'
                ).scalar()
                
                # Count total content records (all platforms)
                total_content_records = db.query(func.count(WPRMGeneratedContent.id)).scalar()
                
                return {
                    "total_recipes_with_content": total_recipes or 0,
                    "total_content_records": total_content_records or 0,
                    "generated": generated or 0,
                    "pending": pending or 0,
                    "posted": posted or 0,
                    "declined": declined or 0,
                    "failed": failed or 0
                }
                
        except Exception as e:
            logger.error(f"Error getting status summary: {e}")
            raise
