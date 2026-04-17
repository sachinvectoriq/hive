import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Search, Calendar, Plus, X, Trash2,
  Circle, Loader2, CheckCircle2, AlertTriangle, Filter, AppWindow, User,
  ChevronDown, Check, Pencil,
} from 'lucide-react'
import { listAllTasks, type TaskAggregate } from '../api/aggregates'
import { listApplications, addTask, updateTask, deleteTask, getApplication } from '../api/applications'
import type { ApplicationSummary, Person } from '../types'

const STATUS_COLORS: Record<string, string> = {
  'not-started': 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'completed': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}
const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskAggregate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([])
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [showStatusDD, setShowStatusDD] = useState(false)
  const [showSeverityDD, setShowSeverityDD] = useState(false)
  const [showAppDD, setShowAppDD] = useState(false)
  const [showPersonDD, setShowPersonDD] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Add form state
  const [apps, setApps] = useState<ApplicationSummary[]>([])
  const [selectedApp, setSelectedApp] = useState<number | ''>('')
  const [appPeople, setAppPeople] = useState<Person[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFields, setEditFields] = useState({ title: '', description: '', severity: '', assigned_to: '' })

  const load = () => {
    setLoading(true)
    listAllTasks().then(setTasks).finally(() => setLoading(false))
  }
  useEffect(load, [])
  useEffect(() => { listApplications().then(setApps) }, [])
  useEffect(() => {
    if (selectedApp) {
      getApplication(Number(selectedApp)).then((a) => setAppPeople(a.people))
    } else {
      setAppPeople([])
    }
  }, [selectedApp])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedApp || !title.trim()) return
    setSubmitting(true)
    await addTask(Number(selectedApp), {
      title: title.trim(),
      description: description.trim(),
      status: 'not-started',
      severity,
      assigned_to: assignedTo,
      assigned_on: assignedTo ? new Date().toISOString() : null,
    })
    setTitle(''); setDescription(''); setSeverity('medium'); setAssignedTo(''); setSelectedApp('')
    setShowPanel(false); setSubmitting(false)
    load()
  }

  const handleStatusChange = async (t: TaskAggregate, newStatus: string) => {
    await updateTask(t.application_id, t.id, { status: newStatus })
    load()
  }
  const handleDelete = async (t: TaskAggregate) => {
    if (!confirm(`Delete task "${t.title}"?`)) return
    await deleteTask(t.application_id, t.id)
    load()
  }

  const startEditTask = (t: TaskAggregate) => {
    setEditingId(t.id)
    setEditFields({ title: t.title, description: t.description || '', severity: t.severity, assigned_to: t.assigned_to || '' })
  }

  const saveEditTask = async (t: TaskAggregate) => {
    if (!editFields.title.trim()) return
    await updateTask(t.application_id, t.id, { title: editFields.title.trim(), description: editFields.description.trim(), severity: editFields.severity, assigned_to: editFields.assigned_to })
    setEditingId(null)
    load()
  }

  const uniqueApps = Array.from(new Set(tasks.map((t) => t.application))).sort()
  const uniquePeople = Array.from(new Set(tasks.map((t) => t.assigned_to).filter(Boolean))).sort()

  const toggleStatus = (v: string) => setSelectedStatuses((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])
  const toggleSeverity = (v: string) => setSelectedSeverities((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])
  const toggleApp = (v: string) => setSelectedApps((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])
  const togglePerson = (v: string) => setSelectedPeople((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])
  const closeAllDD = () => { setShowStatusDD(false); setShowSeverityDD(false); setShowAppDD(false); setShowPersonDD(false) }
  const hasFilters = selectedStatuses.length > 0 || selectedSeverities.length > 0 || selectedApps.length > 0 || selectedPeople.length > 0

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch = t.title.toLowerCase().includes(q) || t.application.toLowerCase().includes(q) || t.assigned_to.toLowerCase().includes(q)
    return matchesSearch
      && (selectedStatuses.length === 0 || selectedStatuses.includes(t.status))
      && (selectedSeverities.length === 0 || selectedSeverities.includes(t.severity))
      && (selectedApps.length === 0 || selectedApps.includes(t.application))
      && (selectedPeople.length === 0 || selectedPeople.includes(t.assigned_to))
  })

  const counts = { total: tasks.length, ns: tasks.filter((t) => t.status === 'not-started').length, ip: tasks.filter((t) => t.status === 'in-progress').length, done: tasks.filter((t) => t.status === 'completed').length }
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage tasks across all applications</p>
        </div>
        <button onClick={() => setShowPanel(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-indigo-200 cursor-pointer">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-slate-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Not Started</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.ns}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{counts.ip}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Completed</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.done}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Progress</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{pct}%</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tasks, applications, assignees..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Status multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { closeAllDD(); setShowStatusDD(!showStatusDD) }}
              className="flex items-center gap-2 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
              <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <span className={selectedStatuses.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                {selectedStatuses.length === 0 ? 'All Statuses' : `${selectedStatuses.length} status${selectedStatuses.length > 1 ? 'es' : ''}`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showStatusDD ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute z-30 left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[180px] filter-dd ${showStatusDD ? 'filter-dd-open' : 'filter-dd-closed'} origin-top-left`}>
                {[{ v: 'not-started', l: 'Not Started' }, { v: 'in-progress', l: 'In Progress' }, { v: 'completed', l: 'Completed' }].map(({ v, l }) => {
                  const sel = selectedStatuses.includes(v)
                  return (
                    <button key={v} type="button" onClick={() => toggleStatus(v)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${sel ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{l}</span>
                    </button>
                  )
                })}
            </div>
          </div>
          {/* Severity multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { closeAllDD(); setShowSeverityDD(!showSeverityDD) }}
              className="flex items-center gap-2 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
              <AlertTriangle className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <span className={selectedSeverities.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                {selectedSeverities.length === 0 ? 'All Severities' : `${selectedSeverities.length} severity`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSeverityDD ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute z-30 left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl min-w-[180px] filter-dd ${showSeverityDD ? 'filter-dd-open' : 'filter-dd-closed'} origin-top-left`}>
                {[{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }, { v: 'critical', l: 'Critical' }].map(({ v, l }) => {
                  const sel = selectedSeverities.includes(v)
                  return (
                    <button key={v} type="button" onClick={() => toggleSeverity(v)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${sel ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? 'bg-orange-600 border-orange-600' : 'border-gray-300'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{l}</span>
                    </button>
                  )
                })}
            </div>
          </div>
          {/* App multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { closeAllDD(); setShowAppDD(!showAppDD) }}
              className="flex items-center gap-2 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
              <AppWindow className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <span className={selectedApps.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                {selectedApps.length === 0 ? 'All Applications' : `${selectedApps.length} app${selectedApps.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showAppDD ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute z-30 left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto min-w-[220px] filter-dd ${showAppDD ? 'filter-dd-open' : 'filter-dd-closed'} origin-top-left`}>
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
          </div>
          {/* Person multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { closeAllDD(); setShowPersonDD(!showPersonDD) }}
              className="flex items-center gap-2 pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <span className={selectedPeople.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                {selectedPeople.length === 0 ? 'All People' : `${selectedPeople.length} person${selectedPeople.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showPersonDD ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute z-30 left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto min-w-[200px] filter-dd ${showPersonDD ? 'filter-dd-open' : 'filter-dd-closed'} origin-top-left`}>
                {uniquePeople.map((p) => {
                  const sel = selectedPeople.includes(p)
                  return (
                    <button key={p} type="button" onClick={() => togglePerson(p)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition cursor-pointer ${sel ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{p}</span>
                    </button>
                  )
                })}
            </div>
          </div>
          {hasFilters && (
            <button onClick={() => { setSelectedStatuses([]); setSelectedSeverities([]); setSelectedApps([]); setSelectedPeople([]) }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">No tasks found</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            {search || hasFilters
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first task'}
          </p>
          {!search && !hasFilters && (
            <button onClick={() => setShowPanel(true)} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
              <Plus className="w-4 h-4" /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Application</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => {
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition group">
                    {editingId === t.id ? (
                      <>
                        <td className="px-5 py-4"><input type="text" value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none" /></td>
                        <td className="px-5 py-4">
                          <Link to={`/applications/${t.application_id}`} className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition font-medium">{t.application}</Link>
                        </td>
                        <td className="px-5 py-4">
                          <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium border-0 cursor-pointer ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                            <option value="not-started">⊘ Not Started</option>
                            <option value="in-progress">◎ In Progress</option>
                            <option value="completed">✓ Completed</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <select value={editFields.severity} onChange={(e) => setEditFields({ ...editFields, severity: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs cursor-pointer outline-none">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <input type="text" value={editFields.assigned_to} onChange={(e) => setEditFields({ ...editFields, assigned_to: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs w-full focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Assigned to" />
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {t.assigned_on ? <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.assigned_on).toLocaleDateString()}</span> : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => saveEditTask(t)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{t.title}</p>
                      {t.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/applications/${t.application_id}`} className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition font-medium">
                        {t.application}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium border-0 cursor-pointer inline-flex items-center gap-1 ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                        <option value="not-started">⊘ Not Started</option>
                        <option value="in-progress">◎ In Progress</option>
                        <option value="completed">✓ Completed</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${SEVERITY_COLORS[t.severity] || 'bg-gray-100 text-gray-600'}`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {t.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {t.assigned_to.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700 text-xs font-medium">{t.assigned_to}</span>
                        </div>
                      ) : <span className="text-gray-300 text-xs">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {t.assigned_on ? (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.assigned_on).toLocaleDateString()}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditTask(t)} className="text-gray-400 hover:text-indigo-500 transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(t)} className="text-gray-400 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New Task</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create a task and assign it to a team member</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Application *</label>
                  <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value ? Number(e.target.value) : '')} required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition">
                    <option value="">Select application...</option>
                    {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input type="text" placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea placeholder="Add details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none cursor-pointer transition"
                    disabled={!selectedApp}>
                    <option value="">Unassigned</option>
                    {appPeople.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  {!selectedApp && <p className="text-xs text-gray-400 mt-1">Select an app first</p>}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPanel(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={submitting || !selectedApp || !title.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer">
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
