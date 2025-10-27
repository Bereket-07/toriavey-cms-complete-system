# Vizard API - Universal Video Clipping Guide

## 🎯 NEW: Create Clips from ANY Video Source!

The Vizard API now supports creating clips from **12 different video platforms**, not just YouTube!

## Supported Video Sources

- ✅ YouTube
- ✅ TikTok
- ✅ Vimeo
- ✅ Facebook
- ✅ LinkedIn
- ✅ Twitter/X
- ✅ Twitch
- ✅ Loom
- ✅ Google Drive
- ✅ StreamYard
- ✅ Rumble
- ✅ Remote Video Files (MP4, AVI, MOV, 3GP)

## Quick Start Examples

### 1. YouTube Shorts from ANY Source

```python
from src.infrastructure.apis.vizard_api import VizardAPI, VideoType

vizard = VizardAPI()

# From YouTube
await vizard.create_youtube_shorts(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=5
)

# From TikTok
await vizard.create_youtube_shorts(
    video_url="https://www.tiktok.com/@user/video/123",
    video_type=VideoType.TIKTOK,
    lang="en",
    max_clips=5
)

# From Vimeo
await vizard.create_youtube_shorts(
    video_url="https://vimeo.com/123456789",
    video_type=VideoType.VIMEO,
    lang="en",
    max_clips=5
)

# From Facebook
await vizard.create_youtube_shorts(
    video_url="https://www.facebook.com/watch/?v=123456",
    video_type=VideoType.FACEBOOK,
    lang="en",
    max_clips=5
)

# From Remote File
await vizard.create_youtube_shorts(
    video_url="https://example.com/my-video.mp4",
    video_type=VideoType.REMOTE_FILE,
    ext="mp4",  # Required for remote files
    lang="en",
    max_clips=5
)
```

### 2. TikTok Clips from ANY Source

```python
# From YouTube
await vizard.create_tiktok_clips(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=10
)

# From LinkedIn
await vizard.create_tiktok_clips(
    video_url="https://www.linkedin.com/posts/...",
    video_type=VideoType.LINKEDIN,
    lang="en",
    max_clips=10
)

# From Twitch
await vizard.create_tiktok_clips(
    video_url="https://www.twitch.tv/videos/123456",
    video_type=VideoType.TWITCH,
    lang="en",
    max_clips=10
)
```

### 3. Instagram Reels from ANY Source

```python
# From YouTube
await vizard.create_instagram_reels(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=5
)

# From Twitter/X
await vizard.create_instagram_reels(
    video_url="https://twitter.com/user/status/123",
    video_type=VideoType.TWITTER,
    lang="en",
    max_clips=5
)

# From Loom
await vizard.create_instagram_reels(
    video_url="https://www.loom.com/share/abc123",
    video_type=VideoType.LOOM,
    lang="en",
    max_clips=5
)
```

### 4. Facebook Reels from ANY Source

```python
# From YouTube
await vizard.create_facebook_reels(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=5
)

# From Rumble
await vizard.create_facebook_reels(
    video_url="https://rumble.com/v123-video.html",
    video_type=VideoType.RUMBLE,
    lang="en",
    max_clips=5
)
```

### 5. LinkedIn Clips from ANY Source

```python
# From YouTube (professional content)
await vizard.create_linkedin_clips(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=5,
    keywords="business, leadership"
)

# From Google Drive
await vizard.create_linkedin_clips(
    video_url="https://drive.google.com/file/d/abc123/view",
    video_type=VideoType.GOOGLE_DRIVE,
    lang="en",
    max_clips=5
)
```

### 6. Twitter/X Clips from ANY Source

```python
# From YouTube
await vizard.create_twitter_clips(
    video_url="https://www.youtube.com/watch?v=example",
    video_type=VideoType.YOUTUBE,
    lang="en",
    max_clips=5
)

# From StreamYard
await vizard.create_twitter_clips(
    video_url="https://streamyard.com/watch/abc123",
    video_type=VideoType.STREAMYARD,
    lang="en",
    max_clips=5
)
```

## All Available Methods

| Method | Platform | Aspect Ratio | Duration | Best For |
|--------|----------|--------------|----------|----------|
| `create_youtube_shorts()` | Any | 9:16 Vertical | 30-60s | YouTube Shorts |
| `create_tiktok_clips()` | Any | 9:16 Vertical | <30s | TikTok, Quick Clips |
| `create_instagram_reels()` | Any | 9:16 Vertical | 30-90s | Instagram Reels |
| `create_facebook_reels()` | Any | 9:16 Vertical | 30-90s | Facebook Reels |
| `create_linkedin_clips()` | Any | 1:1 Square | 30-90s | LinkedIn (Professional) |
| `create_twitter_clips()` | Any | 1:1 Square | 30-60s | Twitter/X |

## Complete Example: Multi-Platform Workflow

```python
import asyncio
from src.infrastructure.apis.vizard_api import VizardAPI, VideoType

async def multi_platform_clipping():
    vizard = VizardAPI()
    
    # Source: YouTube video
    youtube_url = "https://www.youtube.com/watch?v=example"
    
    # Create clips for ALL platforms from ONE source
    results = {}
    
    # YouTube Shorts
    results['youtube_shorts'] = await vizard.create_youtube_shorts(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=5,
        keywords="tutorial, tips"
    )
    
    # TikTok Clips
    results['tiktok'] = await vizard.create_tiktok_clips(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=10,
        keywords="viral, trending"
    )
    
    # Instagram Reels
    results['instagram'] = await vizard.create_instagram_reels(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=5,
        keywords="lifestyle, tips"
    )
    
    # Facebook Reels
    results['facebook'] = await vizard.create_facebook_reels(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=5
    )
    
    # LinkedIn Clips
    results['linkedin'] = await vizard.create_linkedin_clips(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=3,
        keywords="business, professional"
    )
    
    # Twitter Clips
    results['twitter'] = await vizard.create_twitter_clips(
        video_url=youtube_url,
        video_type=VideoType.YOUTUBE,
        lang="en",
        max_clips=5
    )
    
    # Print all project IDs
    for platform, result in results.items():
        project_id = result.get('data', {}).get('projectId')
        print(f"{platform}: {project_id}")
    
    return results

asyncio.run(multi_platform_clipping())
```

## Cross-Platform Examples

### Example 1: TikTok Video → All Platforms

```python
async def tiktok_to_all_platforms():
    vizard = VizardAPI()
    tiktok_url = "https://www.tiktok.com/@user/video/123456"
    
    # Create YouTube Shorts from TikTok
    shorts = await vizard.create_youtube_shorts(
        video_url=tiktok_url,
        video_type=VideoType.TIKTOK,
        lang="en"
    )
    
    # Create Instagram Reels from TikTok
    reels = await vizard.create_instagram_reels(
        video_url=tiktok_url,
        video_type=VideoType.TIKTOK,
        lang="en"
    )
    
    return shorts, reels
```

### Example 2: Twitch Stream → Short Clips

```python
async def twitch_to_clips():
    vizard = VizardAPI()
    twitch_url = "https://www.twitch.tv/videos/123456789"
    
    # Create TikTok clips from Twitch stream
    clips = await vizard.create_tiktok_clips(
        video_url=twitch_url,
        video_type=VideoType.TWITCH,
        lang="en",
        max_clips=20,
        keywords="gaming, highlights"
    )
    
    return clips
```

### Example 3: Loom Recording → Professional Clips

```python
async def loom_to_linkedin():
    vizard = VizardAPI()
    loom_url = "https://www.loom.com/share/abc123def456"
    
    # Create LinkedIn clips from Loom recording
    clips = await vizard.create_linkedin_clips(
        video_url=loom_url,
        video_type=VideoType.LOOM,
        lang="en",
        max_clips=5,
        keywords="tutorial, demo, product"
    )
    
    return clips
```

### Example 4: Remote File → All Formats

```python
async def remote_file_to_all():
    vizard = VizardAPI()
    video_url = "https://cdn.example.com/webinar-recording.mp4"
    
    # YouTube Shorts
    shorts = await vizard.create_youtube_shorts(
        video_url=video_url,
        video_type=VideoType.REMOTE_FILE,
        ext="mp4",  # Required!
        lang="en",
        max_clips=5
    )
    
    # TikTok Clips
    tiktok = await vizard.create_tiktok_clips(
        video_url=video_url,
        video_type=VideoType.REMOTE_FILE,
        ext="mp4",  # Required!
        lang="en",
        max_clips=10
    )
    
    return shorts, tiktok
```

## VideoType Reference

```python
from src.infrastructure.apis.vizard_api import VideoType

VideoType.REMOTE_FILE   # 1 - Remote video file (requires ext parameter)
VideoType.YOUTUBE       # 2 - YouTube
VideoType.GOOGLE_DRIVE  # 3 - Google Drive
VideoType.VIMEO         # 4 - Vimeo
VideoType.STREAMYARD    # 5 - StreamYard
VideoType.TIKTOK        # 6 - TikTok
VideoType.TWITTER       # 7 - Twitter/X
VideoType.RUMBLE        # 8 - Rumble
VideoType.TWITCH        # 9 - Twitch
VideoType.LOOM          # 10 - Loom
VideoType.FACEBOOK      # 11 - Facebook
VideoType.LINKEDIN      # 12 - LinkedIn
```

## Platform-Specific Optimizations

### YouTube Shorts
- **Aspect Ratio**: 9:16 (Vertical)
- **Duration**: 30-60 seconds
- **Features**: Subtitles, Headlines, Emojis, Remove Silence

### TikTok Clips
- **Aspect Ratio**: 9:16 (Vertical)
- **Duration**: <30 seconds
- **Features**: Subtitles, Headlines, Emojis, Highlights, Remove Silence

### Instagram Reels
- **Aspect Ratio**: 9:16 (Vertical)
- **Duration**: 30-90 seconds
- **Features**: Subtitles, Headlines, Emojis, Remove Silence

### Facebook Reels
- **Aspect Ratio**: 9:16 (Vertical)
- **Duration**: 30-90 seconds
- **Features**: Subtitles, Headlines, Emojis, Remove Silence

### LinkedIn Clips
- **Aspect Ratio**: 1:1 (Square) - Professional
- **Duration**: 30-90 seconds
- **Features**: Subtitles, Headlines, Remove Silence (No Emojis)

### Twitter/X Clips
- **Aspect Ratio**: 1:1 (Square)
- **Duration**: 30-60 seconds
- **Features**: Subtitles, Headlines, Emojis, Remove Silence

## Best Practices

1. **Use the right method for your target platform** - Each method is optimized for specific platform requirements
2. **Set video_type correctly** - Match the source platform to ensure proper processing
3. **Add ext parameter for remote files** - Required when using `VideoType.REMOTE_FILE`
4. **Use keywords strategically** - Help Vizard focus on relevant content
5. **Adjust max_clips based on video length** - Longer videos can generate more clips
6. **Consider language** - Set the correct language code for better transcription

## Migration from Old Methods

Old (YouTube-only):
```python
await vizard.create_shorts_from_youtube(youtube_url)
```

New (Any source):
```python
await vizard.create_youtube_shorts(video_url, video_type=VideoType.YOUTUBE)
await vizard.create_youtube_shorts(video_url, video_type=VideoType.TIKTOK)
await vizard.create_youtube_shorts(video_url, video_type=VideoType.VIMEO)
# ... any source!
```

The old methods still work but are deprecated. Use the new methods for full flexibility!
