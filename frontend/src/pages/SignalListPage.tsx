import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSignals } from '../api'
import type { SignalListItem, Status, Visibility } from '../types'
import SignalCard from '../components/SignalCard'
import { useUser } from '../context/UserContext'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
]

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Visibility' },
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'shared', label: 'Shared' },
  { value: 'golden', label: 'Golden' },
]

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'created_at', label: 'Created' },
  { value: 'name', label: 'Name' },
]

export default function SignalListPage() {
  const navigate = useNavigate()
  const { user, isExec } = useUser()

  const [signals, setSignals] = useState<SignalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [sort, setSort] = useState('updated_at')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getSignals({
      status: statusFilter || undefined,
      visibility: visibilityFilter || undefined,
      sort,
    })
      .then(setSignals)
      .catch(() => setError('Failed to load signals'))
      .finally(() => setLoading(false))
  }, [statusFilter, visibilityFilter, sort, user?.id])

  const filtered = signals.filter(s =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-xl font-semibold text-text-primary">Signal Feed</h1>
          <p className="text-text-secondary text-sm mt-1">
            All signals you have access to
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/signals/new')}
        >
          + New Signal
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search signals..."
          className="input max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="select w-auto"
          value={visibilityFilter}
          onChange={e => setVisibilityFilter(e.target.value)}
        >
          {VISIBILITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="select w-auto"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className="font-mono text-xs text-text-dim ml-auto">
          {filtered.length} signal{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Signal list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="font-mono text-text-dim text-sm animate-pulse">loading signals...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-danger font-mono text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-mono text-text-dim text-sm">No signals found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(signal => (
            <SignalCard
              key={signal.id}
              signal={signal}
              showTeam={isExec}
            />
          ))}
        </div>
      )}
    </div>
  )
}
