import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Layers, Server, Shield, Bell, Plus, Trash2, Search,
  ExternalLink, X, Filter, ChevronDown, Check, Pencil,
} from 'lucide-react'
import { listResourceGroups, type ResourceGroupAggregate } from '../api/aggregates'
import {
  listApplications, addResource, addRoleAssignment, addAlert,
  deleteResource, deleteRoleAssignment, deleteAlert, deleteResourceGroup,
  listResourceTypes, updateResource, updateRoleAssignment, updateAlert,
} from '../api/applications'
import type { ApplicationSummary } from '../types'
import { AzureResourceIcon, getAzureIcon } from '../utils/azureIcons'

type AddMode = 'resource' | 'role' | 'alert' | null

export default function ResourceGroupDetail() {
  const { name: rgName } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(rgName ?? '')
  const navigate = useNavigate()

  const [group, setGroup] = useState<ResourceGroupAggregate | null>(null)
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [resourceTypes, setResourceTypes] = useState<string[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [showTypeDD, setShowTypeDD] = useState(false)

  // Add forms
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [fApp, setFApp] = useState<number | ''>('')
  const [fResName, setFResName] = useState('')
  const [fResType, setFResType] = useState('')
  const [fTypeSearch, setFTypeSearch] = useState('')
  const [showTypePickerDD, setShowTypePickerDD] = useState(false)
  const [fResTier, setFResTier] = useState('')
  const [fRole, setFRole] = useState('')
  const [fAssignedTo, setFAssignedTo] = useState('')
  const [fAlertName, setFAlertName] = useState('')
  const [fAlertPurpose, setFAlertPurpose] = useState('')
  const [fAlertResource, setFAlertResource] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const [editResId, setEditResId] = useState<number | null>(null)
  const [editRes, setEditRes] = useState({ resource_name: '', type: '', tier_sku: '' })
  const [editRoleId, setEditRoleId] = useState<number | null>(null)
  const [editRole, setEditRole] = useState({ role: '', assigned_to: '', scope: '' })
  const [editAlertId, setEditAlertId] = useState<number | null>(null)
  const [editAlert, setEditAlert] = useState({ alert_name: '', purpose: '', resource_applied_to: '' })

  const load = () => {
    setLoading(true)
    listResourceGroups().then((data) => {
      const found = data.find((g) => g.name === decodedName)
      setGroup(found ?? null)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [decodedName])
  useEffect(() => { listApplications().then(setApps) }, [])
  useEffect(() => { listResourceTypes().then(setResourceTypes) }, [])

  const resetForm = () => {
    setFApp(''); setFResName(''); setFResType(''); setFTypeSearch(''); setFResTier('')
    setFRole(''); setFAssignedTo('')
    setFAlertName(''); setFAlertPurpose(''); setFAlertResource(''); setSubmitting(false)
    setAddMode(null)
  }

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault()
    if (!fApp || !fResName.trim()) return
    setSubmitting(true)
    await addResource(Number(fApp), { resource_group: decodedName, resource_name: fResName.trim(), type: fResType.trim(), tier_sku: fResTier.trim() })
    resetForm(); load()
  }
  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault()
    if (!fApp || !fRole.trim()) return
    setSubmitting(true)
    await addRoleAssignment(Number(fApp), { role: fRole.trim(), assigned_to: fAssignedTo.trim(), scope: decodedName })
    resetForm(); load()
  }
  const handleAddAlert = async (e: FormEvent) => {
    e.preventDefault()
    if (!fApp || !fAlertName.trim()) return
    setSubmitting(true)
    await addAlert(Number(fApp), { resource_group: decodedName, alert_name: fAlertName.trim(), purpose: fAlertPurpose.trim(), resource_applied_to: fAlertResource.trim() })
    resetForm(); load()
  }

  const handleDeleteResource = async (appId: number, resId: number) => { await deleteResource(appId, resId); load() }
  const handleDeleteRole = async (appId: number, roleId: number) => { await deleteRoleAssignment(appId, roleId); load() }
  const handleDeleteAlertItem = async (appId: number, alertId: number) => { await deleteAlert(appId, alertId); load() }

  const saveEditRes = async (appId: number) => {
    if (!editResId || !editRes.resource_name.trim()) return
    await updateResource(appId, editResId, editRes)
    setEditResId(null); load()
  }
  const saveEditRole = async (appId: number) => {
    if (!editRoleId || !editRole.role.trim()) return
    await updateRoleAssignment(appId, editRoleId, editRole)
    setEditRoleId(null); load()
  }
  const saveEditAlert = async (appId: number) => {
    if (!editAlertId || !editAlert.alert_name.trim()) return
    await updateAlert(appId, editAlertId, editAlert)
    setEditAlertId(null); load()
  }
  const handleDeleteRg = async () => {
    if (!confirm(`Delete resource group "${decodedName}" and ALL its resources, alerts, and role assignments? This cannot be undone.`)) return
    await deleteResourceGroup(decodedName)
    navigate('/resource-groups')
  }

  const toggleType = (t: string) => setTypeFilters((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600" />
    </div>
  )

  if (!group) return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/resource-groups')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Resource Groups
      </button>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
        <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-semibold text-gray-900">Resource group not found</p>
        <p className="text-sm text-gray-500 mt-1">"{decodedName}" doesn't exist or was deleted</p>
      </div>
    </div>
  )

  const uniqueTypes = Array.from(new Set(group.resources.map((r) => r.type).filter(Boolean))).sort()
  const alertCount = group.alerts?.length ?? 0

  const filteredResources = group.resources.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || r.resource_name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.tier_sku.toLowerCase().includes(q)
    const matchesType = typeFilters.length === 0 || typeFilters.includes(r.type)
    return matchesSearch && matchesType
  })

  const filteredTypes = resourceTypes.filter((t) => t.toLowerCase().includes(fTypeSearch.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <button onClick={() => navigate('/resource-groups')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Resource Groups
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl">
            <Layers className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{decodedName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              {group.applications.map((a) => (
                <span key={a} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-lg font-medium">{a}</span>
              ))}
              <span className="text-xs text-gray-400">{group.resources.length} resources · {group.role_assignments.length} roles · {alertCount} alerts</span>
            </div>
          </div>
        </div>
        <button onClick={handleDeleteRg}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition cursor-pointer font-medium">
          <Trash2 className="w-4 h-4" /> Delete Group
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Server, label: 'Resources', value: group.resources.length, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { icon: Shield, label: 'Roles', value: group.role_assignments.length, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: Bell, label: 'Alerts', value: alertCount, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`p-3 ${s.bg} rounded-xl`}><s.icon className={`w-5 h-5 ${s.text}`} /></div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { resetForm(); setAddMode('resource') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${addMode === 'resource' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50'}`}>
          <Plus className="w-4 h-4" /> Add Resource
        </button>
        <button onClick={() => { resetForm(); setAddMode('role') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${addMode === 'role' ? 'bg-violet-600 text-white shadow-md' : 'bg-white border border-gray-200 text-violet-600 hover:bg-violet-50'}`}>
          <Plus className="w-4 h-4" /> Add Role
        </button>
        <button onClick={() => { resetForm(); setAddMode('alert') }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${addMode === 'alert' ? 'bg-amber-600 text-white shadow-md' : 'bg-white border border-gray-200 text-amber-600 hover:bg-amber-50'}`}>
          <Plus className="w-4 h-4" /> Add Alert
        </button>
      </div>

      {/* Add Forms */}
      {addMode === 'resource' && (
        <form onSubmit={handleAddResource} className="bg-indigo-50/50 rounded-xl border border-indigo-200 p-5 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-700">New Resource in {decodedName}</p>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-white/60 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={fApp} onChange={(e) => setFApp(e.target.value ? Number(e.target.value) : '')} required
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer transition">
              <option value="">Application *</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input type="text" placeholder="Resource Name *" value={fResName} onChange={(e) => setFResName(e.target.value)} required
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
            <div className="relative">
              <input type="text" placeholder="Type (search)" value={showTypePickerDD ? fTypeSearch : fResType}
                onChange={(e) => { setFTypeSearch(e.target.value); setFResType(e.target.value); setShowTypePickerDD(true) }}
                onFocus={() => setShowTypePickerDD(true)} onBlur={() => setTimeout(() => setShowTypePickerDD(false), 200)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
              {showTypePickerDD && filteredTypes.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                  {filteredTypes.slice(0, 15).map((t) => (
                    <button key={t} type="button" onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setFResType(t); setFTypeSearch(t); setShowTypePickerDD(false) }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-mono flex items-center gap-2">
                      <AzureResourceIcon type={t} size="sm" /> {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input type="text" placeholder="Tier / SKU" value={fResTier} onChange={(e) => setFResTier(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
              {submitting ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      )}

      {addMode === 'role' && (
        <form onSubmit={handleAddRole} className="bg-violet-50/50 rounded-xl border border-violet-200 p-5 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-violet-700">New Role Assignment in {decodedName}</p>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-white/60 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
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
            <input type="text" placeholder="Scope (auto-set)" value={decodedName} readOnly
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
              {submitting ? 'Adding...' : 'Add Role'}
            </button>
          </div>
        </form>
      )}

      {addMode === 'alert' && (
        <form onSubmit={handleAddAlert} className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-700">New Alert in {decodedName}</p>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-white/60 rounded-lg transition cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
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
            <button type="button" onClick={resetForm} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition cursor-pointer disabled:opacity-50 shadow-sm">
              {submitting ? 'Adding...' : 'Add Alert'}
            </button>
          </div>
        </form>
      )}

      {/* Resources Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Resources</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{filteredResources.length} of {group.resources.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial lg:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
            </div>
            {uniqueTypes.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setShowTypeDD(!showTypeDD)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-100 transition">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className={typeFilters.length === 0 ? 'text-gray-400' : 'text-gray-900'}>{typeFilters.length === 0 ? 'Filter by type' : `${typeFilters.length} type${typeFilters.length > 1 ? 's' : ''}`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTypeDD ? 'rotate-180' : ''}`} />
                </button>
                {showTypeDD && (
                  <div className="absolute z-30 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto min-w-[220px] animate-scale-in origin-top-right">
                    {uniqueTypes.map((t) => {
                      const selected = typeFilters.includes(t)
                      return (
                        <button key={t} type="button" onClick={() => toggleType(t)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${selected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <AzureResourceIcon type={t} size="sm" />
                          <span className="truncate">{getAzureIcon(t).label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {typeFilters.length > 0 && (
              <button onClick={() => setTypeFilters([])} className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer font-medium">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{group.resources.length === 0 ? 'No resources yet' : 'No resources match your filter'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredResources.map((r) => (
              editResId === r.id ? (
                <div key={r.id} className="flex items-center gap-2 px-6 py-3.5 bg-indigo-50/80 border-b border-indigo-200">
                  <input type="text" value={editRes.resource_name} onChange={(e) => setEditRes({ ...editRes, resource_name: e.target.value })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Resource name" />
                  <input type="text" value={editRes.type} onChange={(e) => setEditRes({ ...editRes, type: e.target.value })} className="w-40 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Type" />
                  <input type="text" value={editRes.tier_sku} onChange={(e) => setEditRes({ ...editRes, tier_sku: e.target.value })} className="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Tier/SKU" />
                  <button onClick={() => saveEditRes(r.application_id)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditResId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
              <div key={r.id} className="flex items-center justify-between px-6 py-3.5 group hover:bg-gray-50/80 transition-colors">
                <Link to={`/applications/${r.application_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <AzureResourceIcon type={r.type} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate hover:text-indigo-600 transition">{r.resource_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.type && <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-mono">{getAzureIcon(r.type).label}</span>}
                      {r.tier_sku && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">{r.tier_sku}</span>}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/applications/${r.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                    {r.application} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <button onClick={() => { setEditResId(r.id); setEditRes({ resource_name: r.resource_name, type: r.type, tier_sku: r.tier_sku }) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-all cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteResource(r.application_id, r.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Role Assignments Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Role Assignments</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{group.role_assignments.length}</span>
        </div>
        {group.role_assignments.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No role assignments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {group.role_assignments.map((ra) => (
              editRoleId === ra.id ? (
                <div key={ra.id} className="flex items-center gap-2 px-6 py-3.5 bg-violet-50/80 border-b border-violet-200">
                  <input type="text" value={editRole.role} onChange={(e) => setEditRole({ ...editRole, role: e.target.value })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Role" />
                  <input type="text" value={editRole.assigned_to} onChange={(e) => setEditRole({ ...editRole, assigned_to: e.target.value })} className="w-36 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Assigned to" />
                  <button onClick={() => saveEditRole(ra.application_id)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditRoleId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
              <div key={ra.id} className="flex items-center justify-between px-6 py-3.5 group hover:bg-violet-50/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-lg">{ra.role}</span>
                  {ra.assigned_to && <span className="text-xs text-gray-500">→ <span className="font-medium text-gray-700">{ra.assigned_to}</span></span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/applications/${ra.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                    {ra.application} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <button onClick={() => { setEditRoleId(ra.id); setEditRole({ role: ra.role, assigned_to: ra.assigned_to, scope: ra.scope }) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-all cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteRole(ra.application_id, ra.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Alerts</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{alertCount}</span>
        </div>
        {alertCount === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {group.alerts.map((a) => (
              editAlertId === a.id ? (
                <div key={a.id} className="flex items-center gap-2 px-6 py-3.5 bg-amber-50/80 border-b border-amber-200">
                  <input type="text" value={editAlert.alert_name} onChange={(e) => setEditAlert({ ...editAlert, alert_name: e.target.value })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Alert name" />
                  <input type="text" value={editAlert.purpose} onChange={(e) => setEditAlert({ ...editAlert, purpose: e.target.value })} className="w-36 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Purpose" />
                  <input type="text" value={editAlert.resource_applied_to} onChange={(e) => setEditAlert({ ...editAlert, resource_applied_to: e.target.value })} className="w-36 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Applied to" />
                  <button onClick={() => saveEditAlert(a.application_id)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditAlertId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
              <div key={a.id} className="flex items-center justify-between px-6 py-3.5 group hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 bg-amber-100 rounded-lg shrink-0"><Bell className="w-3.5 h-3.5 text-amber-600" /></div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-lg">{a.alert_name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {a.purpose && <span className="text-xs text-gray-500">{a.purpose}</span>}
                      {a.resource_applied_to && <span className="text-[10px] text-gray-400">on {a.resource_applied_to}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/applications/${a.application_id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
                    {a.application} <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                  <button onClick={() => { setEditAlertId(a.id); setEditAlert({ alert_name: a.alert_name, purpose: a.purpose, resource_applied_to: a.resource_applied_to }) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-all cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAlertItem(a.application_id, a.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
