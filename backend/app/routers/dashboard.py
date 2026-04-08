from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application, GitRepo, Resource, Person, Task
from sqlalchemy import distinct
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.application import DashboardStats, ApplicationListResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    apps_q = await db.execute(select(func.count(Application.id)))
    repos_q = await db.execute(select(func.count(GitRepo.id)))
    resources_q = await db.execute(select(func.count(distinct(Resource.resource_group))))
    people_q = await db.execute(select(func.count(Person.id)))
    tasks_q = await db.execute(select(func.count(Task.id)))
    tasks_ns = await db.execute(select(func.count(Task.id)).where(Task.status == "not-started"))
    tasks_ip = await db.execute(select(func.count(Task.id)).where(Task.status == "in-progress"))
    tasks_done = await db.execute(select(func.count(Task.id)).where(Task.status == "completed"))

    recent_q = await db.execute(
        select(Application).order_by(Application.created_at.desc()).limit(5)
    )
    recent = recent_q.scalars().all()

    return DashboardStats(
        total_applications=apps_q.scalar() or 0,
        total_repos=repos_q.scalar() or 0,
        total_resource_groups=resources_q.scalar() or 0,
        total_people=people_q.scalar() or 0,
        total_tasks=tasks_q.scalar() or 0,
        tasks_not_started=tasks_ns.scalar() or 0,
        tasks_in_progress=tasks_ip.scalar() or 0,
        tasks_completed=tasks_done.scalar() or 0,
        recent_applications=[
            ApplicationListResponse(
                id=a.id,
                name=a.name,
                description=a.description,
                created_at=a.created_at,
                git_repo_count=len(a.git_repos),
                resource_count=len(a.resources),
                people_count=len(a.people),
            )
            for a in recent
        ],
    )
