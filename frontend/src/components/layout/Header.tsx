import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-[60px] bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-8 gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.email}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
