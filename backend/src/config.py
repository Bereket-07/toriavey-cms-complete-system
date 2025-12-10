# src/config.py

import os
from dotenv import load_dotenv, find_dotenv

# Debug: Show which .env file is being loaded
env_file = find_dotenv()
print(f"Loading .env from: {env_file if env_file else 'NOT FOUND'}")
load_dotenv(env_file)

# Composio Authentication Configurations
# Map app names to their auth_config_id from Composio dashboard
COMPOSIO_AUTH_CONFIGS = {
    "YOUTUBE": os.getenv("COMPOSIO_YOUTUBE_AUTH_CONFIG_ID", ""),
    "LINKEDIN": os.getenv("COMPOSIO_LINKEDIN_AUTH_CONFIG_ID", ""),
    "TWITTER": os.getenv("COMPOSIO_TWITTER_AUTH_CONFIG_ID", ""),
    "INSTAGRAM": os.getenv("COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID", ""),
    "FACEBOOK": os.getenv("COMPOSIO_FACEBOOK_AUTH_CONFIG_ID", ""),
    "WORDPRESS": os.getenv("COMPOSIO_WORDPRESS_AUTH_CONFIG_ID", ""),
}

# Debug: Print loaded configs (remove in production)
print("=" * 50)
print("COMPOSIO AUTH CONFIGS LOADED:")
for app, config_id in COMPOSIO_AUTH_CONFIGS.items():
    print(f"  {app}: {config_id if config_id else '[EMPTY]'}")
print("=" * 50)

# Composio API Key
COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY", "")

# Vizard AI API Configuration
VIZARD_API_KEY = os.getenv("VIZARD_API_KEY", "")
VIZARD_API_BASE_URL = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"

# Google Gemini API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Twitter Direct API Configuration
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET", "")

# Instagram Configuration
INSTAGRAM_BUSINESS_ACCOUNT_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
print(f"Instagram Business Account ID: {INSTAGRAM_BUSINESS_ACCOUNT_ID if INSTAGRAM_BUSINESS_ACCOUNT_ID else '[EMPTY]'}")

# Facebook Configuration  
FACEBOOK_PAGE_ID = os.getenv("FACEBOOK_PAGE_ID", "")
print(f"Facebook Page ID: {FACEBOOK_PAGE_ID if FACEBOOK_PAGE_ID else '[EMPTY]'}")

# Authentication Configuration
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
AUTHORIZED_EMAILS_RAW: str = os.getenv("AUTHORIZED_EMAILS", "") # Raw string for type hint consistency
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-please-change") # Failover for dev
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
TOKEN_STORE_PATH = os.getenv("TOKEN_STORE_PATH", "tokens")
AUTHORIZED_EMAILS = [email.strip() for email in AUTHORIZED_EMAILS_RAW.split(",") if email.strip()]

# Ensure token store directory exists
if not os.path.exists(TOKEN_STORE_PATH):
    os.makedirs(TOKEN_STORE_PATH)
