import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Plus, X, Trash2, ArrowRight } from 'lucide-react'
import { listAllPeople, type PersonAggregate } from '../api/aggregates'
import { listApplications, addPerson, deletePerson } from '../api/applications'
import type { ApplicationSummary } from '../types'

export default function People() {
  const [people, setPeople] = useState<PersonAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPanel, setShowPanel] = useState(false)

  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [selectedApp, setSelectedApp] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [appsInvolved, setAppsInvolved] = useState('')
  const [rgsInvolved, setRgsInvolved] = useState('')
  const [permissions, setPermissions] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => { setLoading(true); listAllPeople().then(setPeople).finally(() => setLoading(false)) }
  useEffect(load, [])
  useEffect(() => { listApplications().then(setApps) }, [])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !name.trim()) return
    setSubmitting(true)
    await addPerson(Number(selectedApp), { name: name.trim(), applications_involved: appsInvolved.trim(), resource_groups_involved: rgsInvolved.trim(), permissions: permissions.trim() })
    setSelectedApp(''); setName(''); setAppsInvolved(''); setRgsInvolved(''); setPermissions(''); setShowPanel(false); setSubmitting(false)
    load()
  }
  const handleDelete = async (p: PersonAggregate, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Remove "${p.name}"?`)) return
    await deletePerson(p.application_id, p.id); load()
  }

  const filtered = people.filter((p) => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.application.toLowerCase().includes(q) || p.permissions.toLowerCase().includes(q)
  })

  // Group by first letter for a nicer directory feel
  const grouped = filtered.reduce<Record<string, PersonAggregate[]>>((acc, p) => {
    const letter = p.name.charAt(0).toUpperCase()
    ;(acc[letter] ??= []).push(p)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  const AVATAR_GRADIENTS = [
    'from-violet-400 to-indigo-400',
    'from-rose-400 to-pink-400',
    'from-emerald-400 to-teal-400',
    'from-amber-400 to-orange-400',
    'from-sky-400 to-blue-400',
    'from-fuchsia-400 to-purple-400',
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-500 mt-1">{people.length} team members across all applications</p>
        </div>
        <button onClick={() => setShowPanel(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-indigo-200 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search people, applications, permissions..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-violet-50 rounded-2xl flex items-center justify-center"><Users className="w-8 h-8 text-violet-400" /></div>
          <p className="text-lg font-semibold text-gray-900">No people found</p>
          <p className="text-sm text-gray-500 mt-1">{search ? 'Try a different search term' : 'Add your first team member to get started'}</p>
          {!search && (
            <button onClick={() => setShowPanel(true)} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
              <Plus className="w-4 h-4" /> Add Person
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).sort().map((letter) => (
            <div key={letter}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center">{letter}</span>
                <div className="h-px bg-gray-100 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {grouped[letter].map((p, idx) => (
                  <Link key={p.id} to={`/people/${p.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 card-hover group relative block">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                        <span className="text-xs text-indigo-600 font-medium">{p.application}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition shrink-0" />
                    </div>
                    {(p.resource_groups_involved || p.permissions) && (
                      <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-50">
                        {p.resource_groups_involved && (
                          <p className="text-xs text-gray-500 truncate"><span className="text-gray-400 font-medium">RGs:</span> {p.resource_groups_involved}</p>
                        )}
                        {p.permissions && (
                          <p className="text-xs text-gray-500 truncate"><span className="text-gray-400 font-medium">Perms:</span> {p.permissions}</p>
                        )}
                      </div>
                    )}
                    <button onClick={(e) => handleDelete(p, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowPanel(false); setSubmitting(false) }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New Person</h2>
                <p className="text-xs text-gray-400 mt-0.5">Add a team member to an application</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Applications Involved</label>
                <input type="text" placeholder="Comma-separated app names" value={appsInvolved} onChange={(e) => setAppsInvolved(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Groups Involved</label>
                <input type="text" placeholder="Comma-separated resource groups" value={rgsInvolved} onChange={(e) => setRgsInvolved(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Permissions</label>
                <textarea placeholder="e.g. Contributor on rg-prod, Reader on kv-prod" value={permissions} onChange={(e) => setPermissions(e.target.value)} rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition" />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPanel(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting || !selectedApp || !name.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer">
                  {submitting ? 'Adding...' : 'Add Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
