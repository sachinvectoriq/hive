import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Plus, X, Trash2, ArrowRight, Filter, ChevronDown, Check, Pencil } from 'lucide-react'
import { listAllPeople, listResourceGroups, type PersonAggregate, type ResourceGroupAggregate } from '../api/aggregates'
import { listApplications, addPerson, deletePerson, updatePerson } from '../api/applications'
import type { ApplicationSummary } from '../types'

export default function People() {
  const [people, setPeople] = useState<PersonAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [appFilter, setAppFilter] = useState('all')
  const [showPanel, setShowPanel] = useState(false)

  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [resourceGroups, setResourceGroups] = useState<ResourceGroupAggregate[]>([])
  const [selectedApps, setSelectedApps] = useState<number[]>([])
  const [showAppDropdown, setShowAppDropdown] = useState(false)
  const [name, setName] = useState('')
  const [selectedRgs, setSelectedRgs] = useState<string[]>([])
  const [showRgDropdown, setShowRgDropdown] = useState(false)
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [showPermDropdown, setShowPermDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFields, setEditFields] = useState({ name: '', permissions: '' })

  const load = () => { setLoading(true); listAllPeople().then(setPeople).finally(() => setLoading(false)) }
  useEffect(load, [])
  useEffect(() => { listApplications().then(setApps) }, [])
  useEffect(() => { listResourceGroups().then(setResourceGroups) }, [])

  const toggleApp = (id: number) => setSelectedApps((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])
  const toggleRg = (name: string) => setSelectedRgs((prev) => prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name])
  const togglePerm = (p: string) => setSelectedPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const PERMISSION_OPTIONS = ['Owner', 'Contributor', 'Reader', 'User Access Administrator', 'Network Contributor', 'Storage Blob Data Contributor', 'Storage Blob Data Reader', 'Key Vault Administrator', 'Key Vault Secrets User', 'Cognitive Services User', 'Monitoring Contributor', 'Monitoring Reader', 'Log Analytics Contributor', 'Logic App Contributor', 'Custom Role']

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (selectedApps.length === 0 || !name.trim()) return
    setSubmitting(true)
    const primaryAppId = selectedApps[0]
    const appsInvolved = selectedApps.map((id) => apps.find((a) => a.id === id)?.name).filter(Boolean).join(', ')
    const rgsInvolved = selectedRgs.join(', ')
    const permsInvolved = selectedPerms.join(', ')
    await addPerson(primaryAppId, { name: name.trim(), applications_involved: appsInvolved, resource_groups_involved: rgsInvolved, permissions: permsInvolved })
    setSelectedApps([]); setName(''); setSelectedRgs([]); setSelectedPerms([]); setShowPanel(false); setSubmitting(false)
    load()
  }
  const handleDelete = async (p: PersonAggregate, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Remove "${p.name}"?`)) return
    await deletePerson(p.application_id, p.id); load()
  }

  const startEdit = (p: PersonAggregate, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setEditingId(p.id)
    setEditFields({ name: p.name, permissions: p.permissions })
  }

  const saveEdit = async (p: PersonAggregate) => {
    if (!editFields.name.trim()) return
    await updatePerson(p.application_id, p.id, { name: editFields.name.trim(), permissions: editFields.permissions.trim() })
    setEditingId(null)
    load()
  }

  const uniqueApps = Array.from(new Set(people.map((p) => p.application))).sort()

  const filtered = people.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(q) || p.application.toLowerCase().includes(q) || p.permissions.toLowerCase().includes(q)
    const matchesApp = appFilter === 'all' || p.application === appFilter
    return matchesSearch && matchesApp
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search people, applications, permissions..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
        </div>
        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none appearance-none transition">
            <option value="all">All Applications</option>
            {uniqueApps.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {appFilter !== 'all' && (
          <button onClick={() => setAppFilter('all')}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
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
                  editingId === p.id ? (
                    <div key={p.id} className="bg-white rounded-xl border-2 border-indigo-300 p-5 relative block">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                          <input type="text" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Permissions</label>
                          <input type="text" value={editFields.permissions} onChange={(e) => setEditFields({ ...editFields, permissions: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => saveEdit(p)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition cursor-pointer">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition cursor-pointer">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button onClick={(e) => startEdit(p, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDelete(p, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Link>
                  )
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
              {/* Multi-select Applications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Applications * <span className="text-gray-400 font-normal">(select one or more)</span></label>
                <div className="relative">
                  <button type="button" onClick={() => { setShowAppDropdown(!showAppDropdown); setShowRgDropdown(false) }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition">
                    <span className={selectedApps.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {selectedApps.length === 0 ? 'Select applications...' : selectedApps.map((id) => apps.find((a) => a.id === id)?.name).filter(Boolean).join(', ')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAppDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showAppDropdown && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto animate-scale-in origin-top">
                      {apps.map((a) => {
                        const selected = selectedApps.includes(a.id)
                        return (
                          <button key={a.id} type="button" onClick={() => toggleApp(a.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${selected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {a.name}
                          </button>
                        )
                      })}
                      {apps.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No applications found</p>}
                    </div>
                  )}
                </div>
                {selectedApps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedApps.map((id) => {
                      const app = apps.find((a) => a.id === id)
                      return app ? (
                        <span key={id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">
                          {app.name}
                          <button type="button" onClick={() => toggleApp(id)} className="hover:text-red-500 transition cursor-pointer"><X className="w-3 h-3" /></button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              {/* Multi-select Resource Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Groups Involved</label>
                <div className="relative">
                  <button type="button" onClick={() => { setShowRgDropdown(!showRgDropdown); setShowAppDropdown(false) }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition">
                    <span className={selectedRgs.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {selectedRgs.length === 0 ? 'Select resource groups...' : selectedRgs.join(', ')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRgDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showRgDropdown && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto animate-scale-in origin-top">
                      {resourceGroups.map((rg) => {
                        const selected = selectedRgs.includes(rg.name)
                        return (
                          <button key={rg.name} type="button" onClick={() => toggleRg(rg.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${selected ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${selected ? 'bg-sky-600 border-sky-600' : 'border-gray-300'}`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{rg.name}</span>
                            <span className="ml-auto text-[10px] text-gray-400">{rg.resources.length} resources</span>
                          </button>
                        )
                      })}
                      {resourceGroups.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No resource groups found</p>}
                    </div>
                  )}
                </div>
                {selectedRgs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedRgs.map((rg) => (
                      <span key={rg} className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg font-medium">
                        {rg}
                        <button type="button" onClick={() => toggleRg(rg)} className="hover:text-red-500 transition cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Permissions</label>
                <div className="relative">
                  <button type="button" onClick={() => { setShowPermDropdown(!showPermDropdown); setShowAppDropdown(false); setShowRgDropdown(false) }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition">
                    <span className={selectedPerms.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                      {selectedPerms.length === 0 ? 'Select permissions...' : selectedPerms.join(', ')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPermDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showPermDropdown && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto animate-scale-in origin-top">
                      {PERMISSION_OPTIONS.map((perm) => {
                        const selected = selectedPerms.includes(perm)
                        return (
                          <button key={perm} type="button" onClick={() => togglePerm(perm)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${selected ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${selected ? 'bg-amber-600 border-amber-600' : 'border-gray-300'}`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {perm}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                {selectedPerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedPerms.map((perm) => (
                      <span key={perm} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium">
                        {perm}
                        <button type="button" onClick={() => togglePerm(perm)} className="hover:text-red-500 transition cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPanel(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting || selectedApps.length === 0 || !name.trim()}
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
