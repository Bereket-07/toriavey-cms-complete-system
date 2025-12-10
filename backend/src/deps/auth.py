from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.jwt_utils import verify_access_token
from src.api.v1.auth.google_oauth import load_credentials, refresh_credentials_if_needed, save_credentials

security = HTTPBearer()

async def require_google_login(request: Request, token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency that enforces Google Login.
    1. Verifies JWT from Authorization header.
    2. Retrieves stored Google credentials for the user.
    3. Refreshes credentials if expired.
    4. Attaches user_id and credentials to request.state.
    """
    # 1. Verify JWT
    payload = verify_access_token(token.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user_id",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Lookup Credentials
    creds = load_credentials(user_id)
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google credentials not found. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Auto-Refresh
    try:
        if creds.expired and creds.refresh_token:
            creds = refresh_credentials_if_needed(creds)
            # Save updated credentials
            save_credentials(user_id, creds)
    except Exception as e:
        # If refresh fails, they might need to login again
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to refresh credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if creds.expired:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credentials expired and could not be refreshed. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Attach to request state
    request.state.user_id = user_id
    request.state.google_creds = creds
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "creds": creds
    }
