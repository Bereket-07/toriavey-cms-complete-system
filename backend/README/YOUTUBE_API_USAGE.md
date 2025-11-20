# YouTube API Usage Guide

This guide shows how to use the `YouTubeAPI` class for social media integration via Composio.

## Setup

1. **Configure Environment Variables** in `.env`:
```env
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_YOUTUBE_AUTH_CONFIG_ID=your_youtube_auth_config_id
```

2. **Import the YouTubeAPI**:
```python
from src.infrastructure.apis.youtube_api import YouTubeAPI
```

## Usage Examples

### 1. Upload a Video to YouTube

```python
import asyncio
from src.infrastructure.apis.youtube_api import YouTubeAPI

async def upload_video_example():
    # Initialize the API with your entity ID
    youtube_api = YouTubeAPI(entity_id="user_123")
    
    # Upload a video
    result = await youtube_api.upload_video(
        video_file_path="/path/to/your/video.mp4",
        title="My Awesome Video",
        description="This is a description of my video",
        category_id="22",  # People & Blogs
        privacy_status="public",  # Options: "public", "private", "unlisted"
        tags=["cooking", "recipe", "food"]
    )
    
    if result.get("successful"):
        print("Video uploaded successfully!")
        print(f"Video data: {result.get('data')}")
    else:
        print(f"Upload failed: {result.get('error')}")

# Run the example
asyncio.run(upload_video_example())
```

### 2. List Videos from a Channel

```python
async def list_videos_example():
    youtube_api = YouTubeAPI(entity_id="user_123")
    
    # List videos from a channel
    result = await youtube_api.list_channel_videos(
        channel_id="UC_x5XG1OV2P6uZZ5FSM9Ttw",  # Example channel ID
        max_results=10,
        part="snippet"
    )
    
    if result.get("successful"):
        videos = result.get("data", {}).get("items", [])
        print(f"Found {len(videos)} videos")
        for video in videos:
            print(f"- {video.get('snippet', {}).get('title')}")
    else:
        print(f"Failed to list videos: {result.get('error')}")

asyncio.run(list_videos_example())
```

### 3. Get Detailed Video Information (Batch)

```python
async def get_video_details_example():
    youtube_api = YouTubeAPI(entity_id="user_123")
    
    # Get details for multiple videos at once
    video_ids = ["dQw4w9WgXcQ", "jNQXAC9IVRw", "9bZkp7q19f0"]
    
    result = await youtube_api.get_video_details_batch(
        video_ids=video_ids,
        parts=["snippet", "statistics", "contentDetails"],
        hl="en"  # Language code (optional)
    )
    
    if result.get("successful"):
        videos = result.get("data", {}).get("items", [])
        for video in videos:
            snippet = video.get("snippet", {})
            stats = video.get("statistics", {})
            print(f"\nTitle: {snippet.get('title')}")
            print(f"Views: {stats.get('viewCount')}")
            print(f"Likes: {stats.get('likeCount')}")
    else:
        print(f"Failed to get video details: {result.get('error')}")

asyncio.run(get_video_details_example())
```

### 4. Get Channel Videos with Full Details (Convenience Method)

```python
async def get_channel_videos_with_details_example():
    youtube_api = YouTubeAPI(entity_id="user_123")
    
    # This method combines listing and fetching details in one call
    result = await youtube_api.get_channel_videos_with_details(
        channel_id="UC_x5XG1OV2P6uZZ5FSM9Ttw",
        max_results=5,
        detail_parts=["snippet", "statistics", "contentDetails"]
    )
    
    if result.get("successful"):
        videos = result.get("videos", [])
        print(f"Found {len(videos)} videos with full details")
        for video in videos:
            snippet = video.get("snippet", {})
            stats = video.get("statistics", {})
            print(f"\n{snippet.get('title')}")
            print(f"Published: {snippet.get('publishedAt')}")
            print(f"Views: {stats.get('viewCount', 'N/A')}")
    else:
        print(f"Error: {result.get('error')}")

asyncio.run(get_channel_videos_with_details_example())
```

## Error Handling

The API will raise exceptions for authentication issues:

```python
from src.infrastructure.apis.composio import ComposioAuthRequired, ComposioApiKeyRequired

async def handle_auth_errors():
    youtube_api = YouTubeAPI(entity_id="user_123")
    
    try:
        result = await youtube_api.upload_video(
            video_file_path="/path/to/video.mp4",
            title="Test Video",
            description="Test",
            category_id="22",
            privacy_status="private",
            tags=["test"]
        )
    except ComposioAuthRequired as e:
        print(f"Authentication required for {e.app_name}")
        print(f"Please authenticate at: {e.auth_url}")
    except ComposioApiKeyRequired as e:
        print(f"API key required for {e.app_name}")
        print(f"Required keys: {e.required_keys}")
    except Exception as e:
        print(f"Unexpected error: {e}")

asyncio.run(handle_auth_errors())
```

## Response Format

All methods return a dictionary with the following structure:

```python
{
    "data": {...},        # Response data from YouTube API
    "successful": bool,   # True if operation succeeded
    "error": str or None  # Error message if operation failed
}
```

## YouTube Category IDs

Common category IDs for video uploads:
- `1` - Film & Animation
- `2` - Autos & Vehicles
- `10` - Music
- `15` - Pets & Animals
- `17` - Sports
- `19` - Travel & Events
- `20` - Gaming
- `22` - People & Blogs
- `23` - Comedy
- `24` - Entertainment
- `25` - News & Politics
- `26` - Howto & Style
- `27` - Education
- `28` - Science & Technology

## Privacy Status Options

- `public` - Anyone can view the video
- `unlisted` - Only people with the link can view
- `private` - Only you and people you choose can view
