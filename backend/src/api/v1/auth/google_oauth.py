import os
import json
import logging
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from src.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    TOKEN_STORE_PATH
)

logger = logging.getLogger(__name__)

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

def get_google_flow() -> Flow:
    """
    Creates and returns a Google OAuth Flow instance.
    """
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "project_id": "tori-aveys-cms", # Optional
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uris": [GOOGLE_REDIRECT_URI]
        }
    }
    
    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )

def save_credentials(user_id: str, credentials: Credentials) -> None:
    """
    Saves Google credentials to a JSON file.
    """
    file_path = os.path.join(TOKEN_STORE_PATH, f"{user_id}.json")
    try:
        # DEBUG: Log the credentials JSON to see if refresh_token is present
        creds_json = credentials.to_json()
        creds_dict = json.loads(creds_json)
        if 'refresh_token' not in creds_dict:
            logger.error(f"CRITICAL: refresh_token MISSING in credentials for user {user_id} before save! Token info: {creds_dict.keys()}")
        else:
            logger.info(f"refresh_token PRESENT for user {user_id} before save.")

        with open(file_path, 'w') as f:
            f.write(creds_json)
        logger.info(f"Saved credentials for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to save credentials for user {user_id}: {e}")

def load_credentials(user_id: str) -> Optional[Credentials]:
    """
    Loads Google credentials from a JSON file.
    """
    file_path = os.path.join(TOKEN_STORE_PATH, f"{user_id}.json")
    if not os.path.exists(file_path):
        return None
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            return Credentials.from_authorized_user_info(data)
    except Exception as e:
        logger.error(f"Failed to load credentials for user {user_id}: {e}")
        return None

def refresh_credentials_if_needed(credentials: Credentials) -> Credentials:
    """
    Refreshes the credentials if they are expired.
    """
    if credentials and credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
            logger.info("Refreshed expired credentials")
        except Exception as e:
            logger.error(f"Failed to refresh credentials: {e}")
    return credentials
