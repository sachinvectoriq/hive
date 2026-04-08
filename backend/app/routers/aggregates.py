from fastapi import APIRouter, Depends
from sqlalchemy import select, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application, GitRepo, Resource, RoleAssignment, Person, Task
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.application import GitRepoResponse, ResourceResponse, RoleAssignmentResponse, PersonResponse

router = APIRouter(prefix="/api", tags=["Aggregates"])

AZURE_RESOURCE_TYPES = [
    "Microsoft.Web/sites",
    "Microsoft.Web/staticSites",
    "Microsoft.Search/searchServices",
    "Microsoft.CognitiveServices/accounts",
    "Microsoft.MachineLearningServices/workspaces",
    "Microsoft.KeyVault/vaults",
    "Microsoft.DocumentDB/databaseAccounts",
    "Microsoft.Logic/workflows",
    "Microsoft.Insights/components",
    "Microsoft.Storage/storageAccounts",
    "Microsoft.Sql/servers",
    "Microsoft.DataFactory/factories",
    "Microsoft.ContainerRegistry/registries",
    "Microsoft.ContainerApps/containerApps",
    "Microsoft.Kubernetes/connectedClusters",
    "Microsoft.Network/virtualNetworks",
    "Microsoft.Network/applicationGateways",
    "Microsoft.Network/loadBalancers",
    "Microsoft.Compute/virtualMachines",
    "Microsoft.EventHub/namespaces",
    "Microsoft.ServiceBus/namespaces",
    "Microsoft.Cache/redis",
    "Microsoft.SignalRService/SignalR",
    "Microsoft.ApiManagement/service",
    "Microsoft.DBforPostgreSQL/flexibleServers",
    "Microsoft.DBforMySQL/flexibleServers",
    "Microsoft.Monitor/accounts",
    "Microsoft.Dashboard/grafana",
    "Microsoft.ManagedIdentity/userAssignedIdentities",
    "Microsoft.Authorization/roleAssignments",
    "Microsoft.OperationalInsights/workspaces",
    "Microsoft.Cdn/profiles",
    "Microsoft.Communication/communicationServices",
    "Microsoft.BotService/botServices",
    "Microsoft.OpenAI/accounts",
    "Microsoft.CognitiveServices/AIServices",
]


@router.get("/resource-types")
async def list_resource_types(
    _: User = Depends(get_current_user),
):
    return AZURE_RESOURCE_TYPES


@router.get("/resource-groups")
async def list_resource_groups(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resource).order_by(Resource.resource_group, Resource.resource_name)
    )
    resources = result.scalars().all()

    # Also get role assignments
    roles_result = await db.execute(
        select(RoleAssignment).order_by(RoleAssignment.resource_group)
    )
    roles = roles_result.scalars().all()

    # Get app names for lookup
    apps_result = await db.execute(select(Application))
    apps_map = {a.id: a.name for a in apps_result.scalars().all()}

    # Group by resource_group
    groups: dict[str, dict] = {}
    for r in resources:
        if r.resource_group not in groups:
            groups[r.resource_group] = {"name": r.resource_group, "resources": [], "role_assignments": [], "applications": set()}
        groups[r.resource_group]["resources"].append({
            "id": r.id,
            "application_id": r.application_id,
            "resource_name": r.resource_name,
            "type": r.type,
            "tier_sku": r.tier_sku,
            "application": apps_map.get(r.application_id, ""),
        })
        groups[r.resource_group]["applications"].add(apps_map.get(r.application_id, ""))

    for ra in roles:
        if ra.resource_group not in groups:
            groups[ra.resource_group] = {"name": ra.resource_group, "resources": [], "role_assignments": [], "applications": set()}
        groups[ra.resource_group]["role_assignments"].append({
            "id": ra.id,
            "application_id": ra.application_id,
            "role_name": ra.role_name,
            "resource_name": ra.resource_name,
            "application": apps_map.get(ra.application_id, ""),
        })
        groups[ra.resource_group]["applications"].add(apps_map.get(ra.application_id, ""))

    # Convert sets to lists for JSON
    result_list = []
    for g in sorted(groups.values(), key=lambda x: x["name"]):
        g["applications"] = sorted(g["applications"])
        result_list.append(g)

    return result_list


@router.get("/git-repos")
async def list_all_git_repos(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GitRepo).order_by(GitRepo.repo_name)
    )
    repos = result.scalars().all()

    apps_result = await db.execute(select(Application))
    apps_map = {a.id: a.name for a in apps_result.scalars().all()}

    return [
        {
            "id": r.id,
            "repo_name": r.repo_name,
            "owner": r.owner,
            "link": r.link,
            "application": apps_map.get(r.application_id, ""),
            "application_id": r.application_id,
        }
        for r in repos
    ]


@router.get("/people")
async def list_all_people(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Person).order_by(Person.name)
    )
    people = result.scalars().all()

    apps_result = await db.execute(select(Application))
    apps_map = {a.id: a.name for a in apps_result.scalars().all()}

    return [
        {
            "id": p.id,
            "name": p.name,
            "applications_involved": p.applications_involved,
            "resource_groups_involved": p.resource_groups_involved,
            "permissions": p.permissions,
            "application": apps_map.get(p.application_id, ""),
            "application_id": p.application_id,
        }
        for p in people
    ]


@router.get("/tasks")
async def list_all_tasks(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).order_by(Task.created_at.desc())
    )
    tasks = result.scalars().all()

    apps_result = await db.execute(select(Application))
    apps_map = {a.id: a.name for a in apps_result.scalars().all()}

    return [
        {
            "id": t.id,
            "application_id": t.application_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "severity": t.severity,
            "assigned_to": t.assigned_to,
            "assigned_on": t.assigned_on.isoformat() if t.assigned_on else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "application": apps_map.get(t.application_id, ""),
        }
        for t in tasks
    ]
