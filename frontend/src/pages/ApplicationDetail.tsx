import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, GitBranch, Layers, Users, Shield, Plus, Trash2,
  ExternalLink, ChevronDown, ChevronRight, ClipboardList, Calendar, Search,
} from 'lucide-react'
import {
  getApplication, deleteApplication,
  addGitRepo, deleteGitRepo,
  addResource, deleteResource,
  addRoleAssignment, deleteRoleAssignment,
  addPerson, deletePerson,
  addTask, updateTask, deleteTask,
  listResourceTypes,
} from '../api/applications'
import type { ApplicationDetail as AppDetail } from '../types'

type Tab = 'repos' | 'resources' | 'people' | 'tasks'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<AppDetail | null>(null)
  const [tab, setTab] = useState<Tab>('repos')
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    setLoading(true)
    getApplication(Number(id)).then(setApp).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleDeleteApp = async () => {
    if (!app || !confirm(`Delete "${app.name}"? This cannot be undone.`)) return
    await deleteApplication(app.id)
    navigate('/applications')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Application not found</p>
        <Link to="/applications" className="text-indigo-600 text-sm mt-2 inline-block">Back to Applications</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: typeof GitBranch; count: number }[] = [
    { key: 'repos', label: 'Git Repos', icon: GitBranch, count: app.git_repos.length },
    { key: 'resources', label: 'Resource Groups', icon: Layers, count: app.resources.length },
    { key: 'people', label: 'People', icon: Users, count: app.people.length },
    { key: 'tasks', label: 'Tasks', icon: ClipboardList, count: app.tasks.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/applications')} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
              {app.description && <p className="text-sm text-gray-500 mt-1">{app.description}</p>}
            </div>
          </div>
          <button
            onClick={handleDeleteApp}
            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium"
          >
            <Trash2 className="w-4 h-4 inline mr-1" /> Delete
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                  tab === t.key
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'repos' && <GitReposTab app={app} onRefresh={load} />}
      {tab === 'resources' && <ResourceGroupsTab app={app} onRefresh={load} />}
      {tab === 'people' && <PeopleTab app={app} onRefresh={load} />}
      {tab === 'tasks' && <TasksTab app={app} onRefresh={load} />}
    </div>
  )
}


/* ─── Git Repos Tab ──────────────────────────────────────────── */

function GitReposTab({ app, onRefresh }: { app: AppDetail; onRefresh: () => void }) {
  const [show, setShow] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [owner, setOwner] = useState('')
  const [link, setLink] = useState('')

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!repoName.trim()) return
    await addGitRepo(app.id, { repo_name: repoName.trim(), owner: owner.trim(), link: link.trim() })
    setRepoName(''); setOwner(''); setLink(''); setShow(false)
    onRefresh()
  }

  const handleDelete = async (repoId: number) => {
    await deleteGitRepo(app.id, repoId)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShow(!show)} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
          <Plus className="w-4 h-4" /> Add Repository
        </button>
      </div>

      {show && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="Repository name *" value={repoName} onChange={(e) => setRepoName(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Link (URL)" value={link} onChange={(e) => setLink(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition cursor-pointer">Add</button>
          </div>
        </form>
      )}

      {app.git_repos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No repositories yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Repository</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Link</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {app.git_repos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.repo_name}</td>
                  <td className="px-5 py-3 text-gray-600">{r.owner || '—'}</td>
                  <td className="px-5 py-3">
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" /> Link
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


/* ─── Resource Groups Tab ────────────────────────────────────── */

function ResourceGroupsTab({ app, onRefresh }: { app: AppDetail; onRefresh: () => void }) {
  const [showResource, setShowResource] = useState(false)
  const [showRole, setShowRole] = useState(false)
  const [rg, setRg] = useState('')
  const [resName, setResName] = useState('')
  const [resType, setResType] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [resourceTypes, setResourceTypes] = useState<string[]>([])
  const [resTier, setResTier] = useState('')
  const [roleRg, setRoleRg] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleRes, setRoleRes] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    const groups = new Set(app.resources.map((r) => r.resource_group))
    app.role_assignments.forEach((ra) => groups.add(ra.resource_group))
    setExpandedGroups(groups)
  }, [app])

  useEffect(() => {
    listResourceTypes().then(setResourceTypes)
  }, [])

  const toggleGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault()
    if (!rg.trim() || !resName.trim()) return
    await addResource(app.id, { resource_group: rg.trim(), resource_name: resName.trim(), type: resType.trim(), tier_sku: resTier.trim() })
    setRg(''); setResName(''); setResType(''); setTypeSearch(''); setResTier(''); setShowResource(false)
    onRefresh()
  }

  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault()
    if (!roleRg.trim() || !roleName.trim()) return
    await addRoleAssignment(app.id, { resource_group: roleRg.trim(), role_name: roleName.trim(), resource_name: roleRes.trim() })
    setRoleRg(''); setRoleName(''); setRoleRes(''); setShowRole(false)
    onRefresh()
  }

  const handleDeleteResource = async (resId: number) => {
    await deleteResource(app.id, resId)
    onRefresh()
  }

  const handleDeleteRole = async (roleId: number) => {
    await deleteRoleAssignment(app.id, roleId)
    onRefresh()
  }

  const allGroups = new Set<string>()
  app.resources.forEach((r) => allGroups.add(r.resource_group))
  app.role_assignments.forEach((ra) => allGroups.add(ra.resource_group))
  const groupNames = Array.from(allGroups).sort().filter(
    (g) => !search || g.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTypes = resourceTypes.filter(
    (t) => t.toLowerCase().includes(typeSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter resource groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowResource(!showResource)} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
          <button onClick={() => setShowRole(!showRole)} className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium cursor-pointer">
            <Plus className="w-4 h-4" /> Add Role Assignment
          </button>
        </div>
      </div>

      {showResource && (
        <form onSubmit={handleAddResource} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-700">New Resource</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Resource Group *" value={rg} onChange={(e) => setRg(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Resource Name *" value={resName} onChange={(e) => setResName(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <div className="relative">
              <input
                type="text"
                placeholder="Type (search or select)"
                value={showTypeDropdown ? typeSearch : resType}
                onChange={(e) => { setTypeSearch(e.target.value); setResType(e.target.value); setShowTypeDropdown(true) }}
                onFocus={() => setShowTypeDropdown(true)}
                onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              {showTypeDropdown && filteredTypes.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setResType(t); setTypeSearch(t); setShowTypeDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input type="text" placeholder="Tier / SKU" value={resTier} onChange={(e) => setResTier(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowResource(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition cursor-pointer">Add</button>
          </div>
        </form>
      )}

      {showRole && (
        <form onSubmit={handleAddRole} className="bg-violet-50 rounded-xl p-5 border border-violet-200 space-y-3">
          <p className="text-sm font-medium text-violet-700">New Role Assignment</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" placeholder="Resource Group *" value={roleRg} onChange={(e) => setRoleRg(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Role Name *" value={roleName} onChange={(e) => setRoleName(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Resource Name" value={roleRes} onChange={(e) => setRoleRes(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowRole(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition cursor-pointer">Add</button>
          </div>
        </form>
      )}

      {groupNames.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No resource groups yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupNames.map((gName) => {
            const resources = app.resources.filter((r) => r.resource_group === gName)
            const roles = app.role_assignments.filter((ra) => ra.resource_group === gName)
            const expanded = expandedGroups.has(gName)

            return (
              <div key={gName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleGroup(gName)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span className="font-semibold text-gray-900">{gName}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{resources.length} resources</span>
                    {roles.length > 0 && (
                      <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{roles.length} roles</span>
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-gray-100">
                    {resources.length > 0 && (
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resources</p>
                        <table className="w-full text-sm">
                          <thead className="text-gray-400 text-left text-xs">
                            <tr>
                              <th className="pb-2 font-medium">Name</th>
                              <th className="pb-2 font-medium">Type</th>
                              <th className="pb-2 font-medium">Tier / SKU</th>
                              <th className="pb-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {resources.map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="py-2 font-medium text-gray-900">{r.resource_name}</td>
                                <td className="py-2 text-gray-600">{r.type || '—'}</td>
                                <td className="py-2"><span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded">{r.tier_sku || '—'}</span></td>
                                <td className="py-2">
                                  <button onClick={() => handleDeleteResource(r.id)} className="text-gray-300 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {roles.length > 0 && (
                      <div className="px-5 py-3 bg-violet-50/30">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Roles Assigned
                        </p>
                        <table className="w-full text-sm">
                          <thead className="text-gray-400 text-left text-xs">
                            <tr>
                              <th className="pb-2 font-medium">Role Name</th>
                              <th className="pb-2 font-medium">Resource</th>
                              <th className="pb-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {roles.map((ra) => (
                              <tr key={ra.id} className="hover:bg-violet-50/50">
                                <td className="py-2"><span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{ra.role_name}</span></td>
                                <td className="py-2 text-gray-600">{ra.resource_name || '—'}</td>
                                <td className="py-2">
                                  <button onClick={() => handleDeleteRole(ra.id)} className="text-gray-300 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


/* ─── People Tab ─────────────────────────────────────────────── */

function PeopleTab({ app, onRefresh }: { app: AppDetail; onRefresh: () => void }) {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [appsInvolved, setAppsInvolved] = useState('')
  const [rgsInvolved, setRgsInvolved] = useState('')
  const [permissions, setPermissions] = useState('')

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await addPerson(app.id, {
      name: name.trim(),
      applications_involved: appsInvolved.trim(),
      resource_groups_involved: rgsInvolved.trim(),
      permissions: permissions.trim(),
    })
    setName(''); setAppsInvolved(''); setRgsInvolved(''); setPermissions(''); setShow(false)
    onRefresh()
  }

  const handleDelete = async (personId: number) => {
    await deletePerson(app.id, personId)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShow(!show)} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {show && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Applications involved in" value={appsInvolved} onChange={(e) => setAppsInvolved(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Resource groups involved in" value={rgsInvolved} onChange={(e) => setRgsInvolved(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <input type="text" placeholder="Permissions to resources" value={permissions} onChange={(e) => setPermissions(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition cursor-pointer">Add</button>
          </div>
        </form>
      )}

      {app.people.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No people yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {app.people.map((p) => (
            <Link key={p.id} to={`/people/${p.id}`} className="bg-white rounded-2xl border border-gray-200 p-5 card-hover group relative block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                {p.applications_involved && (
                  <div>
                    <span className="text-gray-400 text-xs font-medium">Applications</span>
                    <p className="text-gray-700">{p.applications_involved}</p>
                  </div>
                )}
                {p.resource_groups_involved && (
                  <div>
                    <span className="text-gray-400 text-xs font-medium">Resource Groups</span>
                    <p className="text-gray-700">{p.resource_groups_involved}</p>
                  </div>
                )}
                {p.permissions && (
                  <div>
                    <span className="text-gray-400 text-xs font-medium">Permissions</span>
                    <p className="text-gray-700">{p.permissions}</p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(p.id) }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


/* ─── Tasks Tab ──────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  'not-started': 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  'completed': 'bg-green-100 text-green-700',
}

const SEVERITY_COLORS: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-600',
  'medium': 'bg-yellow-100 text-yellow-700',
  'high': 'bg-orange-100 text-orange-700',
  'critical': 'bg-red-100 text-red-700',
}

function TasksTab({ app, onRefresh }: { app: AppDetail; onRefresh: () => void }) {
  const [show, setShow] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [search, setSearch] = useState('')

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask(app.id, {
      title: title.trim(),
      description: description.trim(),
      status: 'not-started',
      severity,
      assigned_to: assignedTo,
      assigned_on: assignedTo ? new Date().toISOString() : null,
    })
    setTitle(''); setDescription(''); setSeverity('medium'); setAssignedTo(''); setShow(false)
    onRefresh()
  }

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await updateTask(app.id, taskId, { status: newStatus })
    onRefresh()
  }

  const handleDeleteTask = async (taskId: number) => {
    await deleteTask(app.id, taskId)
    onRefresh()
  }

  const filtered = app.tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
        <button onClick={() => setShow(!show)} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {show && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Task title *" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white cursor-pointer">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none md:col-span-1" rows={2} />
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white cursor-pointer">
              <option value="">Unassigned</option>
              {app.people.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition cursor-pointer">Add</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No tasks yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Task</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Assigned To</th>
                <th className="px-5 py-3 font-medium">Assigned On</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[t.severity] || 'bg-gray-100 text-gray-600'}`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{t.assigned_to || '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {t.assigned_on ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.assigned_on).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDeleteTask(t.id)} className="text-gray-300 hover:text-red-500 transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
