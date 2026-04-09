import { supabase } from '../lib/supabase'
import type {
  ApplicationSummary,
  ApplicationDetail,
  GitRepo,
  Resource,
  RoleAssignment,
  Alert,
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

  const [repos, resources, roles, alerts, ppl, tks] = await Promise.all([
    supabase.from('git_repos').select('*').eq('application_id', id),
    supabase.from('resources').select('*').eq('application_id', id),
    supabase.from('role_assignments').select('*').eq('application_id', id),
    supabase.from('alerts').select('*').eq('application_id', id),
    supabase.from('people').select('*').eq('application_id', id),
    supabase.from('tasks').select('*').eq('application_id', id).order('created_at', { ascending: false }),
  ])

  return {
    ...app,
    git_repos: repos.data ?? [],
    resources: resources.data ?? [],
    role_assignments: roles.data ?? [],
    alerts: alerts.data ?? [],
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
  return { ...data, git_repos: [], resources: [], role_assignments: [], alerts: [], people: [], tasks: [] } as ApplicationDetail
}

export async function updateApplication(id: number, body: Partial<{ name: string; description: string }>): Promise<void> {
  const { error } = await supabase.from('applications').update(body).eq('id', id)
  if (error) throw error
}

export async function deleteApplication(id: number): Promise<void> {
  // Delete children first (cascade not automatic via API)
  await Promise.all([
    supabase.from('git_repos').delete().eq('application_id', id),
    supabase.from('resources').delete().eq('application_id', id),
    supabase.from('role_assignments').delete().eq('application_id', id),
    supabase.from('alerts').delete().eq('application_id', id),
    supabase.from('people').delete().eq('application_id', id),
    supabase.from('tasks').delete().eq('application_id', id),
  ])
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw error
}

// Git Repos
export async function addGitRepo(_appId: number, body: { repo_name: string; owner?: string; link?: string; branch?: string }): Promise<GitRepo> {
  const { data, error } = await supabase
    .from('git_repos')
    .insert({ application_id: _appId, repo_name: body.repo_name, owner: body.owner ?? '', link: body.link ?? '', branch: body.branch ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as GitRepo
}

export async function updateGitRepo(_appId: number, repoId: number, body: Partial<{ repo_name: string; owner: string; link: string; branch: string }>): Promise<GitRepo> {
  const { data, error } = await supabase.from('git_repos').update(body).eq('id', repoId).select().single()
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

export async function updateResource(_appId: number, resourceId: number, body: Partial<{ resource_group: string; resource_name: string; type: string; tier_sku: string }>): Promise<Resource> {
  const { data, error } = await supabase.from('resources').update(body).eq('id', resourceId).select().single()
  if (error) throw error
  return data as Resource
}

export async function deleteResource(_appId: number, resourceId: number): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', resourceId)
  if (error) throw error
}

// Role Assignments
export async function addRoleAssignment(appId: number, body: { role: string; assigned_to?: string; scope?: string }): Promise<RoleAssignment> {
  const { data, error } = await supabase
    .from('role_assignments')
    .insert({ application_id: appId, role: body.role, assigned_to: body.assigned_to ?? '', scope: body.scope ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as RoleAssignment
}

export async function updateRoleAssignment(_appId: number, roleId: number, body: Partial<{ role: string; assigned_to: string; scope: string }>): Promise<RoleAssignment> {
  const { data, error } = await supabase.from('role_assignments').update(body).eq('id', roleId).select().single()
  if (error) throw error
  return data as RoleAssignment
}

export async function deleteRoleAssignment(_appId: number, roleId: number): Promise<void> {
  const { error } = await supabase.from('role_assignments').delete().eq('id', roleId)
  if (error) throw error
}

// Alerts
export async function addAlert(appId: number, body: { resource_group: string; alert_name: string; purpose?: string; resource_applied_to?: string }): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert({ application_id: appId, resource_group: body.resource_group, alert_name: body.alert_name, purpose: body.purpose ?? '', resource_applied_to: body.resource_applied_to ?? '' })
    .select()
    .single()
  if (error) throw error
  return data as Alert
}

export async function updateAlert(_appId: number, alertId: number, body: Partial<{ resource_group: string; alert_name: string; purpose: string; resource_applied_to: string }>): Promise<Alert> {
  const { data, error } = await supabase.from('alerts').update(body).eq('id', alertId).select().single()
  if (error) throw error
  return data as Alert
}

export async function deleteAlert(_appId: number, alertId: number): Promise<void> {
  const { error } = await supabase.from('alerts').delete().eq('id', alertId)
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

export async function updatePerson(_appId: number, personId: number, body: Partial<{ name: string; applications_involved: string; resource_groups_involved: string; permissions: string }>): Promise<Person> {
  const { data, error } = await supabase.from('people').update(body).eq('id', personId).select().single()
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

// Bulk delete a resource group (all resources, alerts, and role assignments scoped to it)
export async function deleteResourceGroup(rgName: string): Promise<void> {
  await Promise.all([
    supabase.from('resources').delete().eq('resource_group', rgName),
    supabase.from('alerts').delete().eq('resource_group', rgName),
    supabase.from('role_assignments').delete().eq('scope', rgName),
  ])
}

// Resource Types (static list - no backend needed)
export async function listResourceTypes(): Promise<string[]> {
  return [
    "Azure App Service (Web app)",
    "App Service Plan",
    "Static Web App",
    "Azure CosmosDB for PostgreSQL Cluster",
    "Azure Cosmos DB database",
    "Storage Account",
    "AI Search",
    "Azure AI Foundry",
    "Azure AI services multi-service account",
    "Computer vision",
    "Logic App",
    "Application Insights",
    "Log Analytics Workspace",
    "Translator",
    "Document intelligence",
  ]
}
