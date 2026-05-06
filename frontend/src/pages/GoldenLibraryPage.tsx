import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGoldenSignals } from '../api'
import type { SignalListItem } from '../types'
import SignalCard from '../components/SignalCard'

export default function GoldenLibraryPage() {
  const navigate = useNavigate()
  const [signals, setSignals] = useState<SignalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getGoldenSignals().then(setSignals).finally(() => setLoading(false))
  }, [])

  const filtered = signals.filter(s =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-accent text-lg">★</span>
          <h1 className="font-mono text-xl font-semibold text-text-primary">Golden Library</h1>
        </div>
        <p className="text-text-secondary text-sm max-w-xl">
          Org-approved baseline signals available to all researchers. Fork any signal to use it
          as a starting point for your own work.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search golden signals..."
          className="input max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="font-mono text-xs text-text-dim ml-auto">
          {filtered.length} signal{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="font-mono text-text-dim text-sm animate-pulse">loading library...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-mono text-text-dim text-sm">No golden signals found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(signal => (
            <div key={signal.id} className="relative">
              <SignalCard signal={signal} showTeam />
              <button
                onClick={e => {
                  e.stopPropagation()
                  navigate(`/signals/${signal.id}/fork`)
                }}
                className="absolute bottom-4 right-4 btn-primary text-xs"
              >
                Fork
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card p-4 border-accent/20 bg-accent-dim">
        <p className="font-mono text-xs text-text-secondary">
          <span className="text-accent">★ Golden signals</span> are read-only org-wide baselines.
          Fork a signal to create your own editable copy. Contact your manager to promote a signal to golden.
        </p>
      </div>
    </div>
  )
}
