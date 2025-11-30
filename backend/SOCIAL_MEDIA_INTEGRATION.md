# Social Media Integration Documentation

## Overview

This document describes the Instagram and Twitter API integration using Composio OAuth2 authentication.

## Architecture

### Components

1. **InstagramAPI** (`src/infrastructure/apis/instagram_api.py`)
   - Handles Instagram feed posts (images and videos)
   - OAuth2 authentication via Composio
   - Dynamic action discovery

2. **TwitterAPI** (`src/infrastructure/apis/twitter_api.py`)
   - Handles tweets (text, images, and videos)
   - OAuth2 authentication via Composio
   - Auto-truncation to 280 characters
   - Dynamic action discovery

3. **ManageContentUseCase** (`src/use_cases/manage_content.py`)
   - Orchestrates posting to multiple platforms
   - Media type detection
   - Error handling and logging

4. **Test Controller** (`src/controllers/social_media_test_controller.py`)
   - Test endpoints for authentication and posting
   - Useful for debugging and verification

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Composio API Key
COMPOSIO_API_KEY=ak_WfIM8THO0WNHtudwyNS1

# Instagram OAuth2 Config
COMPOSIO_INSTAGRAM_CONFIG_ID=ac_m955n_fnvQoU

# Twitter OAuth2 Config
COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_9tXZ0gV5ejEX
```

### Entity ID

The default entity ID is: `pg-test-e3058604-b827-4348-b57e-c9006a2ba98c`

This is configured in:
- `ManageContentUseCase` (hardcoded as `"default_user"` in content_controller.py)
- Test endpoints (default parameter)

## Usage

### 1. Test Authentication

Before posting, verify that OAuth2 authentication is working:

**Instagram:**
```bash
curl -X POST http://localhost:7000/api/test/instagram-auth
```

**Twitter:**
```bash
curl -X POST http://localhost:7000/api/test/twitter-auth
```

**Expected Response (Authenticated):**
```json
{
  "success": true,
  "auth_status": "authenticated",
  "message": "Instagram is authenticated and ready to use",
  "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c",
  "available_actions": ["INSTAGRAM_CREATE_POST", "..."],
  "actions_count": 15
}
```

**Expected Response (Not Authenticated):**
```json
{
  "success": false,
  "auth_status": "auth_required",
  "message": "OAuth2 authentication required. Please visit: https://...",
  "auth_url": "https://app.composio.dev/...",
  "app_name": "INSTAGRAM"
}
```

### 2. Test Posting

**Instagram Image:**
```bash
curl -X POST http://localhost:7000/api/test/instagram-post \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://toriavey.com/images/2023/01/chocolate-chip-cookies.jpg",
    "caption": "Delicious chocolate chip cookies! 🍪 #recipe #baking #cookies",
    "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
  }'
```

**Twitter Tweet:**
```bash
curl -X POST http://localhost:7000/api/test/twitter-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this amazing recipe! 🍪 #recipe #food",
    "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
  }'
```

**Twitter with Image:**
```bash
curl -X POST http://localhost:7000/api/test/twitter-post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Delicious chocolate chip cookies! 🍪 #recipe #baking",
    "media_url": "https://toriavey.com/images/2023/01/chocolate-chip-cookies.jpg",
    "entity_id": "pg-test-e3058604-b827-4348-b57e-c9006a2ba98c"
  }'
```

### 3. Production Usage

**Post Content via Content Controller:**

```bash
curl -X POST http://localhost:7000/api/content/post \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": 123,
    "platforms": ["instagram", "twitter"]
  }'
```

This will:
1. Fetch content from database (caption, image_url, etc.)
2. Post to Instagram and Twitter
3. Update database with posting status
4. Return results for each platform

## API Reference

### InstagramAPI

#### `post_image(image_url: str, caption: str) -> Dict[str, Any]`

Post an image to Instagram feed.

**Parameters:**
- `image_url`: URL of the image (must be publicly accessible)
- `caption`: Caption text with hashtags

**Returns:**
```python
{
    "successful": True,
    "post_id": "123456789",
    "data": {...}
}
```

#### `post_video(video_url: str, caption: str) -> Dict[str, Any]`

Post a video to Instagram feed.

**Parameters:**
- `video_url`: URL of the video (must be publicly accessible)
- `caption`: Caption text with hashtags

**Returns:**
```python
{
    "successful": True,
    "post_id": "123456789",
    "data": {...}
}
```

### TwitterAPI

#### `post_tweet(text: str, truncate: bool = True) -> Dict[str, Any]`

Post a text-only tweet.

**Parameters:**
- `text`: Tweet text (auto-truncated to 280 chars if truncate=True)
- `truncate`: Whether to auto-truncate

**Returns:**
```python
{
    "successful": True,
    "tweet_id": "123456789",
    "tweet_url": "https://twitter.com/user/status/123456789",
    "data": {...}
}
```

#### `post_tweet_with_media(text: str, media_url: str, media_type: str = "image") -> Dict[str, Any]`

Post a tweet with media.

**Parameters:**
- `text`: Tweet text
- `media_url`: URL of media to attach
- `media_type`: "image" or "video"

**Returns:**
```python
{
    "successful": True,
    "tweet_id": "123456789",
    "tweet_url": "https://twitter.com/user/status/123456789",
    "data": {...}
}
```

## Error Handling

### OAuth2 Authentication Required

If authentication is needed, the API will raise `ComposioAuthRequired`:

```python
{
    "success": False,
    "error": "Instagram authentication required. Please authenticate at: https://...",
    "auth_required": True,
    "auth_url": "https://app.composio.dev/..."
}
```

**Solution:** Visit the `auth_url` to complete OAuth2 authentication.

### Common Errors

1. **"Instagram requires an image or video URL"**
   - Instagram posts must have media
   - Provide a valid `image_url` or `video_url`

2. **"Could not find Instagram image posting action"**
   - Composio action names may have changed
   - Check available actions via test endpoint
   - Update action names in code if needed

3. **"Failed to post to Instagram: ..."**
   - Check that media URL is publicly accessible
   - Verify caption doesn't violate Instagram policies
   - Check Composio dashboard for rate limits

## Media Type Detection

The system automatically detects media type from URL extension:

**Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`
**Videos:** `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`, `.flv`, `.m4v`, `.wmv`

If extension is unknown, defaults to "image".

## Workflow Integration

### Complete Posting Workflow

1. **Generate Content** (via `/api/content/generate`)
   ```json
   {
     "recipe_id": 123,
     "target_platforms": ["instagram", "twitter"]
   }
   ```

2. **Review Generated Content** (via `/api/wprm-recipes-generated-not-posted`)
   - View AI-generated captions
   - Check image URLs
   - Edit if needed

3. **Approve Content** (via `/api/wprm-approve-content/{recipe_id}`)
   - Marks content as "pending" (ready to post)

4. **Post to Social Media** (via `/api/content/post`)
   ```json
   {
     "content_id": 123,
     "platforms": ["instagram", "twitter"]
   }
   ```

5. **Verify Results**
   - Check Instagram feed
   - Check Twitter feed
   - Verify database status updated

## Troubleshooting

### Authentication Issues

**Problem:** "OAuth2 authentication required"

**Solution:**
1. Visit the provided `auth_url`
2. Complete OAuth2 flow
3. Retry the request

### Posting Failures

**Problem:** Post fails with error

**Steps to debug:**
1. Check authentication status via test endpoint
2. Verify media URL is accessible (try opening in browser)
3. Check Composio dashboard for errors
4. Review logs for detailed error messages
5. Try posting via test endpoint first

### Action Discovery

If Composio action names change, use the test endpoints to discover available actions:

```bash
curl -X POST http://localhost:7000/api/test/instagram-auth
```

Look at the `available_actions` array in the response.

## Next Steps

1. **Test Authentication**
   - Run auth test endpoints
   - Complete OAuth2 flow if needed

2. **Test Posting**
   - Use test endpoints with sample data
   - Verify posts appear on platforms

3. **Production Testing**
   - Generate content for a real recipe
   - Approve and post via production endpoints
   - Verify database updates

4. **Monitor & Iterate**
   - Check logs for errors
   - Monitor rate limits
   - Adjust as needed

## Support

For issues with:
- **Composio API:** Check [Composio Documentation](https://docs.composio.dev)
- **Instagram API:** Check [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- **Twitter API:** Check [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
