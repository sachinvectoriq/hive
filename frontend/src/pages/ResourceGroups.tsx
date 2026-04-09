import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Shield, ChevronDown, Search, Plus, X, Trash2,
  Server, Bell, FolderPlus, MoreHorizontal, Filter, ExternalLink,
} from 'lucide-react'
import { listResourceGroups, type ResourceGroupAggregate } from '../api/aggregates'
import {
  listApplications, addResource, addRoleAssignment, addAlert,
  deleteResource, deleteRoleAssignment, deleteAlert, deleteResourceGroup,
  listResourceTypes,
} from '../api/applications'
import type { ApplicationSummary } from '../types'
import { AzureResourceIcon, getAzureIcon } from '../utils/azureIcons'

type AddMode = 'resource' | 'role' | 'alert' | null

export default function ResourceGroups() {
  const [groups, setGroups] = useState<ResourceGroupAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Filters
  const [appFilter, setAppFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // New resource group creation
  const [showNewRgPanel, setShowNewRgPanel] = useState(false)
  const [newRgName, setNewRgName] = useState('')
  const [newRgApp, setNewRgApp] = useState<number | ''>('')
  const [newRgResName, setNewRgResName] = useState('')
  const [newRgResType, setNewRgResType] = useState('')
  const [newRgResTier, setNewRgResTier] = useState('')
  const [newRgTypeSearch, setNewRgTypeSearch] = useState('')
  const [showNewRgTypeDD, setShowNewRgTypeDD] = useState(false)

  // Inline add within a group
  const [inlineGroup, setInlineGroup] = useState<string | null>(null)
  const [inlineMode, setInlineMode] = useState<AddMode>(null)

  // Inline form fields
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  const [fApp, setFApp] = useState<number | ''>('')
  const [fResName, setFResName] = useState('')
  const [fResType, setFResType] = useState('')
  const [fTypeSearch, setFTypeSearch] = useState('')
  const [showTypeDD, setShowTypeDD] = useState(false)
  const [fResTier, setFResTier] = useState('')
  const [fRole, setFRole] = useState('')
  const [fAssignedTo, setFAssignedTo] = useState('')
  const [fAlertName, setFAlertName] = useState('')
  const [fAlertPurpose, setFAlertPurpose] = useState('')
  const [fAlertResource, setFAlertResource] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Active group menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (name: string) => setExpanded((prev) => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })

  const openInlineAdd = (groupName: string, mode: AddMode) => {
    setInlineGroup(groupName)
    setInlineMode(mode)
    setActiveMenu(null)
    resetInlineFields()
    if (!expanded.has(groupName)) setExpanded((prev) => new Set(prev).add(groupName))
  }

  const resetInlineFields = () => {
    setFApp(''); setFResName(''); setFResType(''); setFTypeSearch(''); setFResTier('')
    setFRole(''); setFAssignedTo('')
    setFAlertName(''); setFAlertPurpose(''); setFAlertResource(''); setSubmitting(false)
  }
  const closeInline = () => { setInlineGroup(null); setInlineMode(null); resetInlineFields() }

  const handleInlineAddResource = async (e: FormEvent, rgName: string) => {
    e.preventDefault()
    if (!fApp || !fResName.trim()) return
    setSubmitting(true)
    await addResource(Number(fApp), { resource_group: rgName, resource_name: fResName.trim(), type: fResType.trim(), tier_sku: fResTier.trim() })
    closeInline(); load()
  }
  const handleInlineAddRole = async (e: FormEvent, rgName: string) => {
    e.preventDefault()
    if (!fApp || !fRole.trim()) return
    setSubmitting(true)
    await addRoleAssignment(Number(fApp), { role: fRole.trim(), assigned_to: fAssignedTo.trim(), scope: rgName })
    closeInline(); load()
  }
  const handleInlineAddAlert = async (e: FormEvent, rgName: string) => {
    e.preventDefault()
    if (!fApp || !fAlertName.trim()) return
    setSubmitting(true)
    await addAlert(Number(fApp), { resource_group: rgName, alert_name: fAlertName.trim(), purpose: fAlertPurpose.trim(), resource_applied_to: fAlertResource.trim() })
    closeInline(); load()
  }

  const resetNewRg = () => {
    setNewRgName(''); setNewRgApp(''); setNewRgResName(''); setNewRgResType(''); setNewRgTypeSearch(''); setNewRgResTier('')
    setShowNewRgPanel(false); setSubmitting(false)
  }
  const handleNewRg = async (e: FormEvent) => {
    e.preventDefault()
    if (!newRgApp || !newRgName.trim() || !newRgResName.trim()) return
    setSubmitting(true)
    await addResource(Number(newRgApp), { resource_group: newRgName.trim(), resource_name: newRgResName.trim(), type: newRgResType.trim(), tier_sku: newRgResTier.trim() })
    resetNewRg(); load()
  }

  const handleDeleteResource = async (appId: number, resId: number) => { await deleteResource(appId, resId); load() }
  const handleDeleteRole = async (appId: number, roleId: number) => { await deleteRoleAssignment(appId, roleId); load() }
  const handleDeleteAlertItem = async (appId: number, alertId: number) => { await deleteAlert(appId, alertId); load() }
  const handleDeleteResourceGroup = async (rgName: string) => {
    if (!confirm(`Delete resource group "${rgName}" and all its resources, alerts, and role assignments? This cannot be undone.`)) return
    await deleteResourceGroup(rgName)
    load()
  }

  // Collect unique apps and types for filter dropdowns
  const uniqueApps = Array.from(new Set(groups.flatMap((g) => g.applications))).sort()
  const uniqueTypes = Array.from(new Set(groups.flatMap((g) => g.resources.map((r) => r.type).filter(Boolean)))).sort()

  const filtered = groups.filter((g) => {
    const matchesSearch = !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.applications.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
      g.resources.some((r) => r.resource_name.toLowerCase().includes(search.toLowerCase()))
    const matchesApp = appFilter === 'all' || g.applications.includes(appFilter)
    const matchesType = typeFilter === 'all' || g.resources.some((r) => r.type === typeFilter)
    return matchesSearch && matchesApp && matchesType
  })

  const totalResources = groups.reduce((s, g) => s + g.resources.length, 0)
  const totalRoles = groups.reduce((s, g) => s + g.role_assignments.length, 0)
  const totalAlerts = groups.reduce((s, g) => s + (g.alerts?.length ?? 0), 0)
  const filteredTypes = (q: string) => resourceTypes.filter((t) => t.toLowerCase().includes(q.toLowerCase()))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resource Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Azure resources, roles & alerts organized by resource group</p>
        </div>
        <button onClick={() => setShowNewRgPanel(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer active:scale-[0.98]">
          <FolderPlus className="w-4 h-4 transition-transform group-hover:scale-110" /> New Resource Group
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Layers, label: 'Groups', value: groups.length, bg: 'bg-sky-50', text: 'text-sky-600' },
          { icon: Server, label: 'Resources', value: totalResources, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { icon: Shield, label: 'Role Assignments', value: totalRoles, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: Bell, label: 'Alerts', value: totalAlerts, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map((s, i) => (
          <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 card-hover animate-fade-in stagger-${i + 1}`}>
            <div className={`p-3 ${s.bg} rounded-xl`}><s.icon className={`w-5 h-5 ${s.text}`} /></div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search resource groups, resources, or apps..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition placeholder:text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none appearance-none transition">
              <option value="all">All Applications</option>
              {uniqueApps.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative">
            <Server className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-8 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none appearance-none transition">
              <option value="all">All Resource Types</option>
              {uniqueTypes.map((t) => <option key={t} value={t}>{getAzureIcon(t).label} ({t.split('/').pop()})</option>)}
            </select>
          </div>
          {(appFilter !== 'all' || typeFilter !== 'all') && (
            <button onClick={() => { setAppFilter('all'); setTypeFilter('all') }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl flex items-center justify-center">
            <Layers className="w-8 h-8 text-sky-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">No resource groups found</p>
          <p className="text-sm text-gray-500 mt-1">{search || appFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first resource group to get started'}</p>
          {!search && appFilter === 'all' && typeFilter === 'all' && (
            <button onClick={() => setShowNewRgPanel(true)} className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg shadow-indigo-500/25">
              <FolderPlus className="w-4 h-4" /> New Resource Group
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((g, gIdx) => {
            const isExpanded = expanded.has(g.name)
            const alertCount = g.alerts?.length ?? 0
            return (
              <div key={g.name} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200 ${isExpanded ? 'shadow-md ring-1 ring-gray-100' : 'shadow-sm hover:shadow-md'} animate-fade-in stagger-${Math.min(gIdx + 1, 5)}`}>
                {/* Group Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <button onClick={() => toggle(g.name)} className="flex items-center gap-3 flex-1 cursor-pointer text-left">
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="p-2 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl">
                      <Layers className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-[15px]">{g.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{g.resources.length} resource{g.resources.length !== 1 ? 's' : ''}</span>
                        {g.role_assignments.length > 0 && <span className="text-[10px] font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md">{g.role_assignments.length} role{g.role_assignments.length !== 1 ? 's' : ''}</span>}
                        {alertCount > 0 && <span className="text-[10px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 mr-2">
                      {g.applications.map((a) => (
                        <span key={a} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-medium">{a}</span>
                      ))}
                    </div>
                    <button onClick={() => handleDeleteResourceGroup(g.name)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition cursor-pointer" title="Delete resource group">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="relative" ref={activeMenu === g.name ? menuRef : undefined}>
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === g.name ? null : g.name) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {activeMenu === g.name && (
                        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[200px] animate-scale-in origin-top-right">
                          <button onClick={() => openInlineAdd(g.name, 'resource')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer">
                            <Server className="w-3.5 h-3.5" /> Add Resource
                          </button>
                          <button onClick={() => openInlineAdd(g.name, 'role')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer">
                            <Shield className="w-3.5 h-3.5" /> Add Role Assignment
                          </button>
                          <button onClick={() => openInlineAdd(g.name, 'alert')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer">
                            <Bell className="w-3.5 h-3.5" /> Add Alert
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button onClick={() => { setActiveMenu(null); handleDeleteResourceGroup(g.name) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Resource Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Inline Add Form */}
                    {inlineGroup === g.name && inlineMode && (
                      <div className={`mx-6 my-4 rounded-xl border p-4 animate-scale-in ${
                        inlineMode === 'resource' ? 'bg-indigo-50/50 border-indigo-200' :
                        inlineMode === 'role' ? 'bg-violet-50/50 border-violet-200' :
                        'bg-amber-50/50 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-sm font-semibold ${
                            inlineMode === 'resource' ? 'text-indigo-700' :
                            inlineMode === 'role' ? 'text-violet-700' : 'text-amber-700'
                          }`}>
                            {inlineMode === 'resource' ? 'New Resource' : inlineMode === 'role' ? 'New Role Assignment' : 'New Alert'}
                            <span className="text-gray-400 font-normal"> in {g.name}</span>
                          </p>
                          <button onClick={closeInline} className="p-1 hover:bg-white/60 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        {inlineMode === 'resource' && (
                          <form onSubmit={(e) => handleInlineAddResource(e, g.name)} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <select value={fApp} onChange={(e) => setFApp(e.target.value ? Number(e.target.value) : '')} required
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer transition">
                                <option value="">Application *</option>
                                {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                              <input type="text" placeholder="Resource Name *" value={fResName} onChange={(e) => setFResName(e.target.value)} required
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
                              <div className="relative">
                                <input type="text" placeholder="Type (search)" value={showTypeDD ? fTypeSearch : fResType}
                                  onChange={(e) => { setFTypeSearch(e.target.value); setFResType(e.target.value); setShowTypeDD(true) }}
                                  onFocus={() => setShowTypeDD(true)} onBlur={() => setTimeout(() => setShowTypeDD(false), 200)}
                                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
                                {showTypeDD && filteredTypes(fTypeSearch).length > 0 && (
                                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                    {filteredTypes(fTypeSearch).slice(0, 15).map((t) => (
                                      <button key={t} type="button" onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setFResType(t); setFTypeSearch(t); setShowTypeDD(false) }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-mono flex items-center gap-2">
                                        <AzureResourceIcon type={t} size="sm" />
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <input type="text" placeholder="Tier / SKU" value={fResTier} onChange={(e) => setFResTier(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button type="button" onClick={closeInline} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
                              <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
                                {submitting ? 'Adding...' : 'Add Resource'}
                              </button>
                            </div>
                          </form>
                        )}
                        {inlineMode === 'role' && (
                          <form onSubmit={(e) => handleInlineAddRole(e, g.name)} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <select value={fApp} onChange={(e) => setFApp(e.target.value ? Number(e.target.value) : '')} required
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 cursor-pointer transition">
                                <option value="">Application *</option>
                                {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                              <input type="text" placeholder="Role *" value={fRole} onChange={(e) => setFRole(e.target.value)} required
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition" />
                              <input type="text" placeholder="Assigned To" value={fAssignedTo} onChange={(e) => setFAssignedTo(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition" />
                              <input type="text" placeholder="Scope (auto-set)" value={g.name} readOnly
                                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 outline-none" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button type="button" onClick={closeInline} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
                              <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
                                {submitting ? 'Adding...' : 'Add Role'}
                              </button>
                            </div>
                          </form>
                        )}
                        {inlineMode === 'alert' && (
                          <form onSubmit={(e) => handleInlineAddAlert(e, g.name)} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <select value={fApp} onChange={(e) => setFApp(e.target.value ? Number(e.target.value) : '')} required
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 cursor-pointer transition">
                                <option value="">Application *</option>
                                {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                              <input type="text" placeholder="Alert Name *" value={fAlertName} onChange={(e) => setFAlertName(e.target.value)} required
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition" />
                              <input type="text" placeholder="Purpose" value={fAlertPurpose} onChange={(e) => setFAlertPurpose(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition" />
                              <input type="text" placeholder="Resource Applied To" value={fAlertResource} onChange={(e) => setFAlertResource(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button type="button" onClick={closeInline} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
                              <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
                                {submitting ? 'Adding...' : 'Add Alert'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Quick add bar */}
                    {!(inlineGroup === g.name && inlineMode) && (
                      <div className="px-6 pt-3 pb-1 flex gap-2">
                        <button onClick={() => openInlineAdd(g.name, 'resource')} className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer">
                          <Plus className="w-3 h-3" /> Resource
                        </button>
                        <button onClick={() => openInlineAdd(g.name, 'role')} className="flex items-center gap-1.5 text-[11px] font-medium text-violet-600 hover:text-violet-700 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 transition cursor-pointer">
                          <Plus className="w-3 h-3" /> Role
                        </button>
                        <button onClick={() => openInlineAdd(g.name, 'alert')} className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 hover:text-amber-700 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition cursor-pointer">
                          <Plus className="w-3 h-3" /> Alert
                        </button>
                      </div>
                    )}

                    {/* Resources */}
                    {g.resources.length > 0 && (
                      <div className="px-6 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Server className="w-3.5 h-3.5 text-indigo-500" />
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resources</p>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-1.5">
                          {g.resources.map((r) => (
                            <div key={r.id} className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50/80 rounded-xl group hover:bg-gray-100/80 transition-colors">
                              <Link to={`/applications/${r.application_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                <AzureResourceIcon type={r.type} />
                                <span className="font-medium text-gray-900 text-sm truncate hover:text-indigo-600 transition">{r.resource_name}</span>
                                {r.type && <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-mono shrink-0 hidden md:inline">{getAzureIcon(r.type).label}</span>}
                                {r.tier_sku && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md shrink-0 hidden lg:inline">{r.tier_sku}</span>}
                              </Link>
                              <div className="flex items-center gap-3 shrink-0">
                                <Link to={`/applications/${r.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                                  {r.application} <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                                <button onClick={() => handleDeleteResource(r.application_id, r.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Role Assignments */}
                    {g.role_assignments.length > 0 && (
                      <div className="px-6 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-3.5 h-3.5 text-violet-500" />
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role Assignments</p>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-1.5">
                          {g.role_assignments.map((ra) => (
                            <div key={ra.id} className="flex items-center justify-between py-2.5 px-3.5 bg-violet-50/40 rounded-xl group hover:bg-violet-50/70 transition-colors">
                              <Link to={`/applications/${ra.application_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                                <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg">{ra.role}</span>
                                {ra.assigned_to && <span className="text-xs text-gray-500">→ <span className="font-medium text-gray-700">{ra.assigned_to}</span></span>}
                                {ra.scope && <span className="text-[10px] text-gray-400 hidden md:inline">scope: {ra.scope}</span>}
                              </Link>
                              <div className="flex items-center gap-3 shrink-0">
                                <Link to={`/applications/${ra.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                                  {ra.application} <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                                <button onClick={() => handleDeleteRole(ra.application_id, ra.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    {(g.alerts?.length ?? 0) > 0 && (
                      <div className="px-6 py-3 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bell className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alerts</p>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="space-y-1.5">
                          {g.alerts.map((a) => (
                            <div key={a.id} className="flex items-center justify-between py-2.5 px-3.5 bg-amber-50/40 rounded-xl group hover:bg-amber-50/70 transition-colors">
                              <Link to={`/applications/${a.application_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="p-1.5 bg-amber-100 rounded-lg shrink-0"><Bell className="w-3.5 h-3.5 text-amber-600" /></div>
                                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-lg">{a.alert_name}</span>
                                {a.purpose && <span className="text-xs text-gray-500 hidden md:inline">{a.purpose}</span>}
                                {a.resource_applied_to && <span className="text-[10px] text-gray-400 hidden lg:inline">on {a.resource_applied_to}</span>}
                              </Link>
                              <div className="flex items-center gap-3 shrink-0">
                                <Link to={`/applications/${a.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                                  {a.application} <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                                <button onClick={() => handleDeleteAlertItem(a.application_id, a.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {g.resources.length === 0 && g.role_assignments.length === 0 && (g.alerts?.length ?? 0) === 0 && (
                      <div className="px-6 py-8 text-center">
                        <p className="text-sm text-gray-400">This resource group is empty</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Resource Group Slide Panel */}
      {showNewRgPanel && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={resetNewRg} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-500" /> New Resource Group
                </h2>
                <p className="text-xs text-gray-400 mt-1">Create a resource group with its first resource</p>
              </div>
              <button onClick={resetNewRg} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleNewRg} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Application *</label>
                <select value={newRgApp} onChange={(e) => setNewRgApp(e.target.value ? Number(e.target.value) : '')} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition">
                  <option value="">Select application...</option>
                  {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Group Name *</label>
                <input type="text" placeholder="e.g. rg-myapp-production" value={newRgName} onChange={(e) => setNewRgName(e.target.value)} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">First Resource</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Resource Name *</label>
                    <input type="text" placeholder="e.g. my-web-app-01" value={newRgResName} onChange={(e) => setNewRgResName(e.target.value)} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Type</label>
                    <input type="text" placeholder="Search resource types..." value={showNewRgTypeDD ? newRgTypeSearch : newRgResType}
                      onChange={(e) => { setNewRgTypeSearch(e.target.value); setNewRgResType(e.target.value); setShowNewRgTypeDD(true) }}
                      onFocus={() => setShowNewRgTypeDD(true)} onBlur={() => setTimeout(() => setShowNewRgTypeDD(false), 200)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                    {showNewRgTypeDD && filteredTypes(newRgTypeSearch).length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredTypes(newRgTypeSearch).slice(0, 15).map((t) => (
                          <button key={t} type="button" onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setNewRgResType(t); setNewRgTypeSearch(t); setShowNewRgTypeDD(false) }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-mono flex items-center gap-2">
                            <AzureResourceIcon type={t} size="sm" />
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Tier / SKU</label>
                    <input type="text" placeholder="e.g. Standard S1" value={newRgResTier} onChange={(e) => setNewRgResTier(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                  </div>
                </div>
              </div>
              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={resetNewRg} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer disabled:opacity-50 active:scale-[0.98]">
                  {submitting ? 'Creating...' : 'Create Resource Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
