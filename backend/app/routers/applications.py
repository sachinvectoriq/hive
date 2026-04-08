from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application, GitRepo, Resource, RoleAssignment, Person, Task
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate,
    ApplicationListResponse, ApplicationDetailResponse,
    GitRepoCreate, GitRepoResponse,
    ResourceCreate, ResourceResponse,
    RoleAssignmentCreate, RoleAssignmentResponse,
    PersonCreate, PersonResponse,
    TaskCreate, TaskUpdate, TaskResponse,
)

router = APIRouter(prefix="/api/applications", tags=["Applications"])


# ── Application CRUD ──────────────────────────────────────────

@router.get("", response_model=list[ApplicationListResponse])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).order_by(Application.created_at.desc()))
    apps = result.scalars().all()
    return [
        ApplicationListResponse(
            id=app.id,
            name=app.name,
            description=app.description,
            created_at=app.created_at,
            git_repo_count=len(app.git_repos),
            resource_count=len(app.resources),
            people_count=len(app.people),
        )
        for app in apps
    ]


@router.post("", response_model=ApplicationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    body: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    app = Application(name=body.name, description=body.description)
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return app


@router.get("/{app_id}", response_model=ApplicationDetailResponse)
async def get_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/{app_id}", response_model=ApplicationDetailResponse)
async def update_application(
    app_id: int,
    body: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if body.name is not None:
        app.name = body.name
    if body.description is not None:
        app.description = body.description
    await db.flush()
    await db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)


# ── Git Repos ─────────────────────────────────────────────────

@router.post("/{app_id}/repos", response_model=GitRepoResponse, status_code=status.HTTP_201_CREATED)
async def add_git_repo(
    app_id: int,
    body: GitRepoCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")
    repo = GitRepo(application_id=app_id, **body.model_dump())
    db.add(repo)
    await db.flush()
    await db.refresh(repo)
    return repo


@router.delete("/{app_id}/repos/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_git_repo(
    app_id: int,
    repo_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GitRepo).where(GitRepo.id == repo_id, GitRepo.application_id == app_id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    await db.delete(repo)


# ── Resources ─────────────────────────────────────────────────

@router.post("/{app_id}/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def add_resource(
    app_id: int,
    body: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")
    resource = Resource(application_id=app_id, **body.model_dump())
    db.add(resource)
    await db.flush()
    await db.refresh(resource)
    return resource


@router.delete("/{app_id}/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    app_id: int,
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id, Resource.application_id == app_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)


# ── Role Assignments ──────────────────────────────────────────

@router.post("/{app_id}/roles", response_model=RoleAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def add_role_assignment(
    app_id: int,
    body: RoleAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")
    role = RoleAssignment(application_id=app_id, **body.model_dump())
    db.add(role)
    await db.flush()
    await db.refresh(role)
    return role


@router.delete("/{app_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role_assignment(
    app_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(RoleAssignment).where(RoleAssignment.id == role_id, RoleAssignment.application_id == app_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role assignment not found")
    await db.delete(role)


# ── People ────────────────────────────────────────────────────

@router.post("/{app_id}/people", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def add_person(
    app_id: int,
    body: PersonCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")
    person = Person(application_id=app_id, **body.model_dump())
    db.add(person)
    await db.flush()
    await db.refresh(person)
    return person


@router.delete("/{app_id}/people/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    app_id: int,
    person_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Person).where(Person.id == person_id, Person.application_id == app_id)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    await db.delete(person)


# ── Tasks ─────────────────────────────────────────────────────

@router.post("/{app_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def add_task(
    app_id: int,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")
    task = Task(application_id=app_id, **body.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.patch("/{app_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    app_id: int,
    task_id: int,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.application_id == app_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{app_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    app_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.application_id == app_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
