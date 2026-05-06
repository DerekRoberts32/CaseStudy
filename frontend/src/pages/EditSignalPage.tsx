import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSignal, updateSignal } from '../api'
import { useUser } from '../context/UserContext'
import type { SignalDetail, Status, Visibility } from '../types'

export default function EditSignalPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()

  const [signal, setSignal] = useState<SignalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('draft')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [config, setConfig] = useState('')

  useEffect(() => {
    if (!id) return
    getSignal(id)
      .then(s => {
        setSignal(s)
        setName(s.name)
        setDescription(s.description)
        setStatus(s.status)
        setVisibility(s.visibility)
        setConfig(JSON.stringify(s.config, null, 2))
      })
      .catch(() => setError('Signal not found'))
      .finally(() => setLoading(false))
  }, [id])

  const isManager = user?.role === 'manager' || user?.role === 'manager_exec'
  const isCreator = signal && user && signal.created_by.id === user.id
  const canEdit = isCreator || (isManager && signal?.team.id === user?.team_id)

  const canChangeVisibility = isManager && signal?.team.id === user?.team_id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !signal) return
    setSaving(true)
    setError('')

    try {
      let parsedConfig: Record<string, unknown> | undefined
      if (config !== JSON.stringify(signal.config, null, 2)) {
        parsedConfig = JSON.parse(config)
      }

      await updateSignal(id, {
        name: name !== signal.name ? name : undefined,
        description: description !== signal.description ? description : undefined,
        status: status !== signal.status ? status : undefined,
        visibility: visibility !== signal.visibility ? visibility : undefined,
        config: parsedConfig,
      })
      navigate(`/signals/${id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update signal')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-text-dim text-sm animate-pulse">loading...</span>
      </div>
    )
  }

  if (!signal || !canEdit) {
    return (
      <div className="card p-12 text-center">
        <p className="font-mono text-text-dim text-sm">
          {error || "You don't have permission to edit this signal."}
        </p>
      </div>
    )
  }

  if (signal.visibility === 'golden') {
    return (
      <div className="card p-12 text-center">
        <p className="font-mono text-text-dim text-sm">
          Golden signals are read-only. Fork it to create your own editable copy.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-mono text-xl font-semibold text-text-primary mb-6">Edit Signal</h1>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 p-3 mb-6">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            className="input w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input w-full min-h-[80px]"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input w-full"
            value={status}
            onChange={e => setStatus(e.target.value as Status)}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>

        {isCreator && !['shared', 'golden'].includes(signal.visibility) && (
          <div>
            <label className="label">Visibility</label>
            <select
              className="input w-full"
              value={visibility}
              onChange={e => setVisibility(e.target.value as Visibility)}
            >
              <option value="private">Private</option>
              <option value="team">Team</option>
            </select>
            <p className="text-text-dim text-xs mt-1 font-mono">
              Share with your team when ready, or keep private while iterating.
            </p>
          </div>
        )}

        <div>
          <label className="label">Config (JSON)</label>
          <textarea
            className="input w-full min-h-[120px] font-mono text-xs"
            value={config}
            onChange={e => setConfig(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(`/signals/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
