from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator, Tuple, Dict, Any
from app.core.config import settings

def normalize_database_url(raw_url: str) -> Tuple[str, Dict[str, Any]]:
    """
    Normalizes database connection strings for SQLAlchemy + asyncpg.
    Specifically adapts Neon PostgreSQL serverless URLs:
    - Replaces 'postgres://' or 'postgresql://' with 'postgresql+asyncpg://'
    - Translates libpq 'sslmode=require' query param into asyncpg connect_args={'ssl': True}
    """
    url = raw_url.strip()
    connect_args: Dict[str, Any] = {}

    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    parsed = urlparse(url)
    if parsed.query:
        query_params = parse_qs(parsed.query)
        if "sslmode" in query_params:
            sslmode_val = query_params.pop("sslmode")[0]
            if sslmode_val.lower() in ("require", "verify-ca", "verify-full"):
                connect_args["ssl"] = True
        flat_query = {k: v[0] for k, v in query_params.items()}
        new_query = urlencode(flat_query)
        url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        ))

    return url, connect_args

normalized_url, db_connect_args = normalize_database_url(settings.DATABASE_URL)

engine_kwargs: Dict[str, Any] = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}

if "sqlite" not in normalized_url:
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    })

if db_connect_args:
    engine_kwargs["connect_args"] = db_connect_args

engine = create_async_engine(normalized_url, **engine_kwargs)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

