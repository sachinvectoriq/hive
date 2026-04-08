import { supabase } from '../lib/supabase'

export interface ResourceGroupAggregate {
  name: string
  resources: { id: number; application_id: number; resource_name: string; type: string; tier_sku: string; application: string }[]
  role_assignments: { id: number; application_id: number; role_name: string; resource_name: string; application: string }[]
  applications: string[]
}

export interface GitRepoAggregate {
  id: number
  repo_name: string
  owner: string
  link: string
  application: string
  application_id: number
}

export interface PersonAggregate {
  id: number
  name: string
  applications_involved: string
  resource_groups_involved: string
  permissions: string
  application: string
  application_id: number
}

export interface TaskAggregate {
  id: number
  application_id: number
  title: string
  description: string
  status: string
  severity: string
  assigned_to: string
  assigned_on: string | null
  created_at: string | null
  application: string
}

export async function listResourceGroups(): Promise<ResourceGroupAggregate[]> {
  const { data, error } = await supabase.rpc('get_resource_groups')
  if (error) throw error
  return (data ?? []) as ResourceGroupAggregate[]
}

export async function listAllGitRepos(): Promise<GitRepoAggregate[]> {
  const { data, error } = await supabase.from('git_repos_with_app').select('*')
  if (error) throw error
  return data as GitRepoAggregate[]
}

export async function listAllPeople(): Promise<PersonAggregate[]> {
  const { data, error } = await supabase.from('people_with_app').select('*')
  if (error) throw error
  return data as PersonAggregate[]
}

export async function listAllTasks(): Promise<TaskAggregate[]> {
  const { data, error } = await supabase.from('tasks_with_app').select('*')
  if (error) throw error
  return data as TaskAggregate[]
}
