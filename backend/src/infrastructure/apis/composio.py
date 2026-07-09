# src/infrastructure/apis/composio.py
# MIGRATED to the new `composio` (0.17.x) SDK.
# Old SDK (composio-core: ComposioToolSet/App/Action) is deprecated and returns HTTP 410.
import asyncio
import logging
import os
from typing import Dict, Any, List, Optional
 
from composio import Composio
from src.config import COMPOSIO_AUTH_CONFIGS
 
logger = logging.getLogger(__name__)
 
 
class ComposioApiKeyRequired(Exception):
    def __init__(self, app_name: str, required_keys: list[str], message="API Key is required for authentication."):
        self.app_name = app_name
        self.required_keys = required_keys
        self.message = message
        super().__init__(self.message)
 
 
class ComposioAuthRequired(Exception):
    def __init__(self, app_name: str, auth_url: str, message="User authentication is required."):
        self.app_name = app_name
        self.auth_url = auth_url
        self.message = message
        super().__init__(self.message)
 
 
class ComposioExecutorService:
    """
    Wrapper around the new Composio SDK (package `composio`, v0.17+).
 
    Key differences from the old composio-core wrapper:
      - Client is `Composio(api_key=...)` instead of `ComposioToolSet(entity_id=...)`.
      - `entity_id` maps to the new `user_id`.
      - Actions are STRING SLUGS (e.g. "TWITTER_CREATION_OF_A_POST"), not Action objects.
      - Execution needs an explicit connected_account_id; we resolve it per-app from
        the user's connected accounts.
    """
 
    def __init__(self, entity_id: str, auth_config_map: Optional[Dict[str, str]] = None):
        self.entity_id = entity_id  # used as user_id in the new SDK
        self._client = None
        self.auth_config_map = auth_config_map or COMPOSIO_AUTH_CONFIGS
 
    @property
    def client(self) -> Composio:
        """Lazily build and cache the Composio client on first access."""
        if self._client is None:
            api_key = os.environ.get("COMPOSIO_API_KEY")
            self._client = Composio(api_key=api_key)
        return self._client
 
    def refresh_client(self):
        logger.info(f"Refreshing Composio client for user: {self.entity_id}")
        api_key = os.environ.get("COMPOSIO_API_KEY")
        self._client = Composio(api_key=api_key)
 
    def _find_connected_account_id(self, toolkit_slug: str) -> Optional[str]:
        """Return the ACTIVE connected_account_id for this user + toolkit, or None."""
        try:
            accounts = self.client.connected_accounts.list(user_ids=[self.entity_id])
        except TypeError:
            # some SDK builds take no user_ids filter; fall back to full list
            accounts = self.client.connected_accounts.list()
        items = getattr(accounts, "items", None) or accounts
        for acc in items:
            tk = getattr(acc, "toolkit", None)
            slug = getattr(tk, "slug", None) or (tk if isinstance(tk, str) else None)
            status = getattr(acc, "status", None)
            if slug and slug.lower() == toolkit_slug.lower() and status == "ACTIVE":
                return getattr(acc, "id", None)
        return None
 
    async def check_and_handle_authentication(
        self,
        app_name: str,
        api_key_params: Optional[Dict[str, Any]] = None,
        force_new_connection: bool = False,
    ) -> bool:
        toolkit = app_name.lower()
        logger.info(f"Checking authentication for '{app_name}' (user '{self.entity_id}', force={force_new_connection})")
 
        if not force_new_connection:
            existing = await asyncio.to_thread(self._find_connected_account_id, toolkit)
            if existing:
                logger.info(f"App '{app_name}' already authenticated (connection {existing}).")
                return True
 
        auth_config_id = self.auth_config_map.get(app_name.upper())
        if not auth_config_id:
            raise ValueError(
                f"Missing auth_config_id for app '{app_name}'. Create an auth config in Composio first."
            )
 
        logger.info(f"Initiating connection for '{app_name}' with auth_config_id '{auth_config_id}'")
        try:
            req = await asyncio.to_thread(
                lambda: self.client.connected_accounts.initiate(
                    user_id=self.entity_id,
                    auth_config_id=auth_config_id,
                )
            )
            redirect_url = getattr(req, "redirect_url", None)
            if redirect_url:
                logger.info(f"OAuth required for {app_name}. Raising challenge.")
                raise ComposioAuthRequired(app_name=app_name, auth_url=redirect_url)
            return True
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Auth initiation failed for {app_name}: {e}", exc_info=True)
            raise
 
    async def get_actions_for_app(self, app_name: str) -> List[str]:
        """Return a list of action SLUGS (strings) for the given app/toolkit."""
        toolkit = app_name.lower()
        logger.info(f"Fetching tools for toolkit: {toolkit}")
        tools = await asyncio.to_thread(
            lambda: self.client.tools.get(user_id=self.entity_id, toolkits=[toolkit], limit=200)
        )
        items = getattr(tools, "items", None) or tools
        slugs: List[str] = []
        for t in items:
            if isinstance(t, dict) and "function" in t:
                name = t["function"].get("name")
            else:
                name = getattr(t, "slug", None) or getattr(t, "name", None)
            if name:
                slugs.append(name)
        logger.info(f"Found {len(slugs)} tools for {toolkit}.")
        return slugs
 
    async def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an action. `action` is now a STRING SLUG (e.g. 'TWITTER_CREATION_OF_A_POST').
        Resolves the connected account for the action's toolkit automatically.
        """
        action_slug = action if isinstance(action, str) else getattr(action, "name", str(action))
        app_name = action_slug.split("_")[0] if "_" in action_slug else "UNKNOWN"
        toolkit = app_name.lower()
 
        connected_account_id = await asyncio.to_thread(self._find_connected_account_id, toolkit)
        if not connected_account_id:
            logger.warning(f"No active connection for {app_name}; triggering authentication.")
            await self.check_and_handle_authentication(app_name=app_name, force_new_connection=True)
            # If auth didn't raise ComposioAuthRequired, try resolving once more.
            connected_account_id = await asyncio.to_thread(self._find_connected_account_id, toolkit)
            if not connected_account_id:
                raise ConnectionError(f"Could not find a connection for {app_name}.")
 
        logger.info(f"Executing '{action_slug}' for user '{self.entity_id}' (conn {connected_account_id}).")
        try:
            result = await asyncio.to_thread(
                lambda: self.client.tools.execute(
                    action_slug,
                    arguments=params,
                    connected_account_id=connected_account_id,
                    user_id=self.entity_id,
                    dangerously_skip_version_check=True,
                )
            )
            logger.info(f"Action '{action_slug}' executed.")
            # New SDK returns {'data':..., 'error':..., 'successful':bool}.
            # Return the FULL envelope unchanged so existing callers that read
            # result['successful'] / result['data'] keep working as-is.
            return result
        except ComposioAuthRequired:
            raise
        except Exception as e:
            logger.error(f"Execution of '{action_slug}' failed: {e}", exc_info=True)
            raise
 
    async def upload_file(self, file_name: str, file_content: bytes, content_type: str) -> Dict[str, Any]:
        """Upload a file to Composio storage (unchanged - uses the REST endpoint directly)."""
        import requests
        import hashlib
 
        md5_hash = hashlib.md5(file_content).hexdigest()
        upload_request_data = {
            "toolkit_slug": "YOUTUBE",
            "tool_slug": "YOUTUBE_UPLOAD_VIDEO",
            "filename": file_name,
            "mimetype": content_type,
            "md5": md5_hash,
        }
        api_key = os.environ.get("COMPOSIO_API_KEY")
        if not api_key:
            logger.warning("COMPOSIO_API_KEY not found in environment; upload may fail.")
        headers = {"Content-Type": "application/json", "x-api-key": api_key}
 
        logger.info(f"Requesting upload URL for {file_name}")
        upload_response = await asyncio.to_thread(
            requests.post,
            "https://backend.composio.dev/api/v3/files/upload/request",
            json=upload_request_data,
            headers=headers,
        )
        if not upload_response.ok:
            raise Exception(f"Failed to get upload URL: {upload_response.text}")
        upload_data = upload_response.json()
        if upload_data.get("type") == "new":
            presigned_url = upload_data.get("newPresignedUrl")
            upload_file_response = await asyncio.to_thread(
                requests.put,
                presigned_url,
                data=file_content,
                headers={"Content-Type": content_type, "Content-Length": str(len(file_content))},
            )
            if not upload_file_response.ok:
                raise Exception(f"Failed to upload file to S3: {upload_file_response.status_code}")
            logger.info("File uploaded to S3 successfully")
        return upload_data
 