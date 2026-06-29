# tests/conftest.py

import os
import sys
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Environment setup
# ---------------------------------------------------------------------------
# Set dummy values BEFORE any `src.*` module is imported. src.config and
# src.utils.config read environment variables at import time (and Settings()
# requires the DB_* vars), so the test suite must not depend on a real .env
# file or live credentials. setdefault lets a real environment override these.
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "testdb")
os.environ.setdefault("JWT_SECRET", "test-secret-key")
os.environ.setdefault("GOOGLE_API_KEY", "test-google-api-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("COMPOSIO_API_KEY", "test-composio-key")
os.environ.setdefault("VIZARD_API_KEY", "test-vizard-key")

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


# ---------------------------------------------------------------------------
# Markers: `live` tests need a real DB + external APIs and are skipped unless
# RUN_LIVE_TESTS=1 is set in the environment.
# ---------------------------------------------------------------------------
def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "live: test requires a live database and external APIs; "
        "skipped unless RUN_LIVE_TESTS=1",
    )


def pytest_collection_modifyitems(config, items):
    if os.environ.get("RUN_LIVE_TESTS") == "1":
        return
    skip_live = pytest.mark.skip(reason="needs live DB/APIs; set RUN_LIVE_TESTS=1 to run")
    for item in items:
        if "live" in item.keywords:
            item.add_marker(skip_live)


# ---------------------------------------------------------------------------
# Auth override: every gated router depends on require_google_login. For tests
# we replace it with a fake authenticated user so endpoint logic is exercised
# rather than the auth gate (which would otherwise return 403 everywhere).
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def override_auth():
    from src.app import app
    from src.deps.auth import require_google_login

    def _fake_user():
        return {"user_id": "test-user", "email": "test@example.com", "creds": None}

    app.dependency_overrides[require_google_login] = _fake_user
    yield
    app.dependency_overrides.pop(require_google_login, None)


# ---------------------------------------------------------------------------
# Existing fixtures (preserved)
# ---------------------------------------------------------------------------
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
