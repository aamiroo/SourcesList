import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base


@lru_cache
def get_engine():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set"
        )

    return create_engine(
        database_url,
        pool_pre_ping=True,
    )


@lru_cache
def get_session_local():
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
    )


def create_table():
    Base.metadata.create_all(bind=get_engine())