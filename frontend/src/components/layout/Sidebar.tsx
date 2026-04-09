import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, AppWindow, Layers, GitBranch, Users, Hexagon, ClipboardList,
} from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: AppWindow, label: 'Applications' },
  { to: '/resource-groups', icon: Layers, label: 'Resource Groups' },
  { to: '/git-repos', icon: GitBranch, label: 'Git Repos' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
]

export default function Sidebar() {
  return (
    <aside className="w-[260px] bg-gradient-to-b from-[#0f0f1a] via-[#111127] to-[#0d0d1a] text-white flex flex-col min-h-screen fixed left-0 top-0 z-30 border-r border-white/[0.04]">
      {/* Logo — clickable, takes you home */}
      <Link to="/" className="flex items-center gap-3 px-6 py-6 group cursor-pointer transition-all hover:opacity-90">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-md group-hover:bg-indigo-500/50 transition" />
          <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
            <Hexagon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Hive</span>
          <p className="text-[10px] text-indigo-400/60 font-semibold -mt-0.5 tracking-wide">CONTROL PLANE</p>
        </div>
      </Link>

      <div className="px-5 mb-3">
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-300 shadow-sm shadow-indigo-500/10 border border-indigo-500/10'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot shadow-sm shadow-emerald-400/50" />
          Hive v2.0
        </div>
      </div>
    </aside>
  )
}
