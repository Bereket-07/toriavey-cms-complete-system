# Twitter API Setup Guide

## Step 1: Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Click "Sign up for Free Account"
4. Fill out the application form:
   - **Use case**: Content publishing/Social media management
   - **Will you make Twitter content available to government entities?**: No
5. Agree to terms and submit

## Step 2: Create a New App

1. Once approved, go to the [Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or "Create App"
3. Fill in app details:
   - **App name**: `ToriAveyCMS` (or your preferred name)
   - **Description**: Social media content management system
   - **Website URL**: `http://localhost:8000` (for development)
   - **Callback URL**: `http://localhost:8000/api/auth/twitter/callback`

## Step 3: Configure App Permissions

1. Go to your app settings
2. Navigate to "User authentication settings"
3. Click "Set up"
4. Configure OAuth 2.0:
   - **App permissions**: Read and Write
   - **Type of App**: Web App
   - **Callback URI**: `http://localhost:8000/api/auth/twitter/callback`
   - **Website URL**: `http://localhost:8000`
5. Save settings

## Step 4: Get API Keys

1. Go to "Keys and tokens" tab
2. You'll see:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
3. Click "Generate" under "Access Token and Secret"
4. Save these credentials:
   ```
   API Key: xxxxxxxxxxxxxxxxxxxxx
   API Key Secret: xxxxxxxxxxxxxxxxxxxxx
   Bearer Token: xxxxxxxxxxxxxxxxxxxxx
   Access Token: xxxxxxxxxxxxxxxxxxxxx
   Access Token Secret: xxxxxxxxxxxxxxxxxxxxx
   ```

## Step 5: Add to .env File

Add these to your `backend/.env` file:

```env
# Twitter API Credentials
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

## Step 6: Verify Setup

Once you've added the credentials, restart your backend server. The new Twitter direct API will use these credentials instead of Composio.

## Important Notes

- **Free Tier Limits**: 
  - 50 tweets per 24 hours
  - 1,500 tweets per month
  - Media uploads count toward limits
  
- **Rate Limiting**: The API will automatically handle rate limits

- **Security**: Never commit your `.env` file to version control

## Troubleshooting

**Issue**: "Invalid credentials" error
- **Solution**: Double-check that you copied all keys correctly (no extra spaces)

**Issue**: "Read-only application" error
- **Solution**: Make sure you set app permissions to "Read and Write"

**Issue**: "Callback URL mismatch" error
- **Solution**: Ensure callback URL in app settings matches exactly: `http://localhost:8000/api/auth/twitter/callback`
