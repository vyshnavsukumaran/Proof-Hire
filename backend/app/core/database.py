from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

is_sqlite = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {
    "prepare_threshold": None,
}

engine = create_engine(settings.database_url, connect_args=connect_args)

if settings.db_schema and not is_sqlite:
    @event.listens_for(engine, "connect")
    def set_search_path(dbapi_conn, connection_record):
        cur = dbapi_conn.cursor()
        cur.execute(f"SET search_path TO {settings.db_schema}")
        cur.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
