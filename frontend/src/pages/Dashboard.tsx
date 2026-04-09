import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AppWindow, GitBranch, Layers, Users, ArrowRight,
  Circle, Loader2, CheckCircle2, Sparkles, Zap, Shield, ClipboardList,
} from 'lucide-react'
import { getDashboardStats } from '../api/dashboard'
import type { DashboardStats } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  useEffect(() => { getDashboardStats().then(setStats) }, [])

  if (!stats) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  const pct = stats.total_tasks > 0 ? Math.round((stats.tasks_completed / stats.total_tasks) * 100) : 0

  const cards = [
    { label: 'Applications', value: stats.total_applications, icon: AppWindow, gradient: 'from-indigo-500 via-indigo-600 to-blue-600', shadow: 'shadow-indigo-500/25', ring: 'ring-indigo-400/20', bg: 'bg-indigo-50', text: 'text-indigo-600', link: '/applications' },
    { label: 'Git Repositories', value: stats.total_repos, icon: GitBranch, gradient: 'from-emerald-500 via-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/25', ring: 'ring-emerald-400/20', bg: 'bg-emerald-50', text: 'text-emerald-600', link: '/git-repos' },
    { label: 'Resource Groups', value: stats.total_resource_groups, icon: Layers, gradient: 'from-sky-500 via-sky-600 to-cyan-600', shadow: 'shadow-sky-500/25', ring: 'ring-sky-400/20', bg: 'bg-sky-50', text: 'text-sky-600', link: '/resource-groups' },
    { label: 'People', value: stats.total_people, icon: Users, gradient: 'from-violet-500 via-violet-600 to-purple-600', shadow: 'shadow-violet-500/25', ring: 'ring-violet-400/20', bg: 'bg-violet-50', text: 'text-violet-600', link: '/people' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-10 text-white hero-glow">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />

        {/* Floating orbs */}
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/[0.07] rounded-full blur-sm animate-float" />
        <div className="absolute right-32 -bottom-20 w-72 h-72 bg-purple-400/[0.06] rounded-full blur-sm animate-float-delayed" />
        <div className="absolute left-1/2 -top-10 w-40 h-40 bg-indigo-300/[0.05] rounded-full blur-sm" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.12] backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-white/90">Command Center</span>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Your infrastructure,
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 bg-clip-text text-transparent">beautifully orchestrated.</span>
            </h1>
            <p className="mt-4 text-[15px] text-indigo-100/80 leading-relaxed max-w-lg">
              Apps, Azure resources, repos, roles & alerts — unified in one powerful control plane. Built for teams that move fast.
            </p>
            <div className="flex items-center gap-6 mt-6">
              <Link to="/applications" className="group flex items-center gap-2.5 bg-white/[0.15] backdrop-blur-sm hover:bg-white/25 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                <Zap className="w-4 h-4 text-amber-300" /> Explore Apps <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 ring-2 ring-violet-600 flex items-center justify-center text-[9px] font-bold">A</div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 ring-2 ring-violet-600 flex items-center justify-center text-[9px] font-bold">B</div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-violet-600 flex items-center justify-center text-[9px] font-bold">C</div>
                </div>
                <span>{stats.total_people} team members active</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-3 opacity-60">
            <div className="flex items-center gap-3 p-3 bg-white/[0.08] backdrop-blur rounded-2xl border border-white/10">
              <Shield className="w-5 h-5 text-emerald-300" />
              <div className="text-xs"><p className="font-semibold text-white/90">{stats.total_resource_groups} Groups</p><p className="text-white/40">Managed</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/[0.08] backdrop-blur rounded-2xl border border-white/10">
              <ClipboardList className="w-5 h-5 text-amber-300" />
              <div className="text-xs"><p className="font-semibold text-white/90">{pct}% Done</p><p className="text-white/40">Tasks</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <Link key={c.label} to={c.link}
            className={`group relative bg-white rounded-2xl border border-gray-100 p-6 card-hover ring-1 ${c.ring} animate-fade-in stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{c.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${c.gradient} p-3.5 rounded-2xl shadow-lg ${c.shadow} group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                <c.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[13px] text-gray-400 group-hover:text-indigo-500 transition font-medium">
              View all <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            {/* Subtle gradient glow on hover */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
          </Link>
        ))}
      </div>

      {/* Tasks Overview + Recent Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 animate-fade-in shadow-sm shadow-gray-200/50 ring-1 ring-gray-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-bold text-gray-900">Task Progress</h2>
            <Link to="/tasks" className="text-[13px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold group">View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></Link>
          </div>

          {/* Circular progress */}
          <div className="flex items-center justify-center mb-7">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#gradient)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${pct * 3.27} 327`} className="animate-progress-fill" />
                <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-gray-900">{pct}%</span>
                <span className="text-[10px] text-gray-400 font-medium -mt-0.5">Complete</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2.5"><Circle className="w-3 h-3 text-slate-400" /><span className="text-gray-600">Not Started</span></div>
              <span className="font-bold text-gray-900">{stats.tasks_not_started}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2.5"><Loader2 className="w-3 h-3 text-blue-500" /><span className="text-gray-600">In Progress</span></div>
              <span className="font-bold text-blue-600">{stats.tasks_in_progress}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-gray-600">Completed</span></div>
              <span className="font-bold text-emerald-600">{stats.tasks_completed}</span>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-7 animate-fade-in stagger-2 shadow-sm shadow-gray-200/50 ring-1 ring-gray-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-bold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-[13px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold group">View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></Link>
          </div>
          {stats.recent_applications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <AppWindow className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-[13px]">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_applications.map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/30 transition-all group border border-transparent hover:border-indigo-100/60">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2.5 rounded-xl group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all shrink-0">
                    <AppWindow className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-[14px]">{app.name}</h3>
                    <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{app.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-4 text-[12px] text-gray-400 shrink-0">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {app.git_repo_count}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {app.resource_count}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {app.people_count}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-all shrink-0 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
