import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Shield, ChevronDown, ChevronRight, Search, Plus, X, Trash2, Server, Bell,
} from 'lucide-react'
import { listResourceGroups, type ResourceGroupAggregate } from '../api/aggregates'
import { listApplications, addResource, addRoleAssignment, deleteResource, deleteRoleAssignment, deleteAlert, listResourceTypes } from '../api/applications'
import type { ApplicationSummary } from '../types'

type PanelMode = 'resource' | 'role' | null

export default function ResourceGroups() {
  const [groups, setGroups] = useState<ResourceGroupAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [panelMode, setPanelMode] = useState<PanelMode>(null)

  // Form state
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  const [selectedApp, setSelectedApp] = useState<number | ''>('')
  const [rg, setRg] = useState('')
  const [resName, setResName] = useState('')
  const [resType, setResType] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [resTier, setResTier] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleAssignedTo, setRoleAssignedTo] = useState('')
  const [roleScope, setRoleScope] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listResourceGroups().then((data) => {
      setGroups(data)
      setExpanded(new Set(data.map((g) => g.name)))
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])
  useEffect(() => { listApplications().then(setApps) }, [])
  useEffect(() => { listResourceTypes().then(setResourceTypes) }, [])

  const toggle = (name: string) => setExpanded((prev) => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !rg.trim() || !resName.trim()) return
    setSubmitting(true)
    await addResource(Number(selectedApp), { resource_group: rg.trim(), resource_name: resName.trim(), type: resType.trim(), tier_sku: resTier.trim() })
    resetForm(); load()
  }
  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !roleName.trim()) return
    setSubmitting(true)
    await addRoleAssignment(Number(selectedApp), { role: roleName.trim(), assigned_to: roleAssignedTo.trim(), scope: roleScope.trim() })
    resetForm(); load()
  }
  const resetForm = () => {
    setSelectedApp(''); setRg(''); setResName(''); setResType(''); setTypeSearch(''); setResTier(''); setRoleName(''); setRoleAssignedTo(''); setRoleScope(''); setSubmitting(false); setPanelMode(null)
  }

  const handleDeleteResource = async (appId: number, resId: number) => { await deleteResource(appId, resId); load() }
  const handleDeleteRole = async (appId: number, roleId: number) => { await deleteRoleAssignment(appId, roleId); load() }
  const handleDeleteAlertItem = async (appId: number, alertId: number) => { await deleteAlert(appId, alertId); load() }

  const filtered = groups.filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.applications.some((a) => a.toLowerCase().includes(search.toLowerCase())))
  const totalResources = groups.reduce((s, g) => s + g.resources.length, 0)
  const totalRoles = groups.reduce((s, g) => s + g.role_assignments.length, 0)
  const totalAlerts = groups.reduce((s, g) => s + (g.alerts?.length ?? 0), 0)

  const filteredTypes = resourceTypes.filter((t) => t.toLowerCase().includes(typeSearch.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Azure resources organized by resource group across all applications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPanelMode('resource')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-indigo-200 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
          <button onClick={() => setPanelMode('role')} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-violet-200 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-sky-50 rounded-xl"><Layers className="w-5 h-5 text-sky-600" /></div>
          <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Groups</p><p className="text-xl font-bold text-gray-900">{groups.length}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-indigo-50 rounded-xl"><Server className="w-5 h-5 text-indigo-600" /></div>
          <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Resources</p><p className="text-xl font-bold text-gray-900">{totalResources}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-violet-50 rounded-xl"><Shield className="w-5 h-5 text-violet-600" /></div>
          <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Role Assignments</p><p className="text-xl font-bold text-gray-900">{totalRoles}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-amber-50 rounded-xl"><Bell className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Alerts</p><p className="text-xl font-bold text-gray-900">{totalAlerts}</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Filter resource groups..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
      </div>

      {/* Groups */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-sky-50 rounded-2xl flex items-center justify-center"><Layers className="w-8 h-8 text-sky-400" /></div>
          <p className="text-lg font-semibold text-gray-900">No resource groups found</p>
          <p className="text-sm text-gray-500 mt-1">{search ? 'Try a different search term' : 'Add your first resource to get started'}</p>
          {!search && (
            <button onClick={() => setPanelMode('resource')} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const isExpanded = expanded.has(g.name)
            return (
              <div key={g.name} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => toggle(g.name)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div className="p-1.5 bg-sky-50 rounded-lg"><Layers className="w-4 h-4 text-sky-600" /></div>
                    <span className="font-semibold text-gray-900">{g.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{g.resources.length} resources</span>
                    {g.role_assignments.length > 0 && <span className="text-xs bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full">{g.role_assignments.length} roles</span>}
                    {(g.alerts?.length ?? 0) > 0 && <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full">{g.alerts.length} alerts</span>}
                  </div>
                  <div className="flex gap-1">
                    {g.applications.map((a) => (
                      <span key={a} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {g.resources.length > 0 && (
                      <div className="px-6 py-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Resources</p>
                        <div className="space-y-2">
                          {g.resources.map((r) => (
                            <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded-lg group hover:bg-gray-50 transition">
                              <div className="flex items-center gap-3">
                                <Server className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium text-gray-900 text-sm">{r.resource_name}</span>
                                {r.type && <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-mono">{r.type}</span>}
                                {r.tier_sku && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{r.tier_sku}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/applications/${r.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium">{r.application}</Link>
                                <button onClick={() => handleDeleteResource(r.application_id, r.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {g.role_assignments.length > 0 && (
                      <div className="px-6 py-4 bg-violet-50/20 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield className="w-3 h-3" /> Role Assignments</p>
                        <div className="space-y-2">
                          {g.role_assignments.map((ra) => (
                            <div key={ra.id} className="flex items-center justify-between py-2 px-3 bg-white/50 rounded-lg group hover:bg-white transition">
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg font-medium">{ra.role}</span>
                                {ra.assigned_to && <span className="text-xs text-gray-500">→ {ra.assigned_to}</span>}
                                {ra.scope && <span className="text-xs text-gray-400">({ra.scope})</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/applications/${ra.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium">{ra.application}</Link>
                                <button onClick={() => handleDeleteRole(ra.application_id, ra.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(g.alerts?.length ?? 0) > 0 && (
                      <div className="px-6 py-4 bg-amber-50/20 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Bell className="w-3 h-3" /> Alerts</p>
                        <div className="space-y-2">
                          {g.alerts.map((a) => (
                            <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-white/50 rounded-lg group hover:bg-white transition">
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-lg font-medium">{a.alert_name}</span>
                                {a.purpose && <span className="text-xs text-gray-500">{a.purpose}</span>}
                                {a.resource_applied_to && <span className="text-xs text-gray-400">on {a.resource_applied_to}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/applications/${a.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium">{a.application}</Link>
                                <button onClick={() => handleDeleteAlertItem(a.application_id, a.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Slide Panel */}
      {panelMode && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={resetForm} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{panelMode === 'resource' ? 'New Resource' : 'New Role Assignment'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{panelMode === 'resource' ? 'Add an Azure resource to a resource group' : 'Assign a role to a resource group'}</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={panelMode === 'resource' ? handleAddResource : handleAddRole} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Application *</label>
                <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value ? Number(e.target.value) : '')} required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition">
                  <option value="">Select application...</option>
                  {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {panelMode === 'resource' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Group *</label>
                  <input type="text" placeholder="e.g. rg-myapp-prod" value={rg} onChange={(e) => setRg(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                </div>
              )}
              {panelMode === 'resource' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Name *</label>
                    <input type="text" placeholder="e.g. my-web-app-01" value={resName} onChange={(e) => setResName(e.target.value)} required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                    <input type="text" placeholder="Search or type..." value={showTypeDropdown ? typeSearch : resType}
                      onChange={(e) => { setTypeSearch(e.target.value); setResType(e.target.value); setShowTypeDropdown(true) }}
                      onFocus={() => setShowTypeDropdown(true)} onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                    {showTypeDropdown && filteredTypes.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredTypes.map((t) => (
                          <button key={t} type="button" onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setResType(t); setTypeSearch(t); setShowTypeDropdown(false) }}
                            className="w-full text-left px-3.5 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-mono text-xs">
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier / SKU</label>
                    <input type="text" placeholder="e.g. Standard S1, Premium" value={resTier} onChange={(e) => setResTier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                    <input type="text" placeholder="e.g. Contributor" value={roleName} onChange={(e) => setRoleName(e.target.value)} required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned To</label>
                    <input type="text" placeholder="e.g. user@company.com" value={roleAssignedTo} onChange={(e) => setRoleAssignedTo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Scope</label>
                    <input type="text" placeholder="e.g. /subscriptions/..." value={roleScope} onChange={(e) => setRoleScope(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                </>
              )}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting}
                  className={`px-6 py-2.5 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer disabled:opacity-40 ${panelMode === 'resource' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                  {submitting ? 'Adding...' : panelMode === 'resource' ? 'Add Resource' : 'Add Role Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
