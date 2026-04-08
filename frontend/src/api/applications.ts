import client from './client'
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
  const { data } = await client.get<ApplicationSummary[]>('/api/applications')
  return data
}

export async function getApplication(id: number): Promise<ApplicationDetail> {
  const { data } = await client.get<ApplicationDetail>(`/api/applications/${id}`)
  return data
}

export async function createApplication(body: { name: string; description?: string }): Promise<ApplicationDetail> {
  const { data } = await client.post<ApplicationDetail>('/api/applications', body)
  return data
}

export async function deleteApplication(id: number): Promise<void> {
  await client.delete(`/api/applications/${id}`)
}

// Git Repos
export async function addGitRepo(appId: number, body: { repo_name: string; owner?: string; link?: string }): Promise<GitRepo> {
  const { data } = await client.post<GitRepo>(`/api/applications/${appId}/repos`, body)
  return data
}

export async function deleteGitRepo(appId: number, repoId: number): Promise<void> {
  await client.delete(`/api/applications/${appId}/repos/${repoId}`)
}

// Resources
export async function addResource(appId: number, body: { resource_group: string; resource_name: string; type?: string; tier_sku?: string }): Promise<Resource> {
  const { data } = await client.post<Resource>(`/api/applications/${appId}/resources`, body)
  return data
}

export async function deleteResource(appId: number, resourceId: number): Promise<void> {
  await client.delete(`/api/applications/${appId}/resources/${resourceId}`)
}

// Role Assignments
export async function addRoleAssignment(appId: number, body: { resource_group: string; role_name: string; resource_name?: string }): Promise<RoleAssignment> {
  const { data } = await client.post<RoleAssignment>(`/api/applications/${appId}/roles`, body)
  return data
}

export async function deleteRoleAssignment(appId: number, roleId: number): Promise<void> {
  await client.delete(`/api/applications/${appId}/roles/${roleId}`)
}

// People
export async function addPerson(appId: number, body: { name: string; applications_involved?: string; resource_groups_involved?: string; permissions?: string }): Promise<Person> {
  const { data } = await client.post<Person>(`/api/applications/${appId}/people`, body)
  return data
}

export async function deletePerson(appId: number, personId: number): Promise<void> {
  await client.delete(`/api/applications/${appId}/people/${personId}`)
}

// Tasks
export async function addTask(appId: number, body: { title: string; description?: string; status?: string; severity?: string; assigned_to?: string; assigned_on?: string | null }): Promise<Task> {
  const { data } = await client.post<Task>(`/api/applications/${appId}/tasks`, body)
  return data
}

export async function updateTask(appId: number, taskId: number, body: Partial<{ title: string; description: string; status: string; severity: string; assigned_to: string; assigned_on: string | null }>): Promise<Task> {
  const { data } = await client.patch<Task>(`/api/applications/${appId}/tasks/${taskId}`, body)
  return data
}

export async function deleteTask(appId: number, taskId: number): Promise<void> {
  await client.delete(`/api/applications/${appId}/tasks/${taskId}`)
}

// Resource Types
export async function listResourceTypes(): Promise<string[]> {
  const { data } = await client.get<string[]>('/api/resource-types')
  return data
}
