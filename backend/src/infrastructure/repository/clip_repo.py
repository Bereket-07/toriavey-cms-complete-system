from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import logging
from sqlalchemy.orm import Session

from src.infrastructure.repository.db_config import SessionLocal
from src.domain.models.clip_model import VizardProject, VideoClip, ClipStatus

logger = logging.getLogger(__name__)

class ClipRepository:
    """Handles database operations for Vizard projects and clips."""

    def __init__(self):
        pass

    def create_project(self, project_data: Dict[str, Any]) -> VizardProject:
        """Create a new Vizard project record."""
        db = SessionLocal()
        try:
            project = VizardProject(
                project_id=project_data["project_id"],
                project_name=project_data.get("project_name", "Untitled Project"),
                source_video_url=project_data["source_video_url"],
                source_platform=project_data.get("source_platform", "unknown"),
                target_platform=project_data.get("target_platform", "unknown"),
                language=project_data.get("language", "en"),
                max_clips=project_data.get("max_clips", 5),
                keywords=project_data.get("keywords"),
                created_at=datetime.utcnow()
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            return project
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create project: {e}")
            raise
        finally:
            db.close()

    def get_project_by_vizard_id(self, vizard_project_id: str) -> Optional[VizardProject]:
        """Get a project by its Vizard ID."""
        db = SessionLocal()
        try:
            return db.query(VizardProject).filter(VizardProject.project_id == vizard_project_id).first()
        finally:
            db.close()

    def get_all_projects(self) -> List[Dict[str, Any]]:
        """Get all projects with their clips."""
        db = SessionLocal()
        try:
            projects = db.query(VizardProject).order_by(VizardProject.created_at.desc()).all()
            results = []
            for p in projects:
                # Fetch clips for this project
                clips = db.query(VideoClip).filter(VideoClip.vizard_project_id == p.project_id).all()
                
                # Determine status based on DB record
                status = "completed" if p.is_processed else "processing"
                if p.error_message:
                    status = "failed"
                
                results.append({
                    "id": str(p.id),
                    "projectId": p.project_id,
                    "video_url": p.source_video_url,
                    "platform": p.target_platform,
                    "status": status,
                    "created_at": p.created_at.isoformat(),
                    "message": p.error_message or ("Clips generated successfully" if p.is_processed else "Processing..."),
                    "generated_clips": [
                        {
                            "videoId": str(c.id),
                            "videoUrl": c.clip_url,
                            "coverUrl": c.thumbnail_url,
                            "title": c.title,
                            "videoMsDuration": c.duration * 1000 if c.duration else 0
                        } for c in clips
                    ]
                })
            return results
        finally:
            db.close()

    def get_project_details(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get formatted project details with clips."""
        db = SessionLocal()
        try:
            project = db.query(VizardProject).filter(VizardProject.project_id == project_id).first()
            if not project:
                return None
            
            clips = db.query(VideoClip).filter(VideoClip.vizard_project_id == project_id).all()
            
            status = "completed" if project.is_processed else "processing"
            if project.error_message:
                status = "failed"
            
            return {
                "id": str(project.id),
                "projectId": project.project_id,
                "video_url": project.source_video_url,
                "platform": project.source_platform,
                "status": status,
                "created_at": project.created_at.isoformat(),
                "message": project.error_message or ("Clips generated successfully" if project.is_processed else "Processing..."),
                "generated_clips": [
                    {
                        "videoId": str(c.id),
                        "videoUrl": c.clip_url,
                        "coverUrl": c.thumbnail_url,
                        "title": c.title,
                        "videoMsDuration": c.duration * 1000 if c.duration else 0
                    } for c in clips
                ]
            }
        finally:
            db.close()

    def update_project_status(self, project_id: str, is_processed: bool, error_message: Optional[str] = None):
        """Update project status."""
        db = SessionLocal()
        try:
            project = db.query(VizardProject).filter(VizardProject.project_id == project_id).first()
            if project:
                project.is_processed = is_processed
                if is_processed:
                    project.processed_at = datetime.utcnow()
                if error_message:
                    project.error_message = error_message
                db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update project status: {e}")
            raise
        finally:
            db.close()

    def add_clips_to_project(self, project_id: str, clips_data: List[Dict[str, Any]]):
        """Add generated clips to a project."""
        db = SessionLocal()
        try:
            project = db.query(VizardProject).filter(VizardProject.project_id == project_id).first()
            if not project:
                logger.error(f"Project {project_id} not found")
                return

            for clip_data in clips_data:
                # Check if clip already exists (by URL to avoid duplicates if re-fetched)
                existing = db.query(VideoClip).filter(VideoClip.clip_url == clip_data.get("videoUrl")).first()
                if existing:
                    continue

                clip = VideoClip(
                    vizard_project_id=project_id,
                    clip_url=clip_data.get("videoUrl"),
                    thumbnail_url=clip_data.get("coverUrl"),
                    source_video_url=project.source_video_url,
                    source_platform=project.source_platform,
                    title=clip_data.get("title"),
                    duration=int(clip_data.get("videoMsDuration", 0) / 1000),
                    status=ClipStatus.PENDING,
                    created_at=datetime.utcnow()
                )
                db.add(clip)
            
            project.clips_generated = len(clips_data)
            project.is_processed = True
            project.processed_at = datetime.utcnow()
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add clips: {e}")
            raise
        finally:
            db.close()
