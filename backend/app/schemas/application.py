from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# --- Git Repo ---
class GitRepoCreate(BaseModel):
    repo_name: str
    owner: str = ""
    link: str = ""

class GitRepoResponse(BaseModel):
    id: int
    application_id: int
    repo_name: str
    owner: str
    link: str
    model_config = {"from_attributes": True}


# --- Resource ---
class ResourceCreate(BaseModel):
    resource_group: str
    resource_name: str
    type: str = ""
    tier_sku: str = ""

class ResourceResponse(BaseModel):
    id: int
    application_id: int
    resource_group: str
    resource_name: str
    type: str
    tier_sku: str
    model_config = {"from_attributes": True}


# --- Role Assignment ---
class RoleAssignmentCreate(BaseModel):
    resource_group: str
    role_name: str
    resource_name: str = ""

class RoleAssignmentResponse(BaseModel):
    id: int
    application_id: int
    resource_group: str
    role_name: str
    resource_name: str
    model_config = {"from_attributes": True}


# --- Person ---
class PersonCreate(BaseModel):
    name: str
    applications_involved: str = ""
    resource_groups_involved: str = ""
    permissions: str = ""

class PersonResponse(BaseModel):
    id: int
    application_id: int
    name: str
    applications_involved: str
    resource_groups_involved: str
    permissions: str
    model_config = {"from_attributes": True}


# --- Task ---
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "not-started"
    severity: str = "medium"
    assigned_to: str = ""
    assigned_on: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_on: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    application_id: int
    title: str
    description: str
    status: str
    severity: str
    assigned_to: str
    assigned_on: Optional[datetime]
    created_at: datetime
    model_config = {"from_attributes": True}


# --- Application ---
class ApplicationCreate(BaseModel):
    name: str
    description: str = ""

class ApplicationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class ApplicationListResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    git_repo_count: int = 0
    resource_count: int = 0
    people_count: int = 0
    model_config = {"from_attributes": True}

class ApplicationDetailResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    git_repos: list[GitRepoResponse] = []
    resources: list[ResourceResponse] = []
    role_assignments: list[RoleAssignmentResponse] = []
    people: list[PersonResponse] = []
    tasks: list[TaskResponse] = []
    model_config = {"from_attributes": True}


# --- Dashboard ---
class DashboardStats(BaseModel):
    total_applications: int
    total_repos: int
    total_resource_groups: int
    total_people: int
    total_tasks: int = 0
    tasks_not_started: int = 0
    tasks_in_progress: int = 0
    tasks_completed: int = 0
    recent_applications: list[ApplicationListResponse] = []
