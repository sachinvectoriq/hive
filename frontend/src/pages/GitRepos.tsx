import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, ExternalLink, Search, Plus, X, Trash2, Filter, ChevronDown, Check } from 'lucide-react'
import { listAllGitRepos, type GitRepoAggregate } from '../api/aggregates'
import { listApplications, addGitRepo, deleteGitRepo } from '../api/applications'
import type { ApplicationSummary } from '../types'

export default function GitRepos() {
  const [repos, setRepos] = useState<GitRepoAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [showAppDD, setShowAppDD] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [selectedApp, setSelectedApp] = useState<number | ''>('')
  const [repoName, setRepoName] = useState('')
  const [owner, setOwner] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => { setLoading(true); listAllGitRepos().then(setRepos).finally(() => setLoading(false)) }
  useEffect(load, [])
  useEffect(() => { listApplications().then(setApps) }, [])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !repoName.trim()) return
    setSubmitting(true)
    await addGitRepo(Number(selectedApp), { repo_name: repoName.trim(), owner: owner.trim(), link: link.trim() })
    setSelectedApp(''); setRepoName(''); setOwner(''); setLink(''); setShowPanel(false); setSubmitting(false)
    load()
  }
  const handleDelete = async (r: GitRepoAggregate) => {
    if (!confirm(`Delete repository "${r.repo_name}"?`)) return
    await deleteGitRepo(r.application_id, r.id); load()
  }

  const uniqueApps = Array.from(new Set(repos.map((r) => r.application))).sort()
  const toggleApp = (a: string) => setSelectedApps((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const filtered = repos.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch = r.repo_name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.application.toLowerCase().includes(q)
    const matchesApp = selectedApps.length === 0 || selectedApps.includes(r.application)
    return matchesSearch && matchesApp
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Git Repositories</h1>
          <p className="text-sm text-gray-500 mt-1">{repos.length} repositories across all applications</p>
        </div>
        <button onClick={() => setShowPanel(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-indigo-200 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Repository
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search repos, owners, applications..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
        </div>
        <div className="relative">
          <button type="button" onClick={() => setShowAppDD(!showAppDD)}
            className="flex items-center gap-2 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <span className={selectedApps.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
              {selectedApps.length === 0 ? 'All Applications' : `${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''}`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showAppDD ? 'rotate-180' : ''}`} />
          </button>
          {showAppDD && (
            <div className="absolute z-30 left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto min-w-[220px] animate-scale-in origin-top-left">
              {uniqueApps.map((a) => {
                const sel = selectedApps.includes(a)
                return (
                  <button key={a} type="button" onClick={() => toggleApp(a)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${sel ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {sel && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{a}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {selectedApps.length > 0 && (
          <button onClick={() => setSelectedApps([])}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center"><GitBranch className="w-8 h-8 text-emerald-400" /></div>
          <p className="text-lg font-semibold text-gray-900">No repositories found</p>
          <p className="text-sm text-gray-500 mt-1">{search ? 'Try a different search term' : 'Add your first repository to get started'}</p>
          {!search && (
            <button onClick={() => setShowPanel(true)} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
              <Plus className="w-4 h-4" /> Add Repository
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Repository</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Application</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Link</th>
                <th className="px-5 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0"><GitBranch className="w-4 h-4 text-emerald-600" /></div>
                      <span className="font-medium text-gray-900">{r.repo_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{r.owner || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4">
                    <Link to={`/applications/${r.application_id}`} className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition font-medium">
                      {r.application}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </a>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(r)} className="text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowPanel(false); setSubmitting(false) }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New Repository</h2>
                <p className="text-xs text-gray-400 mt-0.5">Link a Git repository to an application</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Application *</label>
                <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value ? Number(e.target.value) : '')} required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition">
                  <option value="">Select application...</option>
                  {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Repository Name *</label>
                <input type="text" placeholder="e.g. my-app-frontend" value={repoName} onChange={(e) => setRepoName(e.target.value)} required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner</label>
                <input type="text" placeholder="e.g. my-org" value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Link (URL)</label>
                <input type="text" placeholder="https://github.com/..." value={link} onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPanel(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting || !selectedApp || !repoName.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer">
                  {submitting ? 'Adding...' : 'Add Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
