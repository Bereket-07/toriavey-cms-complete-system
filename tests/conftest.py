# tests/conftest.py

import pytest
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session")
def test_config():
    """Test configuration"""
    return {
        "test_mode": True,
        "mock_llm": True,
        "mock_database": True
    }


@pytest.fixture
def mock_google_api_key(monkeypatch):
    """Mock Google API key for testing"""
    monkeypatch.setenv("GOOGLE_API_KEY", "test_api_key_12345")


@pytest.fixture
def mock_composio_api_key(monkeypatch):
    """Mock Composio API key for testing"""
    monkeypatch.setenv("COMPOSIO_API_KEY", "test_composio_key_12345")
