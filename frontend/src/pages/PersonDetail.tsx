import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Layers, Shield, AppWindow, Trash2 } from 'lucide-react'
import { listAllPeople, type PersonAggregate } from '../api/aggregates'
import { deletePerson } from '../api/applications'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<PersonAggregate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllPeople()
      .then((people) => {
        const found = people.find((p) => p.id === Number(id))
        setPerson(found || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Person not found</p>
        <Link to="/people" className="text-indigo-600 text-sm mt-2 inline-block">Back to People</Link>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!person || !confirm(`Delete "${person.name}"? This cannot be undone.`)) return
    await deletePerson(person.application_id, person.id)
    navigate('/people')
  }

  const appsList = person.applications_involved ? person.applications_involved.split(',').map((s) => s.trim()).filter(Boolean) : []
  const rgsList = person.resource_groups_involved ? person.resource_groups_involved.split(',').map((s) => s.trim()).filter(Boolean) : []
  const permsList = person.permissions ? person.permissions.split(',').map((s) => s.trim()).filter(Boolean) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/people')} className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-200">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
                <Link to={`/applications/${person.application_id}`} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
                  <AppWindow className="w-3.5 h-3.5" /> {person.application}
                </Link>
              </div>
            </div>
          </div>
          <button onClick={handleDelete}
            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer font-medium flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Applications Involved */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <AppWindow className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Applications Involved</h2>
          </div>
          {appsList.length === 0 ? (
            <p className="text-sm text-gray-400">None specified</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {appsList.map((a) => (
                <span key={a} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* Resource Groups Involved */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Resource Groups</h2>
          </div>
          {rgsList.length === 0 ? (
            <p className="text-sm text-gray-400">None specified</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rgsList.map((rg) => (
                <span key={rg} className="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full">{rg}</span>
              ))}
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Permissions</h2>
          </div>
          {permsList.length === 0 ? (
            <p className="text-sm text-gray-400">None specified</p>
          ) : (
            <div className="space-y-2">
              {permsList.map((perm) => (
                <div key={perm} className="text-sm text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {perm}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
