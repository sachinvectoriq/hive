import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-[64px] bg-white/70 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-end px-8 gap-4 sticky top-0 z-20 shadow-sm shadow-gray-100/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-gray-50 to-gray-100/80 rounded-xl border border-gray-200/60">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-indigo-500/20">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-[13px] font-semibold text-gray-700">{user?.email}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-red-500 transition px-2.5 py-2 rounded-xl hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
