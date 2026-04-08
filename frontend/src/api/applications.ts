import { supabase } from '../lib/supabase'
import type {
  ApplicationSummary,
  ApplicationDetail,
  GitRepo,
  Resource,
  RoleAssignment,
  Person,
  Task,
} from '../types'

// Application CRUD
export async function listApplications(): Promise<ApplicationSummary[]> {
  const { data, error } = await supabase
    .from('application_summaries')
    .select('*')
  if (error) throw error
  return data as ApplicationSummary[]
}

export async function getApplication(id: number): Promise<ApplicationDetail> {
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()
  if (appErr) throw appErr

  const [repos, resources, roles, ppl, tks] = await Promise.all([
    supabase.from('git_repos').select('*').eq('application_id', id),
    supabase.from('resources').select('*').eq('application_id', id),
    supabase.from('role_assignments').select('*').eq('application_id', id),
    supabase.from('people').select('*').eq('application_id', id),
    supabase.from('tasks').select('*').eq('application_id', id).order('created_at', { ascending: false }),
  ])

  return {
    ...app,
    git_repos: repos.data ?? [],
    resources: resources.data ?? [],
    role_assignments: roles.data ?? [],
    people: ppl.data ?? [],
    tasks: tks.data ?? [],
  } as ApplicationDetail
}

export async function createApplication(body: { name: string; description?: string }): Promise<ApplicationDetail> {
  const { data, error } = await supabase
    .from('applications')
    .insert({ name: body.name, description: body.description ?? '' })
    .select()
    .single()
  if (error) throw error
  return { ...data, git_repos: [], resources: [], role_assignments: [], people: [], tasks: [] } as ApplicationDetail
}

export async function deleteApplication(id: number): Promise<void> {
  // Delete children first (cascade not automatic via API)
  await Promise.all([
    supabase.from('git_repos').delete().eq('application_id', id),
    supabase.from('resources').delete().eq('application_id', id),
    supabase.from('role_assignments').delete().eq('application_id', id),
    supabase.from('people').delete().eq('application_id', id),
    supabase.from('tasks').delete().eq('application_id', id),
  ])
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw error
}

// Git Repos
export async function addGitRepo(_appId: number, body: { repo_name: string; owner?: string; link?: string }): Promise<GitRepo> {
  const { data, error } = await supabase
    .from('git_repos')
    .insert({ application_id: _appId, repo_name: body.repo_name, owner: body.owner ?? '', link: body.link ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as GitRepo
}

export async function deleteGitRepo(_appId: number, repoId: number): Promise<void> {
  const { error } = await supabase.from('git_repos').delete().eq('id', repoId)
  if (error) throw error
}

// Resources
export async function addResource(appId: number, body: { resource_group: string; resource_name: string; type?: string; tier_sku?: string }): Promise<Resource> {
  const { data, error } = await supabase
    .from('resources')
    .insert({ application_id: appId, resource_group: body.resource_group, resource_name: body.resource_name, type: body.type ?? '', tier_sku: body.tier_sku ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as Resource
}

export async function deleteResource(_appId: number, resourceId: number): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', resourceId)
  if (error) throw error
}

// Role Assignments
export async function addRoleAssignment(appId: number, body: { resource_group: string; role_name: string; resource_name?: string }): Promise<RoleAssignment> {
  const { data, error } = await supabase
    .from('role_assignments')
    .insert({ application_id: appId, resource_group: body.resource_group, role_name: body.role_name, resource_name: body.resource_name ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as RoleAssignment
}

export async function deleteRoleAssignment(_appId: number, roleId: number): Promise<void> {
  const { error } = await supabase.from('role_assignments').delete().eq('id', roleId)
  if (error) throw error
}

// People
export async function addPerson(appId: number, body: { name: string; applications_involved?: string; resource_groups_involved?: string; permissions?: string }): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert({ application_id: appId, name: body.name, applications_involved: body.applications_involved ?? '', resource_groups_involved: body.resource_groups_involved ?? '', permissions: body.permissions ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as Person
}

export async function deletePerson(_appId: number, personId: number): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', personId)
  if (error) throw error
}

// Tasks
export async function addTask(appId: number, body: { title: string; description?: string; status?: string; severity?: string; assigned_to?: string; assigned_on?: string | null }): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      application_id: appId,
      title: body.title,
      description: body.description ?? '',
      status: body.status ?? 'not-started',
      severity: body.severity ?? 'medium',
      assigned_to: body.assigned_to ?? '',
      assigned_on: body.assigned_on ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(_appId: number, taskId: number, body: Partial<{ title: string; description: string; status: string; severity: string; assigned_to: string; assigned_on: string | null }>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', taskId)
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(_appId: number, taskId: number): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

// Resource Types (static list - no backend needed)
export async function listResourceTypes(): Promise<string[]> {
  return [
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
}
