import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createSignal, getSignal } from '../api'
import type { SignalDetail, Status, Visibility } from '../types'
import { useUser } from '../context/UserContext'

export default function CreateSignalPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()   // present when forking
  const { user, isManager } = useUser()

  const [parentSignal, setParentSignal] = useState<SignalDetail | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('draft')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [datasetId, setDatasetId] = useState('ds-001')
  const [config, setConfig] = useState('{}')
  const [configError, setConfigError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFork = Boolean(id)

  useEffect(() => {
    if (!id) return
    getSignal(id).then(sig => {
      setParentSignal(sig)
      setName(`${sig.name} (fork)`)
      setDescription(sig.description)
      setDatasetId(sig.dataset_id)
      setConfig(JSON.stringify(sig.config, null, 2))
    })
  }, [id])

  const handleSubmit = async () => {
    setConfigError('')
    let parsedConfig: Record<string, unknown>
    try {
      parsedConfig = JSON.parse(config)
    } catch {
      setConfigError('Config must be valid JSON')
      return
    }

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const newSignal = await createSignal({
        name: name.trim(),
        description: description.trim(),
        status,
        visibility,
        parent_signal_id: isFork ? id : undefined,
        dataset_id: datasetId,
        config: parsedConfig,
      })
      navigate(`/signals/${newSignal.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to create signal')
    } finally {
      setSubmitting(false)
    }
  }

  // Signals can only be created as private or team. Promotion to shared/golden
  // is a separate post-creation action performed by managers.
  const visibilityOptions: { value: Visibility; label: string; allowed: boolean }[] = [
    { value: 'private', label: 'Private -- only you', allowed: true },
    { value: 'team', label: 'Team -- your whole team', allowed: true },
  ]

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(isFork ? `/signals/${id}` : '/signals')}
        className="font-mono text-xs text-text-dim hover:text-text-secondary mb-6 flex items-center gap-1"
      >
        ← cancel
      </button>

      <h1 className="font-mono text-xl font-semibold text-text-primary mb-2">
        {isFork ? 'Fork Signal' : 'New Signal'}
      </h1>

      {isFork && parentSignal && (
        <div className="card p-4 mb-8 border-accent/20 bg-accent-dim">
          <span className="font-mono text-xs text-text-dim">Forking from</span>
          <p className="font-mono text-sm text-accent mt-0.5">{parentSignal.name}</p>
          <p className="text-xs text-text-secondary mt-1">{parentSignal.description}</p>
        </div>
      )}

      <div className="flex flex-col gap-5 mt-6">
        {/* Name */}
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
            Name *
          </label>
          <input
            className="input"
            placeholder="e.g. Momentum v2 Small Cap"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
            Description
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="What does this signal do? What makes it different?"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Dataset + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
              Dataset
            </label>
            <select
              className="select"
              value={datasetId}
              onChange={e => setDatasetId(e.target.value)}
            >
              <option value="ds-001">ds-001 (Equity Prices)</option>
              <option value="ds-002">ds-002 (Options Flow)</option>
              <option value="ds-003">ds-003 (Macro Indicators)</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
              Status
            </label>
            <select
              className="select"
              value={status}
              onChange={e => setStatus(e.target.value as Status)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
            Visibility
          </label>
          <div className="flex flex-col gap-2">
            {visibilityOptions.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 card p-3 cursor-pointer transition-colors duration-150
                  ${!opt.allowed ? 'opacity-30 cursor-not-allowed' : ''}
                  ${visibility === opt.value ? 'border-accent/40 bg-accent-dim' : 'hover:border-border/80'}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  disabled={!opt.allowed}
                  onChange={() => setVisibility(opt.value)}
                  className="accent-accent"
                />
                <span className="font-mono text-xs text-text-secondary">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Config */}
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-wider mb-1.5 block">
            Config (JSON)
          </label>
          <textarea
            className={`input font-mono text-xs resize-none ${configError ? 'border-danger/60' : ''}`}
            rows={6}
            value={config}
            onChange={e => { setConfig(e.target.value); setConfigError('') }}
            spellCheck={false}
          />
          {configError && (
            <p className="font-mono text-xs text-danger mt-1">{configError}</p>
          )}
        </div>

        {error && (
          <div className="card p-3 border-danger/40 bg-danger/5">
            <p className="font-mono text-xs text-danger">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : isFork ? 'Create Fork' : 'Create Signal'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate(isFork ? `/signals/${id}` : '/signals')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
