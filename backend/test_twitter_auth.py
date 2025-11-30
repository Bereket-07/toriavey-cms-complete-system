import tweepy
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get credentials
api_key = os.getenv("TWITTER_API_KEY")
api_secret = os.getenv("TWITTER_API_SECRET")
access_token = os.getenv("TWITTER_ACCESS_TOKEN")
access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")

print("Testing Twitter API credentials...")
print(f"API Key: {api_key[:10]}...")
print(f"API Secret: {api_secret[:10]}...")
print(f"Access Token: {access_token[:10]}...")
print(f"Access Token Secret: {access_token_secret[:10]}...")

# Try to authenticate
try:
    auth = tweepy.OAuth1UserHandler(
        api_key,
        api_secret,
        access_token,
        access_token_secret
    )
    api = tweepy.API(auth)
    
    # Verify credentials
    user = api.verify_credentials()
    print(f"\n✅ Authentication successful!")
    print(f"Logged in as: @{user.screen_name}")
    print(f"User ID: {user.id}")
    
    # Try to post a test tweet
    test_tweet = "Test tweet from ToriAvey CMS - please ignore"
    print(f"\nAttempting to post: {test_tweet}")
    
    status = api.update_status(status=test_tweet)
    print(f"✅ Tweet posted successfully!")
    print(f"Tweet ID: {status.id}")
    print(f"Tweet URL: https://twitter.com/i/web/status/{status.id}")
    
except tweepy.TweepyException as e:
    print(f"\n❌ Error: {e}")
except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
