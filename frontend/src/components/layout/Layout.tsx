import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-slate-50/80 to-indigo-50/30">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
