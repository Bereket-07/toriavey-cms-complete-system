import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
import requests
import logging
 
from src.api.v1.auth.google_oauth import get_google_flow, save_credentials
from src.core.jwt_utils import create_access_token
from src.config import FRONTEND_URL, AUTHORIZED_EMAILS
 
router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
 
@router.get("/login")
def login(request: Request):
    """
    Redirects the user to the Google OAuth 2.0 authorization URL.
 
    The CSRF `state` returned by Google is stored in a short-lived HttpOnly
    cookie so it can be verified when Google redirects back to /callback.
    """
    flow = get_google_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    response = RedirectResponse(authorization_url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,        # 10 minutes
        httponly=True,
        secure=True,        # requires HTTPS; for plain-http local dev set to False
        samesite="lax",
    )
    return response
 
@router.get("/callback")
def callback(request: Request, code: str, state: str = None):
    """
    Handles the Google OAuth 2.0 callback.
    Verifies the CSRF state, exchanges code for tokens, saves credentials,
    and returns a JWT.
    """
    try:
        # CSRF protection: the state Google echoes back must match the one we
        # set at login time (stored in the oauth_state cookie).
        expected_state = request.cookies.get("oauth_state")
        if not state or not expected_state or state != expected_state:
            logger.warning("OAuth state mismatch or missing; possible CSRF attempt.")
            return RedirectResponse(f"{FRONTEND_URL}/?error=invalid_state")
 
        flow = get_google_flow()
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Get user info using the credentials
        user_info_service = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {credentials.token}'}
        )
        user_info = user_info_service.json()
        
        user_id = user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        
        if not user_id:
             raise HTTPException(status_code=400, detail="Could not retrieve user ID from Google")
 
        # Verify email is authorized
        if AUTHORIZED_EMAILS and email.lower() not in [e.lower() for e in AUTHORIZED_EMAILS]:
             logger.warning(f"Unauthorized login attempt: {email}")
             # Redirect with error
             return RedirectResponse(f"{FRONTEND_URL}/?error=unauthorized_email")
 
        # Save credentials to file
        if not credentials.refresh_token:
            logger.error(f"NO REFRESH TOKEN RECEIVED for user {email}! prompt='consent' might be failing.")
        else:
            logger.info(f"Successfully received refresh token for user {email}")
 
        save_credentials(user_id, credentials)
        
        # Create JWT access token
        access_token = create_access_token(
            data={"sub": user_id, "email": email}
        )
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/auth/callback?access_token={access_token}&user_id={user_id}&email={email}&name={name}&picture={picture}"
        response = RedirectResponse(url=redirect_url)
        response.delete_cookie("oauth_state")
        return response
        
    except Exception as e:
        logger.error(f"Error in auth callback: {e}")
        # Redirect to frontend login with error
        return RedirectResponse(f"{FRONTEND_URL}/?error=auth_failed")
 