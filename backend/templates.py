import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s]: %(message)s:')

list_of_files = [
    ".gitignore",
    "README.md",
    "requirements.txt",
    "Dockerfile",
    "docker-compose.yml",
    ".env",

    "src/app.py",
    "src/main.py",

    # Controllers
    "src/controllers/query_controller.py",
    "src/controllers/post_controller.py",
    "src/controllers/media_controller.py",
    "src/controllers/user_controller.py",
    "src/controllers/scheduler_controller.py",

    # Domain
    "src/domain/models/llm_selection.py",
    "src/domain/models/user_model.py",
    "src/domain/models/media_model.py",
    "src/domain/models/post_model.py",
    "src/domain/models/task_model.py",
    "src/domain/schemas/request_schemas.py",
    "src/domain/schemas/response_schemas.py",
    "src/domain/enums/role_enum.py",

    # Infrastructure
    "src/infrastructure/apis/__init__.py",
    "src/infrastructure/apis/wordpress_api.py",
    "src/infrastructure/apis/youtube_api.py",
    "src/infrastructure/apis/twitter_api.py",
    "src/infrastructure/apis/instagram_api.py",
    "src/infrastructure/apis/vizard_api.py",

    "src/infrastructure/llm/llm_interface.py",
    "src/infrastructure/llm/chatgpt_llm.py",
    "src/infrastructure/llm/claude_llm.py",
    "src/infrastructure/llm/gemini_llm.py",
    "src/infrastructure/llm/llm_list.py",

    "src/infrastructure/repository/db_config.py",
    "src/infrastructure/repository/media_repo.py",
    "src/infrastructure/repository/post_repo.py",
    "src/infrastructure/repository/user_repo.py",

    "src/infrastructure/cache/redis_client.py",
    "src/infrastructure/storage/s3_client.py",

    "src/infrastructure/scheduler/celery_worker.py",
    "src/infrastructure/scheduler/cron_tasks.py",

    # Use Cases
    "src/use_cases/route_query.py",
    "src/use_cases/post_content.py",
    "src/use_cases/schedule_posting.py",
    "src/use_cases/manage_user_roles.py",
    "src/use_cases/handle_notifications.py",

    # Utils
    "src/utils/config.py",
    "src/utils/logger.py",
    "src/utils/helpers.py",
    "src/utils/constants.py",

    # Tests
    "src/tests/test_controllers/__init__.py",
    "src/tests/test_use_cases/__init__.py",
    "src/tests/test_infrastructure/__init__.py",
    "src/tests/conftest.py",

    # Scripts
    "scripts/init_db.py",
    "scripts/run_dev.sh",
    "scripts/deploy.sh",
]

for filepath in list_of_files:
    filepath = Path(filepath)
    filedir, filename = os.path.split(filepath)

    if filedir != "":
        os.makedirs(filedir, exist_ok=True)
        logging.info(f"Creating directory: {filedir} for the file: {filename}")

    if (not os.path.exists(filepath)) or (os.path.getsize(filepath) == 0):
        with open(filepath, "w") as f:
            pass
        logging.info(f"Creating empty file: {filepath}")
    else:
        logging.info(f"{filename} already exists")

logging.info("✅ Project structure created successfully!")
