// Auth
export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  role: string
}

// Git Repo
export interface GitRepo {
  id: number
  application_id: number
  repo_name: string
  owner: string
  link: string
  branch: string
}

// Resource
export interface Resource {
  id: number
  application_id: number
  resource_group: string
  resource_name: string
  type: string
  tier_sku: string
}

// Role Assignment
export interface RoleAssignment {
  id: number
  application_id: number
  role: string
  assigned_to: string
  scope: string
}

// Alert
export interface Alert {
  id: number
  application_id: number
  resource_group: string
  alert_name: string
  purpose: string
  resource_applied_to: string
}

// Person
export interface Person {
  id: number
  application_id: number
  name: string
  applications_involved: string
  resource_groups_involved: string
  permissions: string
}

// Task
export interface Task {
  id: number
  application_id: number
  title: string
  description: string
  status: string
  severity: string
  assigned_to: string
  assigned_on: string | null
  created_at: string
}

// Application
export interface ApplicationSummary {
  id: number
  name: string
  description: string
  created_at: string
  git_repo_count: number
  resource_count: number
  resource_group_count: number
  people_count: number
}

export interface ApplicationDetail {
  id: number
  name: string
  description: string
  created_at: string
  git_repos: GitRepo[]
  resources: Resource[]
  role_assignments: RoleAssignment[]
  alerts: Alert[]
  people: Person[]
  tasks: Task[]
}

// Dashboard
export interface DashboardStats {
  total_applications: number
  total_repos: number
  total_resource_groups: number
  total_people: number
  total_tasks: number
  tasks_not_started: number
  tasks_in_progress: number
  tasks_completed: number
  recent_applications: ApplicationSummary[]
}
