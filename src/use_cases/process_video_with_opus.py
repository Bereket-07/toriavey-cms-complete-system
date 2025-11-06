"""
Use Case: Process Video with OpusClip
Handles video processing using OpusClip API
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from src.infrastructure.video_processing.opus_clip_service import OpusClipService

logger = logging.getLogger(__name__)


class ProcessVideoWithOpusUseCase:
    """Use case for processing videos with OpusClip"""
    
    def __init__(self, opus_service: OpusClipService):
        """
        Initialize use case
        
        Args:
            opus_service: OpusClip service instance
        """
        self.opus_service = opus_service
    
    async def create_clips_from_video(
        self,
        video_url: str,
        title: Optional[str] = None,
        curation_model: str = "ClipAnything",
        clip_durations: List[List[int]] = None,
        genre: str = "Auto",
        topic_keywords: List[str] = None,
        custom_prompt: Optional[str] = None,
        layout_aspect_ratio: str = "portrait",
        enable_remove_filler_words: bool = False,
        webhook_url: Optional[str] = None,
        notification_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create clips from a video URL using OpusClip
        
        Args:
            video_url: URL of the video
            title: Custom title for the project
            curation_model: "ClipBasic" or "ClipAnything"
            clip_durations: Duration ranges for clips
            genre: Video genre
            topic_keywords: Keywords to prioritize (ClipBasic only)
            custom_prompt: Custom prompt (ClipAnything only)
            layout_aspect_ratio: portrait, landscape, or square
            enable_remove_filler_words: Remove filler words
            webhook_url: Webhook for completion notification
            notification_email: Email for completion notification
            
        Returns:
            Project information with project ID
        """
        try:
            logger.info(f"Creating OpusClip project for: {video_url}")
            
            # Create clip project
            project = await self.opus_service.create_clip_project(
                video_url=video_url,
                title=title,
                curation_model=curation_model,
                clip_durations=clip_durations,
                genre=genre,
                topic_keywords=topic_keywords,
                custom_prompt=custom_prompt,
                layout_aspect_ratio=layout_aspect_ratio,
                enable_remove_filler_words=enable_remove_filler_words,
                webhook_url=webhook_url,
                notification_email=notification_email
            )
            
            project_id = project.get("projectId")
            stage = project.get("stage")
            
            logger.info(f"OpusClip project created: {project_id}, Stage: {stage}")
            
            return {
                "success": True,
                "project_id": project_id,
                "stage": stage,
                "message": f"Clip project created successfully. Status: {stage}",
                "project_details": project
            }
            
        except Exception as e:
            logger.error(f"Failed to create clips: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create clip project"
            }
    
    async def get_project_clips(
        self,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Get all clips from a project
        
        Args:
            project_id: Project ID
            
        Returns:
            List of clips with metadata and download URLs
        """
        try:
            logger.info(f"Fetching clips for project: {project_id}")
            
            # Get project status first
            project_status = await self.opus_service.get_project_status(project_id)
            stage = project_status.get("stage")
            
            if stage != "COMPLETE":
                return {
                    "success": False,
                    "project_id": project_id,
                    "stage": stage,
                    "message": f"Project is not complete yet. Current stage: {stage}",
                    "clips": []
                }
            
            # Get clips
            clips = await self.opus_service.get_clips(project_id=project_id)
            
            # Extract useful information
            processed_clips = []
            for clip in clips:
                processed_clips.append({
                    "clip_id": clip.get("id"),
                    "project_id": clip.get("projectId"),
                    "curation_id": clip.get("curationId"),
                    "title": clip.get("title"),
                    "description": clip.get("description"),
                    "hashtags": clip.get("hashtags"),
                    "duration_ms": clip.get("durationMs"),
                    "preview_url": clip.get("uriForPreview"),
                    "export_url": clip.get("uriForExport"),
                    "keywords": clip.get("keywords"),
                    "created_at": clip.get("createdAt")
                })
            
            logger.info(f"Found {len(processed_clips)} clips for project {project_id}")
            
            return {
                "success": True,
                "project_id": project_id,
                "stage": stage,
                "total_clips": len(processed_clips),
                "clips": processed_clips
            }
            
        except Exception as e:
            logger.error(f"Failed to get project clips: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve clips"
            }
    
    async def manage_collection(
        self,
        action: str,
        collection_name: Optional[str] = None,
        collection_id: Optional[str] = None,
        content_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Manage collections (create, get, delete, add/remove clips)
        
        Args:
            action: "create", "get", "delete", "add_clip", "remove_clip", "export"
            collection_name: Name for new collection
            collection_id: Collection ID
            content_id: Clip content ID (projectId.curationId)
            
        Returns:
            Result of the action
        """
        try:
            if action == "create":
                if not collection_name:
                    raise ValueError("collection_name required for create action")
                
                result = await self.opus_service.create_collection(collection_name)
                return {
                    "success": True,
                    "action": "create",
                    "collection": result.get("data"),
                    "message": f"Collection '{collection_name}' created successfully"
                }
            
            elif action == "get":
                result = await self.opus_service.get_collections(content_id=content_id)
                return {
                    "success": True,
                    "action": "get",
                    "collections": result.get("data", {}).get("list", []),
                    "total": result.get("data", {}).get("total", 0)
                }
            
            elif action == "delete":
                if not collection_id:
                    raise ValueError("collection_id required for delete action")
                
                result = await self.opus_service.delete_collection(collection_id)
                return {
                    "success": True,
                    "action": "delete",
                    "collection_id": result.get("data"),
                    "message": "Collection deleted successfully"
                }
            
            elif action == "add_clip":
                if not collection_id or not content_id:
                    raise ValueError("collection_id and content_id required for add_clip action")
                
                result = await self.opus_service.add_clip_to_collection(
                    collection_id, content_id
                )
                return {
                    "success": True,
                    "action": "add_clip",
                    "result": result.get("data"),
                    "message": "Clip added to collection successfully"
                }
            
            elif action == "remove_clip":
                if not collection_id or not content_id:
                    raise ValueError("collection_id and content_id required for remove_clip action")
                
                result = await self.opus_service.remove_clip_from_collection(
                    collection_id, content_id
                )
                return {
                    "success": True,
                    "action": "remove_clip",
                    "result": result.get("data"),
                    "message": "Clip removed from collection successfully"
                }
            
            elif action == "export":
                if not collection_id:
                    raise ValueError("collection_id required for export action")
                
                result = await self.opus_service.export_collection(collection_id)
                content_list = result.get("data", {}).get("contentList", [])
                
                return {
                    "success": True,
                    "action": "export",
                    "total_clips": len(content_list),
                    "clips": content_list,
                    "message": f"Exported {len(content_list)} clips from collection"
                }
            
            else:
                raise ValueError(f"Unknown action: {action}")
                
        except Exception as e:
            logger.error(f"Collection management failed: {str(e)}")
            return {
                "success": False,
                "action": action,
                "error": str(e),
                "message": f"Failed to {action} collection"
            }
    
    async def censor_clip(
        self,
        project_id: str,
        clip_id: str,
        beep_sound: bool = False
    ) -> Dict[str, Any]:
        """
        Create a censor job for a clip
        
        Args:
            project_id: Project ID
            clip_id: Clip ID
            beep_sound: Whether to add beep sound
            
        Returns:
            Job information
        """
        try:
            logger.info(f"Creating censor job for clip: {clip_id}")
            
            result = await self.opus_service.create_censor_job(
                project_id=project_id,
                clip_id=clip_id,
                beep_sound=beep_sound
            )
            
            job_id = result.get("jobId")
            
            return {
                "success": True,
                "job_id": job_id,
                "message": result.get("message", "Censor job created successfully")
            }
            
        except Exception as e:
            logger.error(f"Failed to create censor job: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create censor job"
            }
    
    async def get_censor_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get status of a censor job
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status
        """
        try:
            result = await self.opus_service.get_censor_job_status(job_id)
            
            return {
                "success": True,
                "job_id": job_id,
                "status": result.get("status"),
                "error": result.get("error")
            }
            
        except Exception as e:
            logger.error(f"Failed to get censor job status: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to get job status"
            }
    
    async def get_brand_templates(self) -> Dict[str, Any]:
        """
        Get all brand templates
        
        Returns:
            List of brand templates
        """
        try:
            templates = await self.opus_service.get_brand_templates()
            
            return {
                "success": True,
                "total_templates": len(templates),
                "templates": templates
            }
            
        except Exception as e:
            logger.error(f"Failed to get brand templates: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve brand templates"
            }
    
    async def upload_and_create_project(
        self,
        file_path: str,
        title: Optional[str] = None,
        curation_model: str = "ClipAnything",
        clip_durations: List[List[int]] = None,
        genre: str = "Auto"
    ) -> Dict[str, Any]:
        """
        Upload a local video file and create a clip project
        
        Args:
            file_path: Local path to video file
            title: Project title
            curation_model: ClipBasic or ClipAnything
            clip_durations: Duration ranges
            genre: Video genre
            
        Returns:
            Project information
        """
        try:
            logger.info(f"Uploading video file: {file_path}")
            
            # Step 1: Generate upload link
            upload_info = await self.opus_service.generate_upload_link()
            upload_url = upload_info.get("url")
            upload_id = upload_info.get("uploadId")
            
            # Step 2: Upload file
            await self.opus_service.upload_video_file(file_path, upload_url)
            
            # Step 3: Create project with uploaded video
            project = await self.opus_service.create_clip_project(
                video_url=upload_id,  # Use upload ID as video URL
                title=title,
                curation_model=curation_model,
                clip_durations=clip_durations,
                genre=genre
            )
            
            return {
                "success": True,
                "project_id": project.get("projectId"),
                "stage": project.get("stage"),
                "message": "Video uploaded and project created successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to upload and create project: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to upload video and create project"
            }
