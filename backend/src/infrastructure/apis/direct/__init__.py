# src/infrastructure/apis/direct/__init__.py

"""
Direct API integrations for social media platforms.
These replace Composio integrations with native API calls.
"""

from .twitter_direct_api import TwitterDirectAPI

__all__ = ["TwitterDirectAPI"]
