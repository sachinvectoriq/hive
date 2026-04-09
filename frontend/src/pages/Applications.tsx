import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, AppWindow, GitBranch, Layers, Users, Search, X, Trash2, ArrowRight } from 'lucide-react'
import { listApplications, createApplication, deleteApplication } from '../api/applications'
import type { ApplicationSummary } from '../types'

export default function Applications() {
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); listApplications().then(setApps).finally(() => setLoading(false)) }
  useEffect(load, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await createApplication({ name: name.trim(), description: description.trim() })
    setName(''); setDescription(''); setShowCreate(false); load()
  }

  const handleDelete = async (id: number, appName: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Delete "${appName}"? This will remove all associated data.`)) return
    await deleteApplication(id); load()
  }

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">{apps.length} applications in your portfolio</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-indigo-200 cursor-pointer">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center"><AppWindow className="w-8 h-8 text-indigo-400" /></div>
          <p className="text-lg font-semibold text-gray-900">No applications found</p>
          <p className="text-sm text-gray-500 mt-1">{search ? 'Try a different search term' : 'Create your first application to get started'}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
              <Plus className="w-4 h-4" /> New Application
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app, i) => (
            <Link key={app.id} to={`/applications/${app.id}`}
              className={`bg-white rounded-2xl border border-gray-200 p-5 card-hover group relative block animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl group-hover:bg-indigo-100 transition shrink-0">
                  <AppWindow className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{app.description || 'No description'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition shrink-0 mt-0.5" />
              </div>
              <div className="flex gap-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5 text-emerald-500" /> {app.git_repo_count} repos</span>
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-sky-500" /> {app.resource_group_count} resource groups</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-500" /> {app.people_count} people</span>
              </div>
              <button onClick={(e) => handleDelete(app.id, app.name, e)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New Application</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create a new application to manage its resources</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI Chat Platform" required autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this application do?" rows={4}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition" />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={!name.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer">
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
