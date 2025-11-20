"""
OpusClip API Service
Handles all interactions with OpusClip API for video clipping and processing
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class OpusClipService:
    """Service for interacting with OpusClip API"""
    
    def __init__(self, api_key: str):
        """
        Initialize OpusClip service
        
        Args:
            api_key: OpusClip API key
        """
        self.api_key = api_key
        self.base_url = "https://api.opus.pro/api"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    # ==================== PROJECT MANAGEMENT ====================
    
    async def create_clip_project(
        self,
        video_url: str,
        title: Optional[str] = None,
        curation_model: str = "ClipAnything",
        clip_durations: List[List[int]] = None,
        genre: str = "Auto",
        topic_keywords: List[str] = None,
        custom_prompt: Optional[str] = None,
        source_lang: str = "auto",
        brand_template_id: Optional[str] = None,
        layout_aspect_ratio: str = "portrait",
        enable_remove_filler_words: bool = False,
        webhook_url: Optional[str] = None,
        notification_email: Optional[str] = None,
        range_start_sec: Optional[int] = None,
        range_end_sec: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new clip project from a video URL
        
        Args:
            video_url: URL of the video (YouTube, Vimeo, etc.)
            title: Custom title for the project
            curation_model: "ClipBasic" or "ClipAnything"
            clip_durations: List of duration ranges [[0, 90], [90, 180]]
            genre: Video genre (Auto, Q&A, Commentary, etc.)
            topic_keywords: Keywords to prioritize (ClipBasic only)
            custom_prompt: Custom prompt (ClipAnything only)
            source_lang: Source language code
            brand_template_id: Brand template ID
            layout_aspect_ratio: portrait, landscape, or square
            enable_remove_filler_words: Remove filler words
            webhook_url: Webhook URL for completion notification
            notification_email: Email for completion notification
            range_start_sec: Start time in seconds
            range_end_sec: End time in seconds
            
        Returns:
            Project creation response with project ID
        """
        try:
            # Default clip durations
            if clip_durations is None:
                clip_durations = [[0, 90]]
            
            # Build request body
            request_body: Dict[str, Any] = {
                "videoUrl": video_url,
                "curationPref": {
                    "model": curation_model,
                    "clipDurations": clip_durations,
                    "genre": genre
                },
                "importPref": {
                    "sourceLang": source_lang
                },
                "renderPref": {
                    "layoutAspectRatio": layout_aspect_ratio
                }
            }
            
            # Add title if provided
            if title:
                request_body["uploadedVideoAttr"] = {"title": title}
            
            # Add range if provided
            if range_start_sec is not None or range_end_sec is not None:
                request_body["curationPref"]["range"] = {}
                if range_start_sec is not None:
                    request_body["curationPref"]["range"]["startSec"] = range_start_sec
                if range_end_sec is not None:
                    request_body["curationPref"]["range"]["endSec"] = range_end_sec
            
            # Add topic keywords for ClipBasic
            if curation_model == "ClipBasic" and topic_keywords:
                request_body["curationPref"]["topicKeywords"] = topic_keywords
            
            # Add custom prompt for ClipAnything
            if curation_model == "ClipAnything" and custom_prompt:
                request_body["curationPref"]["customPrompt"] = custom_prompt
            
            # Add brand template
            if brand_template_id:
                request_body["brandTemplateId"] = brand_template_id
            
            # Add filler word removal
            if enable_remove_filler_words:
                request_body["renderPref"]["quickstartConfig"] = {
                    "enableRemoveFillerWords": True
                }
            
            # Add conclusion actions (webhook/email)
            conclusion_actions = []
            if webhook_url:
                conclusion_actions.append({
                    "type": "WEBHOOK",
                    "notifyFailure": True,
                    "url": webhook_url
                })
            if notification_email:
                conclusion_actions.append({
                    "type": "EMAIL",
                    "notifyFailure": True,
                    "email": notification_email
                })
            if conclusion_actions:
                request_body["conclusionActions"] = conclusion_actions
            
            logger.info(f"Creating OpusClip project for video: {video_url}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/clip-projects",
                    headers=self.headers,
                    json=request_body
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"OpusClip project created: {result.get('projectId')}")
                return result
                
        except httpx.HTTPError as e:
            logger.error(f"OpusClip API error: {str(e)}")
            raise Exception(f"Failed to create OpusClip project: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise
    
    async def get_project_status(self, project_id: str) -> Dict[str, Any]:
        """
        Get the status of a clip project
        
        Args:
            project_id: Project ID
            
        Returns:
            Project status information
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/clip-projects/{project_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get project status: {str(e)}")
            raise
    
    async def share_project(self, project_id: str, visibility: str = "PUBLIC") -> Dict[str, Any]:
        """
        Share a project by updating visibility
        
        Args:
            project_id: Project ID
            visibility: "DEFAULT" or "PUBLIC"
            
        Returns:
            Updated project information
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/clip-projects/{project_id}/update-visibility",
                    headers=self.headers,
                    json={"visibility": visibility}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to share project: {str(e)}")
            raise
    
    # ==================== CLIPS MANAGEMENT ====================
    
    async def get_clips(
        self,
        project_id: Optional[str] = None,
        collection_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get clips from a project or collection
        
        Args:
            project_id: Project ID (use this OR collection_id)
            collection_id: Collection ID (use this OR project_id)
            
        Returns:
            List of clips with metadata
        """
        try:
            params = {}
            if project_id:
                params = {"q": "findByProjectId", "projectId": project_id}
            elif collection_id:
                params = {"q": "findByCollectionId", "collectionId": collection_id}
            else:
                raise ValueError("Either project_id or collection_id must be provided")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/exportable-clips",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get clips: {str(e)}")
            raise
    
    async def create_censor_job(
        self,
        project_id: str,
        clip_id: str,
        beep_sound: bool = False
    ) -> Dict[str, Any]:
        """
        Create a censor job to censor words in a clip
        
        Args:
            project_id: Project ID
            clip_id: Clip ID
            beep_sound: Whether to add beep sound
            
        Returns:
            Job ID and status
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/censor-jobs",
                    headers=self.headers,
                    json={
                        "projectId": project_id,
                        "clipId": clip_id,
                        "options": {"beepSound": beep_sound}
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to create censor job: {str(e)}")
            raise
    
    async def get_censor_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a censor job
        
        Args:
            job_id: Job ID
            
        Returns:
            Job status
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/censor-jobs/{job_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get censor job status: {str(e)}")
            raise
    
    # ==================== COLLECTIONS MANAGEMENT ====================
    
    async def create_collection(self, collection_name: str) -> Dict[str, Any]:
        """
        Create a new collection
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            Collection information with ID
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/collections",
                    headers=self.headers,
                    json={"collectionName": collection_name}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to create collection: {str(e)}")
            raise
    
    async def get_collections(self, content_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get all collections or collections containing a specific clip
        
        Args:
            content_id: Optional content ID to filter by
            
        Returns:
            List of collections
        """
        try:
            params = {"q": "mine"}
            if content_id:
                params = {"q": "findByContentId", "contentId": content_id}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/collections",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get collections: {str(e)}")
            raise
    
    async def delete_collection(self, collection_id: str) -> Dict[str, Any]:
        """
        Delete a collection (clips won't be deleted)
        
        Args:
            collection_id: Collection ID
            
        Returns:
            Deletion confirmation
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(
                    f"{self.base_url}/collections/{collection_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to delete collection: {str(e)}")
            raise
    
    async def add_clip_to_collection(
        self,
        collection_id: str,
        content_id: str
    ) -> Dict[str, Any]:
        """
        Add a clip to a collection
        
        Args:
            collection_id: Collection ID
            content_id: Full clip ID (projectId.curationId)
            
        Returns:
            Confirmation
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/collection-contents",
                    headers=self.headers,
                    json={
                        "collectionId": collection_id,
                        "contentId": content_id
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to add clip to collection: {str(e)}")
            raise
    
    async def remove_clip_from_collection(
        self,
        collection_id: str,
        content_id: str
    ) -> Dict[str, Any]:
        """
        Remove a clip from a collection
        
        Args:
            collection_id: Collection ID
            content_id: Full clip ID (projectId.curationId)
            
        Returns:
            Confirmation
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/collection-contents/delete-collection-contents",
                    headers=self.headers,
                    json={
                        "q": "findByCollectionIdAndContentId",
                        "collectionId": collection_id,
                        "contentId": content_id
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to remove clip from collection: {str(e)}")
            raise
    
    async def export_collection(self, collection_id: str) -> Dict[str, Any]:
        """
        Export all clips from a collection
        
        Args:
            collection_id: Collection ID
            
        Returns:
            List of clips with export URLs
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/collections/{collection_id}/export",
                    headers=self.headers,
                    json={}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to export collection: {str(e)}")
            raise
    
    # ==================== BRAND TEMPLATES ====================
    
    async def get_brand_templates(self) -> List[Dict[str, Any]]:
        """
        Get all brand templates for the account
        
        Returns:
            List of brand templates
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/brand-templates",
                    headers=self.headers,
                    params={"q": "mine"}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get brand templates: {str(e)}")
            raise
    
    # ==================== VIDEO UPLOAD ====================
    
    async def generate_upload_link(self) -> Dict[str, Any]:
        """
        Generate an upload link for local video files
        
        Returns:
            Upload URL and upload ID
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/upload-links",
                    headers=self.headers,
                    json={"video": {"usecase": "LocalUpload"}}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to generate upload link: {str(e)}")
            raise
    
    async def upload_video_file(
        self,
        file_path: str,
        upload_url: str
    ) -> bool:
        """
        Upload a video file to Google Cloud Storage
        
        Args:
            file_path: Local path to video file
            upload_url: Upload URL from generate_upload_link
            
        Returns:
            True if successful
        """
        try:
            # Step 1: Initiate resumable upload
            async with httpx.AsyncClient(timeout=30.0) as client:
                init_response = await client.post(
                    upload_url,
                    headers={
                        "x-goog-resumable": "start",
                        "Content-Length": "0"
                    }
                )
                init_response.raise_for_status()
                
                # Get resumable upload location
                location = init_response.headers.get("location")
                if not location:
                    raise Exception("No location header in response")
                
                # Step 2: Upload file
                with open(file_path, "rb") as f:
                    file_data = f.read()
                
                upload_response = await client.put(
                    location,
                    headers={"Content-Type": "application/octet-stream"},
                    content=file_data,
                    timeout=300.0  # 5 minutes for large files
                )
                upload_response.raise_for_status()
                
                logger.info(f"Video file uploaded successfully: {file_path}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to upload video file: {str(e)}")
            raise
