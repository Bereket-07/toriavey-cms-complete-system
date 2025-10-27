# src/use_cases/composio_executor_service.py

import asyncio
import logging
from typing import Dict, Any, List, Optional
import time

from composio import ComposioToolSet, App, Action
from composio.exceptions import InvalidParams
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
    def __init__(self, entity_id: str, auth_config_map: Optional[Dict[str, str]] = None):
        self.entity_id = entity_id
        self.toolset = ComposioToolSet(entity_id=entity_id)
        # Use provided auth_config_map or fall back to global config
        self.auth_config_map = auth_config_map or COMPOSIO_AUTH_CONFIGS

    def refresh_client(self):
        logger.info(f"Refreshing Composio client for entity: {self.entity_id}")
        self.toolset = ComposioToolSet(entity_id=self.entity_id)

    async def check_and_handle_authentication(
        self,
        app_name: str,
        api_key_params: Optional[Dict[str, Any]] = None
    ) -> bool:
        logger.info(f"Checking authentication for app '{app_name}' for entity '{self.entity_id}'")

        connected_accounts: List[Any] = await asyncio.to_thread(self.toolset.get_connected_accounts)
        
        # --- ✅ THE FINAL FIX: A more robust check for the connected account ---
        is_connected = False
        for acc in connected_accounts:
            # Check for the `appName` attribute, which might exist as a string
            if hasattr(acc, 'appName') and isinstance(acc.appName, str) and acc.appName.upper() == app_name.upper():
                is_connected = True
                break
            # Check for the `app.value` attribute, which is the expected enum path
            if hasattr(acc, 'app') and hasattr(acc.app, 'value') and acc.app.value.upper() == app_name.upper():
                is_connected = True
                break
        
        if is_connected:
            logger.info(f"App '{app_name}' is already authenticated.")
            return True
        # --- END OF THE FIX ---

        logger.warning(f"App '{app_name}' is not authenticated. Determining auth method.")
        app_enum = getattr(App, app_name.upper(), None)
        if not app_enum:
            raise ValueError(f"App '{app_name}' is not a valid Composio App.")

        # Get the auth_config_id for this app
        auth_config_id = self.auth_config_map.get(app_name.upper())
        print(f"Auth config ID for {app_name}: {auth_config_id}")
        if not auth_config_id:
            logger.error(f"No auth_config_id found for app '{app_name}'. Please create an auth config in the Composio dashboard.")
            raise ValueError(f"Missing auth_config_id for app '{app_name}'. Create an auth config in Composio dashboard first.")

        logger.info(f"Using auth_config_id '{auth_config_id}' for app '{app_name}'")

        try:
            # ✅ FIX: Use the correct composio API for initiating connections
            # Based on composio documentation, we need to pass auth_config with the auth_config_id
            logger.info(f"Initiating connection for app '{app_name}' with auth_config_id '{auth_config_id}'")
            
            # Create the auth_config parameter as expected by the API
            auth_config = {"id": auth_config_id}
            
            oauth_request = await asyncio.to_thread(
                lambda: self.toolset.initiate_connection(
                    app=app_enum,
                    entity_id=self.entity_id,
                    auth_config=auth_config,  # This is the correct parameter name
                    connected_account_params=api_key_params or {}
                )
            )

            if oauth_request and hasattr(oauth_request, 'redirectUrl'):
                logger.info(f"OAuth required for {app_name}. Raising challenge.")
                raise ComposioAuthRequired(app_name=app_name, auth_url=oauth_request.redirectUrl)

            if api_key_params:
                logger.info(f"Successfully connected to {app_name} using provided API key.")
                self.refresh_client()
                return True
            
            raise ConnectionError(f"Could not determine authentication method for {app_name}.")

        except InvalidParams as e:
            error_str = str(e).lower()
            if 'connected_account_params' in error_str:
                logger.info(f"{app_name} requires an API key. Raising challenge.")
                raise ComposioApiKeyRequired(app_name=app_name, required_keys=['generic_api_key'])
            else:
                raise e
    
    # ... (rest of the file is unchanged) ...
    async def get_actions_for_app(self, app_name: str) -> List[Action]:
        logger.info(f"Fetching actions for app: {app_name}")
        app_enum = getattr(App, app_name.upper(), None)
        if not app_enum:
            raise ValueError(f"App '{app_name}' is not a valid Composio App.")
        actions = await asyncio.to_thread(lambda: list(app_enum.get_actions()))
        logger.info(f"Found {len(actions)} actions for {app_name}.")
        return actions

    async def get_action_schema(self, action: Action) -> Dict[str, Any]:
        logger.info(f"Fetching schema for action: {action.name}")
        schema_list = await asyncio.to_thread(
            lambda: self.toolset.get_action_schemas(actions=[action])
        )
        if not schema_list:
            raise ValueError(f"Could not retrieve schema for action {action.name}")
        return schema_list[0]

    async def execute_action(self, action: Action, params: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Executing action '{action.name}' for entity '{self.entity_id}' with params: {params}")
        try:
            result = await asyncio.to_thread(
                lambda: self.toolset.execute_action(
                    action=action,
                    params=params,
                    entity_id=self.entity_id
                )
            )
            logger.info(f"Action '{action.name}' executed successfully.")
            return result
        except Exception as e:
            logger.error(f"Execution of action '{action.name}' failed: {e}", exc_info=True)
            raise
    async def get_linkedin_author_urn(self) -> str:
        """Fetch the LinkedIn URN (author_id) for the authenticated user."""
        app_enum = App.LINKEDIN
        actions = await self.get_actions_for_app("linkedin")

        # Find the correct action
        get_user_info_action = next(
            (a for a in actions if a.name.upper() == "LINKEDIN_GET_USER_INFO"), None
        )
        if not get_user_info_action:
            raise ValueError("Could not find LINKEDIN_GET_USER_INFO action.")

        # Execute the action
        result = await self.execute_action(get_user_info_action, params={})
        urn = result.get("id") or result.get("author_id") or result.get("urn")

        if not urn:
            raise ValueError("URN not found in LinkedIn user info response.")

        return urn
