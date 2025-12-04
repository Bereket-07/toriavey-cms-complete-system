import asyncio
import logging
from src.infrastructure.apis.composio import ComposioExecutorService
from composio import Action

# Setup logging
logging.basicConfig(level=logging.INFO)

from composio import ComposioToolSet
import composio.client.files as files_module
import inspect

async def main():
    print("\nInspecting client.actions:")
    try:
        toolset = ComposioToolSet(entity_id="default_user")
        client = toolset.client
        if hasattr(client, 'actions'):
             print("client.actions exists")
             if hasattr(client.actions, 'create_file_upload'):
                 print("create_file_upload exists")
                 print("Sig:", inspect.signature(client.actions.create_file_upload))
    except Exception as e:
        print("ERROR inspecting client.actions:", e)

if __name__ == "__main__":
    asyncio.run(main())
