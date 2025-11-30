# src/use_cases/manage_content.py

import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.domain.schemas.content_schemas import ContentPlatform
from src.infrastructure.apis.instagram_api import InstagramAPI
from src.infrastructure.apis.twitter_api import TwitterAPI
from src.infrastructure.apis.facebook_api import FacebookAPI
from src.infrastructure.apis.composio import ComposioAuthRequired, ComposioApiKeyRequired
from src.services.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class ManageContentUseCase:
    """
    Use case for managing generated content: approving, rejecting, editing, and posting.
    """
    
    def __init__(self, entity_id: str):
        """
        Initialize with entity ID for social media APIs.
        
        Args:
            entity_id: Composio entity ID for the user
        """
        self.entity_id = entity_id
        
        # Initialize social media APIs
        self.instagram_api = InstagramAPI(entity_id=entity_id)
        self.twitter_api = TwitterAPI(entity_id=entity_id)
        self.facebook_api = FacebookAPI(entity_id=entity_id)
        
        # Initialize image processor
        self.image_processor = ImageProcessor()
        
        logger.info(f"ManageContentUseCase initialized for entity: {entity_id}")
    
    async def approve_content(
        self,
        content_id: int,
        approved_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Approve content for posting.
        
        Args:
            content_id: ID of the content
            approved_by: User ID who approved
            
        Returns:
            Approval result
        """
        logger.info(f"Approving content {content_id}")
        
        # TODO: Update database
        return {
            "success": True,
            "content_id": content_id,
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": approved_by
        }
    
    async def reject_content(
        self,
        content_id: int,
        rejection_reason: Optional[str] = None,
        rejected_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Reject content.
        
        Args:
            content_id: ID of the content
            rejection_reason: Reason for rejection
            rejected_by: User ID who rejected
            
        Returns:
            Rejection result
        """
        logger.info(f"Rejecting content {content_id}: {rejection_reason}")
        
        # TODO: Update database
        return {
            "success": True,
            "content_id": content_id,
            "status": "rejected",
            "rejected_at": datetime.utcnow().isoformat(),
            "rejection_reason": rejection_reason,
            "rejected_by": rejected_by
        }
    
    async def edit_content(
        self,
        content_id: int,
        caption: Optional[str] = None,
        hashtags: Optional[str] = None,
        image_url: Optional[str] = None,
        edited_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Edit content fields.
        
        Args:
            content_id: ID of the content
            caption: Updated caption
            hashtags: Updated hashtags
            image_url: Updated image URL
            edited_by: User ID who edited
            
        Returns:
            Edit result with updated content
        """
        logger.info(f"Editing content {content_id}")
        
        # TODO: Fetch from database, update fields, save
        updates = {}
        if caption is not None:
            updates["caption"] = caption
        if hashtags is not None:
            updates["hashtags"] = hashtags
        if image_url is not None:
            updates["image_url"] = image_url
        
        # TODO: Update database with edit history
        return {
            "success": True,
            "content_id": content_id,
            "updates": updates,
            "edited_at": datetime.utcnow().isoformat(),
            "edited_by": edited_by
        }
    
    async def post_content_to_platforms(
        self,
        content_data: Dict[str, Any],
        platforms: List[ContentPlatform],
        schedule_for: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Post approved content to social media platforms.
        
        Args:
            content_data: Content metadata including caption, image, etc.
            platforms: List of platforms to post to
            schedule_for: Optional datetime to schedule post
            
        Returns:
            Results for each platform
        """
        logger.info(f"Posting content {content_data.get('id')} to {len(platforms)} platforms")
        
        if schedule_for:
            logger.info(f"Scheduling post for {schedule_for}")
            # TODO: Implement scheduling logic
            return {
                "success": True,
                "scheduled": True,
                "scheduled_for": schedule_for.isoformat(),
                "platforms": [p.value for p in platforms]
            }
        
        # Check which platforms have already been posted to
        posted_platforms = content_data.get("posted_platforms", [])
        platform_post_data = content_data.get("platform_post_data", {})
        
        results = {
            "posted_platforms": [],
            "failed_platforms": [],
            "skipped_platforms": [],
            "platform_post_data": platform_post_data.copy() if isinstance(platform_post_data, dict) else {}
        }
        
        for platform in platforms:
            platform_name = platform.value.lower()
            
            # Skip if already posted to this platform
            if platform_name in posted_platforms:
                logger.info(f"Skipping {platform_name} - already posted")
                results["skipped_platforms"].append({
                    "platform": platform_name,
                    "reason": "Already posted to this platform",
                    "posted_at": platform_post_data.get(platform_name, {}).get("posted_at")
                })
                continue
            
            try:
                result = await self._post_to_platform(
                    platform=platform,
                    content_data=content_data
                )
                
                if result.get("success"):
                    results["posted_platforms"].append(platform_name)
                    
                    # Store platform-specific post data
                    results["platform_post_data"][platform_name] = {
                        "post_id": result.get("post_id"),
                        "post_url": result.get("post_url"),
                        "posted_at": datetime.utcnow().isoformat()
                    }
                else:
                    error_data = {
                        "platform": platform_name,
                        "error": result.get("error", "Unknown error")
                    }
                    if result.get("auth_url"):
                        error_data["auth_url"] = result.get("auth_url")
                    
                    results["failed_platforms"].append(error_data)
                    
            except ComposioAuthRequired:
                # Re-raise auth required exception so controller can handle it
                raise
            except Exception as e:
                logger.error(f"Failed to post to {platform.value}: {e}")
                results["failed_platforms"].append({
                    "platform": platform.value,
                    "error": str(e)
                })
        
        return results
    
    async def _post_to_platform(
        self,
        platform: ContentPlatform,
        content_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Post to a specific platform"""
        
        caption = content_data.get("caption", "")
        hashtags = content_data.get("hashtags", "")
        image_url = content_data.get("image_url")
        
        # Combine caption and hashtags
        full_text = f"{caption}\n\n{hashtags}" if hashtags else caption
        
        if platform == ContentPlatform.INSTAGRAM:
            return await self._post_to_instagram(
                caption=full_text,
                image_url=image_url
            )
        
        elif platform == ContentPlatform.TWITTER:
            return await self._post_to_twitter(
                text=full_text,
                image_url=image_url
            )
        
        elif platform == ContentPlatform.THREADS:
            return await self._post_to_threads(
                text=full_text,
                image_url=image_url
            )
        
        elif platform == ContentPlatform.FACEBOOK:
            return await self._post_to_facebook(
                text=full_text,
                image_url=image_url
            )
        
        elif platform == ContentPlatform.LINKEDIN:
            return await self._post_to_linkedin(
                text=full_text,
                image_url=image_url
            )
        
        elif platform == ContentPlatform.PINTEREST:
            return await self._post_to_pinterest(
                description=full_text,
                image_url=image_url
            )
        
        else:
            return {
                "success": False,
                "error": f"Unsupported platform: {platform}"
            }
    
    async def _post_to_instagram(
        self,
        caption: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """
        Post to Instagram using Composio OAuth2 integration.
        
        Args:
            caption: Post caption with hashtags
            image_url: URL of the media to post
            
        Returns:
            Dict with success status, post_id, and error if any
        """
        try:
            if not image_url:
                logger.error("Instagram requires media URL")
                return {
                    "success": False,
                    "error": "Instagram requires an image or video URL"
                }
            
            # Detect media type
            media_type = self._get_media_type(image_url)
            
            # Log image processing info (actual processing requires image storage)
            ratio = self.image_processor.get_platform_ratio("instagram", "square")
            if ratio:
                logger.info(f"📐 Instagram optimal ratio: {ratio[0]}:{ratio[1]} (1080x1080px)")
                logger.info(f"ℹ️  Image processing available but requires storage setup to upload processed images")
            
            logger.info(f"Posting to Instagram: media_type={media_type}, caption={caption[:50]}...")
            
            # Post based on media type
            if media_type == "video":
                result = await self.instagram_api.post_video(
                    video_url=image_url,
                    caption=caption
                )
            else:  # image or unknown (default to image)
                result = await self.instagram_api.post_image(
                    image_url=image_url,
                    caption=caption
                )
            
            if result.get("successful"):
                logger.info(f"Successfully posted to Instagram. Post ID: {result.get('post_id')}")
                return {
                    "success": True,
                    "post_id": result.get("post_id"),
                    "platform": "instagram"
                }
            else:
                logger.error(f"Instagram posting failed: {result.get('error')}")
                return {
                    "success": False,
                    "error": result.get("error", "Unknown error")
                }
                

        except ComposioAuthRequired:
            # Re-raise auth required exception so controller can handle it
            raise
        except Exception as e:
            logger.error(f"Failed to post to Instagram: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _post_to_twitter(
        self,
        text: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """
        Post to Twitter/X using Composio OAuth2 integration.
        
        Args:
            text: Tweet text (will be auto-truncated to 280 chars)
            image_url: Optional URL of media to attach
            
        Returns:
            Dict with success status, tweet_id, tweet_url, and error if any
        """
        try:
            logger.info(f"Posting to Twitter: text={text[:50]}...")
            
            # Post text-only (media not supported via Composio)
            result = await self.twitter_api.post_tweet(text, truncate=True)
            
            if result.get("successful"):
                logger.info(f"Successfully posted to Twitter. Tweet ID: {result.get('tweet_id')}")
                return {
                    "success": True,
                    "tweet_id": result.get("tweet_id"),
                    "tweet_url": result.get("tweet_url"),
                    "platform": "twitter"
                }
            else:
                logger.error(f"Twitter posting failed: {result.get('error')}")
                return {
                    "success": False,
                    "error": result.get("error", "Unknown error")
                }
                

        except ComposioAuthRequired:
            # Re-raise auth required exception so controller can handle it
            raise
        except Exception as e:
            logger.error(f"Failed to post to Twitter: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _post_to_threads(
        self,
        text: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """Post to Threads - Placeholder for future implementation"""
        logger.warning("Threads posting not yet implemented")
        return {
            "success": False,
            "error": "Threads API integration pending"
        }
    
    async def _post_to_facebook(
        self,
        text: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """
        Post to Facebook using Composio OAuth integration.
        
        Args:
            text: Post message/text
            image_url: Optional URL of image to attach
            
        Returns:
            Dict with success status, post_id, and error if any
        """
        try:
            logger.info(f"Posting to Facebook: has_media={bool(image_url)}, text={text[:50]}...")
            
            # Use post_to_page for both text and images
            result = await self.facebook_api.post_to_page(
                message=text,
                image_url=image_url
            )
            
            if result.get("successful"):
                logger.info(f"Successfully posted to Facebook. Post ID: {result.get('post_id')}")
                return {
                    "success": True,
                    "post_id": result.get("post_id"),
                    "post_url": result.get("post_url"),
                    "platform": "facebook"
                }
            else:
                logger.error(f"Facebook posting failed: {result.get('error')}")
                return {
                    "success": False,
                    "error": result.get("error", "Unknown error")
                }
                
        except ComposioAuthRequired:
            # Re-raise auth required exception so controller can handle it
            raise
        except Exception as e:
            logger.error(f"Failed to post to Facebook: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _post_to_linkedin(
        self,
        text: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """Post to LinkedIn - Placeholder for future implementation"""
        logger.warning("LinkedIn posting not yet implemented")
        return {
            "success": False,
            "error": "LinkedIn API integration pending"
        }
    
    async def _post_to_pinterest(
        self,
        description: str,
        image_url: Optional[str]
    ) -> Dict[str, Any]:
        """Post to Pinterest - Placeholder for future implementation"""
        logger.warning("Pinterest posting not yet implemented")
        return {
            "success": False,
            "error": "Pinterest API integration pending"
        }
    
    def _get_media_type(self, url: str) -> str:
        """
        Detect media type from URL extension.
        
        Args:
            url: Media URL
            
        Returns:
            "image", "video", or "unknown"
        """
        if not url:
            return "unknown"
        
        # Extract extension from URL (handle query params)
        url_lower = url.lower().split('?')[0]
        ext = url_lower.split('.')[-1] if '.' in url_lower else ""
        
        # Image extensions
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']:
            return "image"
        
        # Video extensions
        if ext in ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'm4v', 'wmv']:
            return "video"
        
        # Default to image if unknown
        logger.warning(f"Unknown media type for extension '{ext}', defaulting to image")
        return "image"
    
    async def bulk_approve(
        self,
        content_ids: List[int],
        approved_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Approve multiple contents at once.
        
        Args:
            content_ids: List of content IDs to approve
            approved_by: User ID who approved
            
        Returns:
            Bulk approval results
        """
        logger.info(f"Bulk approving {len(content_ids)} contents")
        
        results = {
            "approved": [],
            "failed": []
        }
        
        for content_id in content_ids:
            try:
                result = await self.approve_content(content_id, approved_by)
                if result.get("success"):
                    results["approved"].append(content_id)
                else:
                    results["failed"].append(content_id)
            except Exception as e:
                logger.error(f"Failed to approve content {content_id}: {e}")
                results["failed"].append(content_id)
        
        return {
            "success": len(results["failed"]) == 0,
            "total": len(content_ids),
            "approved_count": len(results["approved"]),
            "failed_count": len(results["failed"]),
            "results": results
        }
    
    async def bulk_post(
        self,
        content_ids: List[int],
        platforms: List[ContentPlatform],
        posted_by: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Post multiple contents to platforms at once.
        
        Args:
            content_ids: List of content IDs to post
            platforms: Platforms to post to
            posted_by: User ID who posted
            
        Returns:
            Bulk posting results
        """
        logger.info(f"Bulk posting {len(content_ids)} contents to {len(platforms)} platforms")
        
        results = {
            "posted": [],
            "failed": []
        }
        
        for content_id in content_ids:
            try:
                # TODO: Fetch content data from database
                content_data = {"id": content_id}  # Placeholder
                
                result = await self.post_content_to_platforms(
                    content_data=content_data,
                    platforms=platforms
                )
                
                if result.get("posted_platforms"):
                    results["posted"].append(content_id)
                else:
                    results["failed"].append(content_id)
                    
            except Exception as e:
                logger.error(f"Failed to post content {content_id}: {e}")
                results["failed"].append(content_id)
        
        return {
            "success": len(results["failed"]) == 0,
            "total": len(content_ids),
            "posted_count": len(results["posted"]),
            "failed_count": len(results["failed"]),
            "results": results
        }
