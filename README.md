# 🧠 Content Management Backend (FastAPI)

## Overview
This backend powers the automated content management and social posting system.  
It integrates with WordPress, YouTube, and AI video generation tools to suggest and automate daily content publication.

---

## 🏗️ Project Structure


backend/
│
├── .gitignore
├── README.md
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env
│
├── src/
│   ├── app.py
│   ├── main.py
│   │
│   ├── controllers/
│   │   ├── query_controller.py
│   │   ├── post_controller.py
│   │   ├── media_controller.py
│   │   ├── user_controller.py
│   │   └── scheduler_controller.py
│   │
│   ├── domain/
│   │   ├── models/
│   │   │   ├── llm_selection.py
│   │   │   ├── user_model.py
│   │   │   ├── media_model.py
│   │   │   ├── post_model.py
│   │   │   └── task_model.py
│   │   ├── schemas/
│   │   │   ├── request_schemas.py
│   │   │   └── response_schemas.py
│   │   └── enums/
│   │       └── role_enum.py
│   │
│   ├── infrastructure/
│   │   ├── apis/
│   │   │   ├── __init__.py
│   │   │   ├── wordpress_api.py
│   │   │   ├── youtube_api.py
│   │   │   ├── twitter_api.py
│   │   │   ├── instagram_api.py
│   │   │   └── vizard_api.py
│   │   │
│   │   ├── llm/
│   │   │   ├── llm_interface.py
│   │   │   ├── chatgpt_llm.py
│   │   │   ├── claude_llm.py
│   │   │   ├── gemini_llm.py
│   │   │   └── llm_list.py
│   │   │
│   │   ├── repository/
│   │   │   ├── db_config.py
│   │   │   ├── media_repo.py
│   │   │   ├── post_repo.py
│   │   │   └── user_repo.py
│   │   │
│   │   ├── cache/
│   │   │   └── redis_client.py
│   │   │
│   │   ├── storage/
│   │   │   └── s3_client.py
│   │   │
│   │   └── scheduler/
│   │       ├── celery_worker.py
│   │       └── cron_tasks.py
│   │
│   ├── use_cases/
│   │   ├── route_query.py
│   │   ├── post_content.py
│   │   ├── schedule_posting.py
│   │   ├── manage_user_roles.py
│   │   └── handle_notifications.py
│   │
│   ├── utils/
│   │   ├── config.py
│   │   ├── logger.py
│   │   ├── helpers.py
│   │   └── constants.py
│   │
│   ├── tests/
│   │   ├── test_controllers/
│   │   ├── test_use_cases/
│   │   ├── test_infrastructure/
│   │   └── conftest.py
│   │
│   └── __init__.py
│
└── scripts/
    ├── init_db.py
    ├── run_dev.sh
    └── deploy.sh

### Root Files
| File | Description |
|------|--------------|
| `.gitignore` | Standard Git ignore file |
| `requirements.txt` | Python dependencies |
| `.env` | Environment variables (DB, API keys, etc.) |
| `Dockerfile` | Container build configuration |
| `docker-compose.yml` | Orchestrates services like DB, Redis, Celery |
| `README.md` | Project documentation |

---

### `src/app.py`
Main entry point for the FastAPI server — initializes app, middleware, and routers.

### `src/main.py`
Application bootstrap — imports all controllers and registers routes.

---

## 🧩 Core Folders

### `controllers/`
Handles HTTP routes and connects API requests to use cases.
- `query_controller.py`: Handles dashboard and analytics queries.
- `post_controller.py`: Create and manage social posts.
- `media_controller.py`: Uploads, thumbnails, and media metadata.
- `user_controller.py`: Authentication and role management.
- `scheduler_controller.py`: Manual triggers for automated jobs.

---

### `domain/`
Defines **business models**, **schemas**, and **enums**.
- `models/`: Database entities (SQLModel/SQLAlchemy)
- `schemas/`: Request/response validation using Pydantic
- `enums/`: Defines constants (e.g. User roles)

---

### `infrastructure/`
Handles external dependencies.
- `apis/`: Integrations with WordPress, YouTube, Instagram, etc.
- `llm/`: Abstractions for AI-based text/video generation.
- `repository/`: Data access logic.
- `cache/`: Redis-based caching and queues.
- `storage/`: S3 client for media storage.
- `scheduler/`: Celery-based background task management.

---

### `use_cases/`
Implements core business logic.
- `route_query.py`: Handles request routing and validation.
- `post_content.py`: Prepares social media post suggestions.
- `schedule_posting.py`: Automates daily tasks.
- `manage_user_roles.py`: Role-based permissions.
- `handle_notifications.py`: Reminder and notification logic.

---

### `utils/`
Common utilities.
- `config.py`: Environment variable loading.
- `logger.py`: Logging configuration.
- `helpers.py`: Helper functions.
- `constants.py`: Shared constants.

---

### `tests/`
Unit and integration tests for every layer.

---

### `scripts/`
Automation scripts for developers.
- `init_db.py`: Initializes DB schema.
- `run_dev.sh`: Runs app locally.
- `deploy.sh`: Deployment automation.

---

## 🧰 Tech Stack
- **Backend Framework:** FastAPI  
- **ORM:** SQLModel / SQLAlchemy  
- **Cache / Queue:** Redis  
- **Scheduler:** Celery  
- **Storage:** AWS S3 / MinIO  
- **Auth:** JWT-based  
- **Integrations:** WordPress API, YouTube API, Instagram, X, Vizard.ai  

---

## 🚀 Run Locally
```bash
# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn src.app:app --reload
