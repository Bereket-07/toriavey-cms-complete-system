# Testing Guide - Tori Avey CMS

Complete guide for testing the content generation feature and entire application.

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [Manual Testing](#manual-testing)
6. [Test Coverage](#test-coverage)
7. [Troubleshooting](#troubleshooting)

---

## 🛠️ Setup

### 1. Install Test Dependencies

```bash
# Install pytest and related packages
pip install pytest pytest-asyncio pytest-cov pytest-mock

# Or install from requirements.txt
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env.test` file for testing:

```env
GOOGLE_API_KEY=test_api_key_for_testing
COMPOSIO_API_KEY=test_composio_key
```

Or set them temporarily:

```bash
# Windows
set GOOGLE_API_KEY=test_key
set COMPOSIO_API_KEY=test_key

# Linux/Mac
export GOOGLE_API_KEY=test_key
export COMPOSIO_API_KEY=test_key
```

---

## 🚀 Running Tests

### Run All Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with detailed output
pytest -vv
```

### Run Unit Tests Only

```bash
# Run all unit tests
pytest tests/unit/

# Run specific unit test file
pytest tests/unit/test_generate_content.py

# Run specific test function
pytest tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_from_recipe_data_success
```

### Run Integration Tests Only

```bash
# Run all integration tests
pytest tests/integration/

# Run specific integration test file
pytest tests/integration/test_content_api.py

# Run specific test class
pytest tests/integration/test_content_api.py::TestContentGenerationAPI
```

### Run Tests by Marker

```bash
# Run only unit tests (if marked)
pytest -m unit

# Run only integration tests (if marked)
pytest -m integration

# Run only async tests
pytest -m asyncio
```

### Run Tests with Coverage

```bash
# Run tests with coverage report
pytest --cov=src --cov-report=html --cov-report=term

# View coverage report
# Open htmlcov/index.html in browser
```

---

## 🧪 Unit Tests

### What Unit Tests Cover

✅ **GenerateContentUseCase**
- Content generation from recipe data
- Multiple platform support
- Custom tone and instructions
- LLM failure handling
- Fallback content generation
- Minimal recipe data handling

### Running Unit Tests

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run with output
pytest tests/unit/test_generate_content.py -v -s
```

### Example Unit Test Output

```
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_from_recipe_data_success PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_for_multiple_platforms PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_with_custom_tone PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_handles_llm_failure PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_with_minimal_recipe_data PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_with_custom_instructions PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_fallback_content_generation PASSED
tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_fallback_content_without_emojis PASSED

========== 8 passed in 2.34s ==========
```

### Writing Your Own Unit Tests

```python
# tests/unit/test_your_feature.py

import pytest
from src.your_module import YourClass

@pytest.fixture
def sample_data():
    return {"key": "value"}

class TestYourFeature:
    def test_something(self, sample_data):
        result = YourClass().method(sample_data)
        assert result is not None
        assert result["key"] == "expected_value"
```

---

## 🔗 Integration Tests

### What Integration Tests Cover

✅ **Content Generation API**
- POST `/api/content/generate` - Generate content
- POST `/api/content/generate-batch` - Batch generation
- GET `/api/content/pending` - Get pending content
- GET `/api/content/stats` - Get statistics
- POST `/api/content/approve` - Approve content
- POST `/api/content/reject` - Reject content
- POST `/api/content/edit` - Edit content
- POST `/api/content/bulk-approve` - Bulk approve

✅ **Error Handling**
- Validation errors
- Internal server errors
- Missing required fields
- Invalid data

### Running Integration Tests

```bash
# Run all integration tests
pytest tests/integration/ -v

# Run specific test
pytest tests/integration/test_content_api.py::TestContentGenerationAPI::test_generate_content_success -v
```

### Example Integration Test Output

```
tests/integration/test_content_api.py::TestContentGenerationAPI::test_health_endpoint PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_root_endpoint PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_generate_content_success PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_generate_content_missing_required_fields PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_generate_content_invalid_platform PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_generate_batch_endpoint PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_get_pending_content PASSED
tests/integration/test_content_api.py::TestContentGenerationAPI::test_approve_content PASSED

========== 8 passed in 3.45s ==========
```

---

## 🧑‍💻 Manual Testing

### 1. Start the Server

```bash
# Activate virtual environment
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Start server
python src/app.py

# Or with uvicorn
uvicorn src.app:app --reload
```

### 2. Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "toriavey-cms",
  "version": "1.0.0"
}
```

### 3. Test Content Generation

```bash
curl -X POST "http://localhost:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Test Chocolate Chip Cookies",
      "description": "Delicious test cookies",
      "ingredients": ["flour", "butter", "chocolate chips"],
      "instructions": ["Mix", "Bake", "Enjoy"],
      "prep_time": "15 minutes",
      "cook_time": "12 minutes",
      "servings": "24 cookies"
    },
    "target_platforms": ["instagram", "twitter"],
    "tone": "engaging and friendly",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

### 4. Test with Postman or Thunder Client

1. **Import Collection**: Create a new collection
2. **Add Request**: POST to `http://localhost:8000/api/content/generate`
3. **Set Headers**: `Content-Type: application/json`
4. **Add Body**: Use the JSON from example above
5. **Send Request**

### 5. Test API Documentation

Open in browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📊 Test Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing

# View HTML report
# Open htmlcov/index.html in your browser
```

### Coverage Report Example

```
---------- coverage: platform win32, python 3.12.0 -----------
Name                                          Stmts   Miss  Cover   Missing
---------------------------------------------------------------------------
src/__init__.py                                   0      0   100%
src/app.py                                       45      2    96%   89-90
src/config.py                                    10      0   100%
src/controllers/content_controller.py           120     15    88%   145-150, 200-205
src/domain/models/content_model.py               35      0   100%
src/domain/schemas/content_schemas.py            50      0   100%
src/use_cases/generate_content.py               150     10    93%   250-255, 300-305
src/use_cases/manage_content.py                 100     20    80%   150-170, 200-220
---------------------------------------------------------------------------
TOTAL                                           510     47    91%
```

### Target Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **Overall**: 85%+ coverage

---

## 🐛 Troubleshooting

### Issue: Tests Fail with Import Errors

**Solution:**
```bash
# Set PYTHONPATH
# Windows
set PYTHONPATH=%CD%

# Linux/Mac
export PYTHONPATH=$(pwd)

# Or run from project root
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS"
pytest
```

### Issue: "ModuleNotFoundError: No module named 'src'"

**Solution:**
```bash
# Install package in editable mode
pip install -e .

# Or add to conftest.py (already done)
```

### Issue: Async Tests Not Running

**Solution:**
```bash
# Install pytest-asyncio
pip install pytest-asyncio

# Check pytest.ini has asyncio_mode = auto
```

### Issue: Mock Not Working

**Solution:**
```python
# Use AsyncMock for async functions
from unittest.mock import AsyncMock

mock_func = AsyncMock(return_value={"data": "test"})
```

### Issue: API Key Errors in Tests

**Solution:**
```bash
# Set test environment variables
set GOOGLE_API_KEY=test_key_12345
set COMPOSIO_API_KEY=test_key_12345

# Or use monkeypatch in conftest.py (already configured)
```

---

## 📝 Test Checklist

### Before Committing Code

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage is above 85%
- [ ] No failing tests
- [ ] New features have tests
- [ ] Bug fixes have regression tests

### Before Deploying

- [ ] All tests pass in CI/CD
- [ ] Integration tests pass against staging
- [ ] Manual smoke tests completed
- [ ] API documentation updated
- [ ] Performance tests pass (if applicable)

---

## 🎯 Quick Commands Reference

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run unit tests only
pytest tests/unit/

# Run integration tests only
pytest tests/integration/

# Run specific test file
pytest tests/unit/test_generate_content.py

# Run specific test
pytest tests/unit/test_generate_content.py::TestGenerateContentUseCase::test_generate_from_recipe_data_success

# Run with coverage
pytest --cov=src --cov-report=html

# Run and stop on first failure
pytest -x

# Run last failed tests
pytest --lf

# Run tests in parallel (requires pytest-xdist)
pytest -n auto

# Run with print statements visible
pytest -s

# Run with detailed output
pytest -vv
```

---

## 🔍 Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.12'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      env:
        GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY_TEST }}
        COMPOSIO_API_KEY: ${{ secrets.COMPOSIO_API_KEY_TEST }}
      run: |
        pytest --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

---

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Python Mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)

---

Happy Testing! 🎉
