"""Reset script — drops all entity data but keeps the admin user."""
import asyncio
from sqlalchemy import text
from app.database import async_session, engine, Base
from app.models import *  # noqa


async def reset():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Delete in dependency order (junction tables first)
        await db.execute(text("DELETE FROM person_access"))
        await db.execute(text("DELETE FROM app_people"))
        await db.execute(text("DELETE FROM app_managed_identities"))
        await db.execute(text("DELETE FROM app_repositories"))
        await db.execute(text("DELETE FROM app_resources"))
        await db.execute(text("DELETE FROM managed_identities"))
        await db.execute(text("DELETE FROM repositories"))
        await db.execute(text("DELETE FROM azure_resources"))
        await db.execute(text("DELETE FROM people"))
        await db.execute(text("DELETE FROM applications"))
        await db.commit()
        print("All entity data erased. Admin user preserved.")


if __name__ == "__main__":
    asyncio.run(reset())
