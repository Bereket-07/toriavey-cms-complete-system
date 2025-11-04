# Quick Test Start Guide

Get started with testing in 5 minutes! ⚡

---

## 🚀 Step 1: Install Test Dependencies

```bash
# Make sure virtual environment is activated
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install test packages
pip install pytest pytest-asyncio pytest-cov
```

---

## 🧪 Step 2: Run Your First Test

### Option A: Run All Tests

```bash
pytest
```

### Option B: Use Test Runner Script

```bash
# Run all tests
python run_tests.py

# Run unit tests only
python run_tests.py unit

# Run integration tests only
python run_tests.py integration

# Run with coverage
python run_tests.py coverage
```

---

## ✅ Expected Output

```
================================ test session starts =================================
platform win32 -- Python 3.12.0, pytest-7.4.3, pluggy-1.3.0
rootdir: D:\desktop\work\EromoVentures Projects\ToriAveysCMS
configfile: pytest.ini
plugins: asyncio-0.21.1, cov-4.1.0
collected 16 items

tests/unit/test_generate_content.py ........                                   [ 50%]
tests/integration/test_content_api.py ........                                 [100%]

================================ 16 passed in 3.45s ==================================
```

---

## 📊 Step 3: Check Test Coverage

```bash
pytest --cov=src --cov-report=html --cov-report=term
```

Then open `htmlcov/index.html` in your browser to see detailed coverage report.

---

## 🎯 Quick Test Commands

| Command | Description |
|---------|-------------|
| `pytest` | Run all tests |
| `pytest -v` | Run with verbose output |
| `pytest -x` | Stop on first failure |
| `pytest tests/unit/` | Run unit tests only |
| `pytest tests/integration/` | Run integration tests only |
| `pytest --lf` | Run last failed tests |
| `pytest -k "test_generate"` | Run tests matching pattern |

---

## 🐛 Troubleshooting

### Issue: "No module named 'src'"

```bash
# Set PYTHONPATH
set PYTHONPATH=%CD%  # Windows
export PYTHONPATH=$(pwd)  # Linux/Mac
```

### Issue: "ModuleNotFoundError: No module named 'pytest'"

```bash
pip install pytest pytest-asyncio
```

### Issue: Tests fail with API key errors

```bash
# Set test API keys
set GOOGLE_API_KEY=test_key_12345
set COMPOSIO_API_KEY=test_key_12345
```

---

## 📝 Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── unit/                    # Unit tests
│   ├── __init__.py
│   └── test_generate_content.py
└── integration/             # Integration tests
    ├── __init__.py
    └── test_content_api.py
```

---

## 🎓 What's Being Tested?

### Unit Tests (`tests/unit/`)
✅ Content generation logic  
✅ Multiple platform support  
✅ Custom tone and instructions  
✅ Error handling  
✅ Fallback content  

### Integration Tests (`tests/integration/`)
✅ API endpoints  
✅ Request/response validation  
✅ Error responses  
✅ Batch operations  
✅ Content management  

---

## 📚 Next Steps

1. ✅ Run tests: `pytest`
2. ✅ Check coverage: `pytest --cov=src`
3. ✅ Read full guide: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
4. ✅ Write your own tests
5. ✅ Set up CI/CD

---

## 💡 Pro Tips

- Run `pytest -v` for detailed output
- Use `pytest -x` to stop on first failure
- Run `pytest --lf` to re-run only failed tests
- Use `pytest -k "pattern"` to run specific tests
- Check `htmlcov/index.html` for visual coverage report

---

That's it! You're ready to test! 🎉

For more details, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)
