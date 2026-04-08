import ssl as _ssl_mod

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

_connect_args: dict = {}
if settings.DATABASE_URL.startswith("postgresql"):
    _ctx = _ssl_mod.create_default_context()
    _ctx.check_hostname = False
    _ctx.verify_mode = _ssl_mod.CERT_NONE
    _connect_args["ssl"] = _ctx

engine = create_async_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
