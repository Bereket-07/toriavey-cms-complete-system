"""
WPRM Content Status Repository
Manages content generation and posting status for WPRM recipes
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
import json

from src.infrastructure.repository.db_config import get_db
from src.domain.models.wprm_content_status_model import WPRMContentStatus, ContentStatus

logger = logging.getLogger(__name__)


class WPRMContentStatusRepository:
    """Repository for WPRM content status tracking"""
    
    def __init__(self):
        self.db = get_db()
    
    def get_status_by_recipe_id(self, recipe_id: int) -> Optional[WPRMContentStatus]:
        """Get content status for a recipe"""
        try:
            with self.db as db:
                return db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.recipe_id == recipe_id
                ).first()
        except Exception as e:
            logger.error(f"Error getting status for recipe {recipe_id}: {e}")
            raise
    
    def create_or_update_status(self, recipe_id: int, **kwargs) -> WPRMContentStatus:
        """Create or update content status for a recipe"""
        try:
            with self.db as db:
                status = db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.recipe_id == recipe_id
                ).first()
                
                if status:
                    # Update existing
                    for key, value in kwargs.items():
                        setattr(status, key, value)
                    status.updated_at = datetime.utcnow()
                else:
                    # Create new
                    status = WPRMContentStatus(recipe_id=recipe_id, **kwargs)
                    db.add(status)
                
                db.commit()
                db.refresh(status)
                return status
        except Exception as e:
            logger.error(f"Error creating/updating status for recipe {recipe_id}: {e}")
            raise
    
    def mark_as_generated(self, recipe_id: int, generated_content: Dict[str, Any]) -> WPRMContentStatus:
        """Mark recipe content as generated"""
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status=ContentStatus.GENERATED,
            content_generated=True,
            generation_date=datetime.utcnow(),
            generated_content=json.dumps(generated_content),
            posted=False
        )
    
    def mark_as_pending(self, recipe_id: int) -> WPRMContentStatus:
        """Mark recipe content as pending (approved and waiting to be posted)"""
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status='pending',
            content_generated=True,
            posted=False
        )
    
    def mark_as_posted(self, recipe_id: int, platforms: List[str]) -> WPRMContentStatus:
        """Mark recipe content as posted"""
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status='posted',
            posted=True,
            post_date=datetime.utcnow(),
            platforms_posted=",".join(platforms)
        )
    
    def mark_as_declined(self, recipe_id: int, reason: str = None) -> WPRMContentStatus:
        """Mark recipe content as declined (treat as not generated)"""
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status=ContentStatus.DECLINED,
            content_generated=False,
            posted=False,
            notes=reason
        )
    
    def mark_as_failed(self, recipe_id: int, error: str) -> WPRMContentStatus:
        """Mark recipe content generation as failed"""
        status = self.get_status_by_recipe_id(recipe_id)
        retry_count = status.retry_count + 1 if status else 1
        
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status=ContentStatus.FAILED,
            last_error=error,
            retry_count=retry_count
        )
    
    def reset_to_not_generated(self, recipe_id: int) -> WPRMContentStatus:
        """Reset recipe to not generated status"""
        return self.create_or_update_status(
            recipe_id=recipe_id,
            status=ContentStatus.NOT_GENERATED,
            content_generated=False,
            posted=False,
            generation_date=None,
            post_date=None,
            generated_content=None,
            platforms_posted=None
        )
    
    def get_recipes_by_status(self, status: ContentStatus, limit: int = 50, offset: int = 0) -> List[WPRMContentStatus]:
        """Get recipes by status"""
        try:
            with self.db as db:
                return db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == status.value
                ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting recipes by status {status}: {e}")
            raise
    
    def get_not_generated_recipes(self, limit: int = 50, offset: int = 0) -> List[WPRMContentStatus]:
        """Get recipes that need content generation (not_generated or declined)"""
        try:
            with self.db as db:
                return db.query(WPRMContentStatus).filter(
                    or_(
                        WPRMContentStatus.status == 'not_generated',
                        WPRMContentStatus.status == 'declined'
                    )
                ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting not generated recipes: {e}")
            raise
    
    def get_generated_not_posted_recipes(self, limit: int = 50, offset: int = 0) -> List[WPRMContentStatus]:
        """Get recipes with generated content that haven't been posted (generated status only)"""
        try:
            with self.db as db:
                return db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'generated',
                    WPRMContentStatus.content_generated == True,
                    WPRMContentStatus.posted == False
                ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting generated not posted recipes: {e}")
            raise
    
    def get_pending_recipes(self, limit: int = 50, offset: int = 0) -> List[WPRMContentStatus]:
        """Get recipes with pending status (approved and waiting to be posted)"""
        try:
            with self.db as db:
                return db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'pending',
                    WPRMContentStatus.posted == False
                ).offset(offset).limit(limit).all()
        except Exception as e:
            logger.error(f"Error getting pending recipes: {e}")
            raise
    
    def get_status_summary(self) -> Dict[str, Any]:
        """Get summary of content status"""
        try:
            with self.db as db:
                total = db.query(WPRMContentStatus).count()
                
                not_generated = db.query(WPRMContentStatus).filter(
                    or_(
                        WPRMContentStatus.status == 'not_generated',
                        WPRMContentStatus.status == 'declined'
                    )
                ).count()
                
                generated = db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'generated'
                ).count()
                
                pending = db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'pending'
                ).count()
                
                posted = db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'posted'
                ).count()
                
                failed = db.query(WPRMContentStatus).filter(
                    WPRMContentStatus.status == 'failed'
                ).count()
                
                return {
                    "total_recipes": total,
                    "not_generated": not_generated,
                    "generated": generated,
                    "pending": pending,
                    "posted": posted,
                    "failed": failed,
                    "completion_percentage": round((posted / total * 100) if total > 0 else 0, 2),
                    "generation_percentage": round(((generated + pending + posted) / total * 100) if total > 0 else 0, 2)
                }
        except Exception as e:
            logger.error(f"Error getting status summary: {e}")
            raise
    
    def get_generated_content(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """Get generated content for a recipe"""
        try:
            status = self.get_status_by_recipe_id(recipe_id)
            if status and status.generated_content:
                return json.loads(status.generated_content)
            return None
        except Exception as e:
            logger.error(f"Error getting generated content for recipe {recipe_id}: {e}")
            raise
