import logging
import httpx
import re
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class YouTubeScraper:
    """Scraper for YouTube channel data and videos."""
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    async def get_channel_id(self, handle: str) -> Optional[str]:
        """
        Get channel ID from a YouTube handle (e.g., @ToriAvey).
        """
        if not handle.startswith("@"):
            handle = f"@{handle}"
            
        url = f"https://www.youtube.com/{handle}"
        print(f"DEBUG: Scraper fetching channel ID for {handle} ...")
        logger.info(f"Fetching channel ID for {handle} from {url}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                # Look for channelId in meta tags or JSON config
                # Pattern: <meta itemprop="identifier" content="UC..."
                match = re.search(r'<meta itemprop="identifier" content="(UC[\w-]+)"', response.text)
                if match:
                    channel_id = match.group(1)
                    print(f"DEBUG: Found channel ID: {channel_id}")
                    logger.info(f"Found channel ID: {channel_id}")
                    return channel_id
                
                # Fallback: look for "externalId":"UC..."
                match = re.search(r'"externalId":"(UC[\w-]+)"', response.text)
                if match:
                    channel_id = match.group(1)
                    logger.info(f"Found channel ID (fallback): {channel_id}")
                    return channel_id
                    
                logger.warning(f"Could not find channel ID for {handle}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching channel ID: {e}")
            return None

    async def get_latest_videos(self, channel_id: str) -> List[Dict[str, str]]:
        """
        Get latest videos from channel RSS feed.
        Returns list of dicts with 'id', 'title', 'url', 'published'.
        """
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        print(f"DEBUG: Scraper fetching RSS: {rss_url}")
        logger.info(f"Fetching RSS feed: {rss_url}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(rss_url)
                response.raise_for_status()
                
                # Parse XML
                root = ET.fromstring(response.text)
                ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
                
                videos = []
                for entry in root.findall('atom:entry', ns):
                    video_id = entry.find('yt:videoId', ns).text
                    title = entry.find('atom:title', ns).text
                    published = entry.find('atom:published', ns).text
                    
                    videos.append({
                        "id": video_id,
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "published": published
                    })
                
                print(f"DEBUG: Found {len(videos)} videos in RSS")
                logger.info(f"Found {len(videos)} videos in RSS feed")
                return videos
                
        except Exception as e:
            logger.error(f"Error fetching RSS feed: {e}")
            return []
