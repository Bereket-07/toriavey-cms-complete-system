# src/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Composio Authentication Configurations
# Map app names to their auth_config_id from Composio dashboard
COMPOSIO_AUTH_CONFIGS = {
    "YOUTUBE": os.getenv("COMPOSIO_YOUTUBE_AUTH_CONFIG_ID", ""),
    "LINKEDIN": os.getenv("COMPOSIO_LINKEDIN_AUTH_CONFIG_ID", ""),
    "TWITTER": os.getenv("COMPOSIO_TWITTER_AUTH_CONFIG_ID", ""),
    "INSTAGRAM": os.getenv("COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID", ""),
    "WORDPRESS": os.getenv("COMPOSIO_WORDPRESS_AUTH_CONFIG_ID", ""),
}

# Composio API Key
COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY", "")

# Vizard AI API Configuration
VIZARD_API_KEY = os.getenv("VIZARD_API_KEY", "")
VIZARD_API_BASE_URL = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"

# Google Gemini API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
