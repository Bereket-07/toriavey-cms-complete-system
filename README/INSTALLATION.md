# Installation Guide

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Quick Installation

### 1. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```env
# Google Gemini API (for content generation)
GOOGLE_API_KEY=your_gemini_api_key_here

# Vizard AI API (for video clips)
VIZARD_API_KEY=your_vizard_api_key_here
VIZARD_API_BASE_URL=https://elb-api.vizard.ai/hvizard-server-front/open-api/v1

# Composio API (for social media posting)
COMPOSIO_API_KEY=your_composio_api_key_here
COMPOSIO_YOUTUBE_AUTH_CONFIG_ID=your_youtube_config_id
COMPOSIO_LINKEDIN_AUTH_CONFIG_ID=your_linkedin_config_id
COMPOSIO_TWITTER_AUTH_CONFIG_ID=your_twitter_config_id
COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID=your_instagram_config_id
COMPOSIO_WORDPRESS_AUTH_CONFIG_ID=your_wordpress_config_id

# Database (optional - for production)
DATABASE_URL=postgresql://user:password@localhost/toriavey_cms

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 4. Run the Application

```bash
# Development mode with auto-reload
python src/app.py

# Or using uvicorn directly
uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access the API

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## Detailed Installation Steps

### Step 1: Clone or Download the Project

```bash
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS"
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Upgrade pip

```bash
python -m pip install --upgrade pip
```

### Step 4: Install Core Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **HTTPx** - Async HTTP client
- **SQLModel** - Database ORM
- **Composio** - Social media integrations
- **LangChain + Gemini** - LLM for content generation
- **BeautifulSoup4** - Web scraping
- **Python-dotenv** - Environment variables

### Step 5: Install Optional Dependencies

For testing:
```bash
pip install pytest pytest-asyncio httpx-mock
```

For code quality:
```bash
pip install black flake8 mypy
```

---

## Getting API Keys

### 1. Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `.env` as `GOOGLE_API_KEY`

### 2. Vizard AI API Key

1. Go to [Vizard.ai](https://vizard.ai/)
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key
5. Add to `.env` as `VIZARD_API_KEY`

### 3. Composio API Key

1. Go to [Composio](https://composio.dev/)
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key
5. Add to `.env` as `COMPOSIO_API_KEY`
6. Set up authentication configs for each social platform

---

## Verify Installation

### 1. Check Python Version

```bash
python --version
# Should be 3.9 or higher
```

### 2. Check Installed Packages

```bash
pip list
```

### 3. Run Health Check

```bash
# Start the server
python src/app.py

# In another terminal, test the health endpoint
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

### 4. Test Video Clips Endpoint

```bash
curl http://localhost:8000/api/clips/health
```

### 5. Test Content Generation Endpoint

```bash
curl http://localhost:8000/api/content/health
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError"

**Solution:**
```bash
# Ensure virtual environment is activated
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Use a different port
uvicorn src.app:app --reload --port 8001

# Or kill the process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Issue: "Import Error: No module named 'src'"

**Solution:**
```bash
# Set PYTHONPATH
# Windows
set PYTHONPATH=%CD%

# Linux/Mac
export PYTHONPATH=$(pwd)

# Or run from project root
cd "d:\desktop\work\EromoVentures Projects\ToriAveysCMS"
python src/app.py
```

### Issue: "Google API Key Invalid"

**Solution:**
- Verify the key is correct in `.env`
- Check if the key has proper permissions
- Ensure Gemini API is enabled in Google Cloud Console

### Issue: "Composio Authentication Failed"

**Solution:**
- Verify `COMPOSIO_API_KEY` is set
- Check authentication config IDs for each platform
- Ensure you've completed OAuth flow for each platform

---

## Development Setup

### Install Development Dependencies

```bash
pip install -r requirements.txt
pip install black flake8 mypy pytest pytest-asyncio
```

### Format Code

```bash
black src/
```

### Lint Code

```bash
flake8 src/
```

### Type Check

```bash
mypy src/
```

### Run Tests

```bash
pytest
```

---

## Production Deployment

### 1. Install Production Dependencies Only

```bash
pip install -r requirements.txt --no-dev
```

### 2. Set Production Environment Variables

```env
# Disable debug mode
DEBUG=False

# Use production database
DATABASE_URL=postgresql://user:password@prod-db-host/toriavey_cms

# Configure CORS for production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Run with Production Server

```bash
# Using Gunicorn with Uvicorn workers
pip install gunicorn

gunicorn src.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### 4. Use Process Manager (Recommended)

**Supervisor:**
```ini
[program:toriavey-cms]
command=/path/to/venv/bin/gunicorn src.app:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
directory=/path/to/ToriAveysCMS
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/toriavey-cms.err.log
stdout_logfile=/var/log/toriavey-cms.out.log
```

**PM2:**
```bash
pm2 start "uvicorn src.app:app --host 0.0.0.0 --port 8000" --name toriavey-cms
pm2 save
pm2 startup
```

---

## Docker Setup (Optional)

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - .:/app
    restart: unless-stopped
```

### Run with Docker

```bash
docker-compose up -d
```

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up environment variables
3. ✅ Run the application
4. 📚 Read [API_USAGE_GUIDE.md](./API_USAGE_GUIDE.md) for video clips
5. 📚 Read [CONTENT_GENERATION_GUIDE.md](./CONTENT_GENERATION_GUIDE.md) for recipe content
6. 🚀 Start generating content!

---

## Support

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **GitHub Issues**: [Report a bug or request a feature]

Happy coding! 🎉
