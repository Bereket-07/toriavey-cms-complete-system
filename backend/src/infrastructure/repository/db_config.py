from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
from src.utils.config  import settings
DB_USER = settings.db_user
DB_PASS = settings.db_password
DB_HOST = settings.db_host
DB_NAME = settings.db_name
DB_PORT = settings.db_port

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Create and return a new database session.

    NOTE: the caller owns the returned session and is responsible for closing
    it (e.g. ``db.close()`` in a finally block, or use ``get_db_session()``
    below as a context manager). The previous ``try/finally: pass`` here closed
    nothing and was removed to avoid implying otherwise.
    """
    return SessionLocal()


@contextmanager
def get_db_session():
    """Context-managed session that is always closed.

    Preferred over ``get_db()`` for new code:

        with get_db_session() as db:
            db.query(...)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
