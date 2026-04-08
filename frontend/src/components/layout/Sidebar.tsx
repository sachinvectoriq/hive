import { NavLink } from 'react-router-dom'
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
    <aside className="w-[260px] bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white flex flex-col min-h-screen fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="bg-indigo-500/20 p-2 rounded-xl">
          <Hexagon className="w-7 h-7 text-indigo-400" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">Hive</span>
          <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Resource Manager</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 shadow-sm shadow-indigo-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          Hive v2.0
        </div>
      </div>
    </aside>
  )
}
