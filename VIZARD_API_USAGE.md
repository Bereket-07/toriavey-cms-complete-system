# Vizard AI API Usage Guide

This guide shows how to use the `VizardAPI` class to generate video clips and shorts from YouTube videos and other sources.

## Setup

1. **Configure Environment Variables** in `.env`:
```env
VIZARD_API_KEY=your_vizard_api_key
```

2. **Import the VizardAPI**:
```python
from src.infrastructure.apis.vizard_api import VizardAPI, VideoType, ClipRatio, PreferLength
```

## Quick Start Examples

### 1. Create YouTube Shorts (Easiest Method)

```python
import asyncio
from src.infrastructure.apis.vizard_api import VizardAPI

async def create_shorts():
    # Initialize the API
    vizard = VizardAPI()
    
    # Create YouTube Shorts from a YouTube video
    result = await vizard.create_shorts_from_youtube(
        youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        lang="en",
        max_clips=5,
        keywords="cooking, recipe",
        project_name="My Cooking Shorts"
    )
    
    print(f"Project created! ID: {result.get('data', {}).get('projectId')}")
    print(f"Status: {result.get('message')}")

asyncio.run(create_shorts())
```

### 2. Create TikTok-Style Clips

```python
async def create_tiktok_clips():
    vizard = VizardAPI()
    
    # Create short TikTok clips (< 30 seconds)
    result = await vizard.create_tiktok_clips_from_youtube(
        youtube_url="https://www.youtube.com/watch?v=example",
        lang="en",
        max_clips=10,
        keywords="tips, tutorial",
        project_name="TikTok Tutorial Clips"
    )
    
    if result.get('code') == 200:
        print("TikTok clips project created successfully!")
    else:
        print(f"Error: {result.get('message')}")

asyncio.run(create_tiktok_clips())
```

### 3. Create Instagram Reels

```python
async def create_instagram_reels():
    vizard = VizardAPI()
    
    # Create Instagram Reels (30-90 seconds)
    result = await vizard.create_instagram_reels_from_youtube(
        youtube_url="https://www.youtube.com/watch?v=example",
        lang="en",
        max_clips=5,
        keywords="fitness, workout",
        project_name="Fitness Reels"
    )
    
    print(f"Project ID: {result.get('data', {}).get('projectId')}")

asyncio.run(create_instagram_reels())
```

## Advanced Usage

### 4. Custom Project with Full Control

```python
from src.infrastructure.apis.vizard_api import VizardAPI, VideoType, ClipRatio, PreferLength

async def create_custom_project():
    vizard = VizardAPI()
    
    result = await vizard.create_project(
        video_url="https://www.youtube.com/watch?v=example",
        video_type=VideoType.YOUTUBE,
        lang="en",
        prefer_length=[PreferLength.THIRTY_TO_SIXTY, PreferLength.SIXTY_TO_NINETY],
        ratio_of_clip=ClipRatio.VERTICAL,  # 9:16
        project_name="Custom Project",
        max_clip_number=10,
        keywords="technology, AI",
        remove_silence_switch=1,  # Remove silent gaps
        subtitle_switch=1,        # Show subtitles
        headline_switch=1,        # Add AI headlines
        emoji_switch=1,           # Add emojis
        highlight_switch=1,       # Highlight keywords
        auto_broll_switch=0       # No B-roll
    )
    
    return result

asyncio.run(create_custom_project())
```

### 5. Process Video from Different Sources

```python
async def process_different_sources():
    vizard = VizardAPI()
    
    # From TikTok
    tiktok_result = await vizard.create_project(
        video_url="https://www.tiktok.com/@user/video/123456",
        video_type=VideoType.TIKTOK,
        lang="en",
        prefer_length=[PreferLength.AUTO],
        ratio_of_clip=ClipRatio.SQUARE
    )
    
    # From Vimeo
    vimeo_result = await vizard.create_project(
        video_url="https://vimeo.com/123456789",
        video_type=VideoType.VIMEO,
        lang="en",
        prefer_length=[PreferLength.THIRTY_TO_SIXTY],
        ratio_of_clip=ClipRatio.HORIZONTAL
    )
    
    # From Remote File
    remote_result = await vizard.create_project(
        video_url="https://example.com/video.mp4",
        video_type=VideoType.REMOTE_FILE,
        lang="en",
        prefer_length=[PreferLength.AUTO],
        ext="mp4",  # Required for remote files
        ratio_of_clip=ClipRatio.VERTICAL
    )

asyncio.run(process_different_sources())
```

### 6. Apply Custom Template

```python
async def apply_template():
    vizard = VizardAPI()
    
    result = await vizard.create_project_from_youtube(
        youtube_url="https://www.youtube.com/watch?v=example",
        lang="en",
        prefer_length=[PreferLength.THIRTY_TO_SIXTY],
        ratio_of_clip=ClipRatio.VERTICAL,
        project_name="Branded Content",
        template_id=12345,  # Your custom template ID from Vizard dashboard
        subtitle_enabled=True,
        headline_enabled=True
    )

asyncio.run(apply_template())
```

## Error Handling

```python
from src.infrastructure.apis.vizard_api import VizardAPI, VizardAPIError

async def handle_errors():
    vizard = VizardAPI()
    
    try:
        result = await vizard.create_shorts_from_youtube(
            youtube_url="https://www.youtube.com/watch?v=example",
            lang="en"
        )
        
        if result.get('code') == 200:
            print("Success!")
        else:
            print(f"API returned error: {result.get('message')}")
            
    except VizardAPIError as e:
        print(f"Vizard API Error: {e.message}")
        print(f"Status Code: {e.status_code}")
        print(f"Response: {e.response_data}")
    except ValueError as e:
        print(f"Invalid parameters: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

asyncio.run(handle_errors())
```

## Enums Reference

### VideoType
- `REMOTE_FILE = 1` - Remote video file URL
- `YOUTUBE = 2` - YouTube video
- `GOOGLE_DRIVE = 3` - Google Drive
- `VIMEO = 4` - Vimeo
- `STREAMYARD = 5` - StreamYard
- `TIKTOK = 6` - TikTok
- `TWITTER = 7` - Twitter/X
- `RUMBLE = 8` - Rumble
- `TWITCH = 9` - Twitch
- `LOOM = 10` - Loom
- `FACEBOOK = 11` - Facebook
- `LINKEDIN = 12` - LinkedIn

### ClipRatio
- `VERTICAL = 1` - 9:16 (YouTube Shorts, TikTok, Instagram Reels)
- `SQUARE = 2` - 1:1 (Instagram Feed)
- `PORTRAIT = 3` - 4:5 (Instagram Feed)
- `HORIZONTAL = 4` - 16:9 (YouTube, Landscape)

### PreferLength
- `AUTO = 0` - Automatically chosen
- `LESS_THAN_30 = 1` - Less than 30 seconds
- `THIRTY_TO_SIXTY = 2` - 30 to 60 seconds
- `SIXTY_TO_NINETY = 3` - 60 to 90 seconds
- `NINETY_TO_THREE_MIN = 4` - 90 seconds to 3 minutes

## Supported Languages

Common language codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic
- `hi` - Hindi
- `ru` - Russian

For full list, see: https://vizard.readme.io/docs/supported-languages

## Response Format

All methods return a dictionary with this structure:

```python
{
    "code": 200,           # HTTP status code
    "message": "success",  # Status message
    "data": {
        "projectId": "abc123",  # Use this to check status later
        # ... other project data
    }
}
```

## Convenience Methods Summary

| Method | Use Case | Aspect Ratio | Duration | Features |
|--------|----------|--------------|----------|----------|
| `create_shorts_from_youtube()` | YouTube Shorts | 9:16 | 30-60s | Subtitles, Headlines, Emojis, Remove Silence |
| `create_tiktok_clips_from_youtube()` | TikTok | 9:16 | <30s | Subtitles, Headlines, Emojis, Highlights, Remove Silence |
| `create_instagram_reels_from_youtube()` | Instagram Reels | 9:16 | 30-90s | Subtitles, Headlines, Emojis, Remove Silence |
| `create_project_from_youtube()` | Custom YouTube | Customizable | Customizable | All features customizable |
| `create_project()` | Any Source | Customizable | Customizable | Full control over all parameters |

## Best Practices

1. **Use convenience methods** for common use cases (Shorts, TikTok, Reels)
2. **Set max_clip_number** to control costs and processing time
3. **Use keywords** to focus on specific topics in your content
4. **Enable remove_silence** for more engaging clips
5. **Choose appropriate aspect ratios** for your target platform
6. **Store project IDs** to check status and retrieve clips later

## Integration Example

```python
from src.infrastructure.apis.vizard_api import VizardAPI
from src.infrastructure.apis.youtube_api import YouTubeAPI

async def youtube_to_shorts_workflow():
    """
    Complete workflow: Fetch YouTube video, create shorts, upload back to YouTube
    """
    youtube = YouTubeAPI(entity_id="user_123")
    vizard = VizardAPI()
    
    # 1. List videos from your channel
    videos = await youtube.list_channel_videos(
        channel_id="UC_your_channel_id",
        max_results=1
    )
    
    # 2. Get the latest video URL
    latest_video = videos.get('data', {}).get('items', [])[0]
    video_id = latest_video.get('id', {}).get('videoId')
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    
    # 3. Create shorts from the video
    result = await vizard.create_shorts_from_youtube(
        youtube_url=video_url,
        lang="en",
        max_clips=5,
        project_name=f"Shorts from {latest_video.get('snippet', {}).get('title')}"
    )
    
    print(f"Created shorts project: {result.get('data', {}).get('projectId')}")
    
    # 4. Later: Upload generated clips back to YouTube
    # (You would need to download clips from Vizard first)

asyncio.run(youtube_to_shorts_workflow())
```
