import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AppWindow, GitBranch, Layers, Users, ArrowRight,
  Circle, Loader2, CheckCircle2, TrendingUp,
} from 'lucide-react'
import { getDashboardStats } from '../api/dashboard'
import type { DashboardStats } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  useEffect(() => { getDashboardStats().then(setStats) }, [])

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  const pct = stats.total_tasks > 0 ? Math.round((stats.tasks_completed / stats.total_tasks) * 100) : 0

  const cards = [
    { label: 'Applications', value: stats.total_applications, icon: AppWindow, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600', link: '/applications' },
    { label: 'Git Repositories', value: stats.total_repos, icon: GitBranch, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', link: '/git-repos' },
    { label: 'Resource Groups', value: stats.total_resource_groups, icon: Layers, gradient: 'from-sky-500 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-600', link: '/resource-groups' },
    { label: 'People', value: stats.total_people, icon: Users, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600', link: '/people' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 rounded-2xl p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Welcome to Hive</h1>
          <p className="mt-1.5 text-indigo-100 max-w-lg">Manage your applications, Azure resources, and team access — all in one place.</p>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute right-12 bottom-6 opacity-10">
          <TrendingUp className="w-32 h-32" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Link key={c.label} to={c.link}
            className={`bg-white rounded-2xl border border-gray-200 p-5 card-hover group animate-fade-in stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1.5">{c.value}</p>
              </div>
              <div className={`${c.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <c.icon className={`w-6 h-6 ${c.text}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-indigo-500 transition">
              View all <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Tasks Overview + Recent Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Task Progress</h2>
            <Link to="/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>

          {/* Circular progress */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#gradient)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${pct * 3.27} 327`} className="animate-progress-fill" />
                <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{pct}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Circle className="w-3 h-3 text-slate-400" /><span className="text-gray-600">Not Started</span></div>
              <span className="font-semibold text-gray-900">{stats.tasks_not_started}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Loader2 className="w-3 h-3 text-blue-500" /><span className="text-gray-600">In Progress</span></div>
              <span className="font-semibold text-blue-600">{stats.tasks_in_progress}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-gray-600">Completed</span></div>
              <span className="font-semibold text-emerald-600">{stats.tasks_completed}</span>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {stats.recent_applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AppWindow className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_applications.map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition group">
                  <div className="bg-indigo-50 p-2.5 rounded-xl group-hover:bg-indigo-100 transition shrink-0">
                    <AppWindow className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{app.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{app.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 shrink-0">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {app.git_repo_count}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {app.resource_count}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {app.people_count}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
