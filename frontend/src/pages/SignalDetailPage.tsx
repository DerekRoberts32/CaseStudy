import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  getSignal, getSignalMetrics, getSignalLineage,
  getSignalShares, shareSignal, revokeShare, updateSignal, getTeams
} from '../api'
import type { SignalDetail, MetricsSnapshot, LineageNode, ShareDetail, TeamListItem } from '../types'
import { StatusBadge, VisibilityBadge } from '../components/Badges'
import LineageTree from '../components/LineageTree'
import { useUser } from '../context/UserContext'

type Tab = 'overview' | 'metrics' | 'lineage' | 'sharing'

export default function SignalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isManager, isExec } = useUser()

  const [signal, setSignal] = useState<SignalDetail | null>(null)
  const [metrics, setMetrics] = useState<MetricsSnapshot[]>([])
  const [lineage, setLineage] = useState<LineageNode | null>(null)
  const [shares, setShares] = useState<ShareDetail[]>([])
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [shareTeamId, setShareTeamId] = useState('')
  const [sharing, setSharing] = useState(false)

  const canEdit = signal && (
    signal.created_by.id === user?.id ||
    (isManager && signal.team.id === user?.team_id) ||
    isExec
  )
  const canShare = signal && isManager && signal.team.id === user?.team_id

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getSignal(id),
      getSignalMetrics(id),
      getSignalLineage(id),
    ]).then(([sig, met, lin]) => {
      setSignal(sig)
      setMetrics(met)
      setLineage(lin)
    }).finally(() => setLoading(false))
  }, [id, user?.id])

  useEffect(() => {
    if (!id || !canShare) return
    getSignalShares(id).then(setShares).catch(() => {})
    getTeams().then(setTeams).catch(() => {})
  }, [id, canShare, user?.id])

  const handlePromoteGolden = async () => {
    if (!signal || !id) return
    const updated = await updateSignal(id, { visibility: 'golden' })
    setSignal(updated)
  }

  const handleShare = async () => {
    if (!id || !shareTeamId) return
    setSharing(true)
    try {
      const newShare = await shareSignal(id, shareTeamId)
      setShares(prev => [...prev, newShare])
      setShareTeamId('')
      const updated = await getSignal(id)
      setSignal(updated)
    } finally {
      setSharing(false)
    }
  }

  const handleRevoke = async (shareId: string) => {
    if (!id) return
    await revokeShare(id, shareId)
    setShares(prev => prev.filter(s => s.id !== shareId))
    const updated = await getSignal(id)
    setSignal(updated)
  }

  const chartData = [...metrics].reverse().map((m, i) => ({
    run: `Run ${i + 1}`,
    sharpe: m.sharpe_ratio,
    hit_rate: +(m.hit_rate * 100).toFixed(1),
    avg_return: +(m.avg_return * 100).toFixed(2),
  }))

  const sharedTeamIds = new Set(shares.map(s => s.target_team.id))
  const availableTeams = teams.filter(t =>
    t.id !== signal?.team.id && !sharedTeamIds.has(t.id)
  )

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: `Metrics (${metrics.length})` },
    { id: 'lineage', label: 'Lineage' },
    ...(canShare ? [{ id: 'sharing' as Tab, label: `Sharing (${shares.length})` }] : []),
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-text-dim text-sm animate-pulse">loading signal...</span>
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="card p-12 text-center">
        <p className="font-mono text-text-dim text-sm">Signal not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/signals')}
        className="font-mono text-xs text-text-dim hover:text-text-secondary mb-6 flex items-center gap-1"
      >
        ← back to signals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {signal.parent_signal_id && (
              <span className="font-mono text-[10px] text-text-dim border border-border
                               px-1.5 py-0.5 rounded-sm">
                FORK
              </span>
            )}
            <h1 className="font-mono text-2xl font-semibold text-text-primary">
              {signal.name}
            </h1>
          </div>
          <p className="text-text-secondary text-sm mb-3 max-w-2xl">{signal.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={signal.status} />
            <VisibilityBadge visibility={signal.visibility} />
            <span className="badge border-border text-text-dim">{signal.team.name}</span>
            <span className="badge border-border text-text-dim">{signal.created_by.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && signal.visibility !== 'golden' && (
            <button
              className="btn-ghost"
              onClick={() => navigate(`/signals/${signal.id}/edit`)}
            >
              Edit
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() => navigate(`/signals/${signal.id}/fork`)}
          >
            Fork Signal
          </button>
          {canEdit && signal.visibility !== 'golden' && (isManager || isExec) && (
            <button className="btn-ghost" onClick={handlePromoteGolden}>
              Promote to Golden
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-mono text-xs px-4 py-2.5 border-b-2 transition-colors duration-150 ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
              Signal Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Dataset', value: signal.dataset_id },
                { label: 'Created', value: new Date(signal.created_at).toLocaleDateString() },
                { label: 'Last Updated', value: new Date(signal.updated_at).toLocaleDateString() },
                { label: 'Parent Signal', value: signal.parent_signal_id ?? 'None (original)' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                    {label}
                  </span>
                  <p className="font-mono text-sm text-text-secondary mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                Config
              </span>
              <pre className="mt-2 bg-bg rounded p-3 text-xs font-mono text-text-secondary overflow-auto">
                {JSON.stringify(signal.config, null, 2)}
              </pre>
            </div>
          </div>

          {/* Latest metrics summary */}
          <div className="card p-6">
            <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
              Latest Metrics
            </h2>
            {signal.latest_metrics ? (
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Sharpe Ratio', value: signal.latest_metrics.sharpe_ratio.toFixed(2) },
                  { label: 'Hit Rate', value: `${(signal.latest_metrics.hit_rate * 100).toFixed(0)}%` },
                  { label: 'Trade Count', value: signal.latest_metrics.trade_count.toLocaleString() },
                  { label: 'Avg Return', value: `${(signal.latest_metrics.avg_return * 100).toFixed(2)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-text-dim">{label}</span>
                    <span className="font-mono text-sm text-text-primary">{value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-border">
                  <span className="font-mono text-[10px] text-text-dim">
                    Recorded {new Date(signal.latest_metrics.recorded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-text-dim">No metrics recorded</p>
            )}
          </div>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="flex flex-col gap-6">
          {metrics.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-mono text-text-dim text-sm">No metrics recorded yet</p>
            </div>
          ) : (
            <>
              {/* Sharpe chart */}
              <div className="card p-6">
                <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-6">
                  Sharpe Ratio Over Time
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2028" />
                    <XAxis dataKey="run" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#4a4f60' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#4a4f60' }} />
                    <Tooltip
                      contentStyle={{ background: '#13151a', border: '1px solid #1e2028', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11 }}
                      labelStyle={{ color: '#8b90a0' }}
                      itemStyle={{ color: '#00d4aa' }}
                    />
                    <Line type="monotone" dataKey="sharpe" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Hit rate chart */}
              <div className="card p-6">
                <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-6">
                  Hit Rate (%) Over Time
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2028" />
                    <XAxis dataKey="run" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#4a4f60' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#4a4f60' }} />
                    <Tooltip
                      contentStyle={{ background: '#13151a', border: '1px solid #1e2028', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11 }}
                      labelStyle={{ color: '#8b90a0' }}
                      itemStyle={{ color: '#f59e0b' }}
                    />
                    <Line type="monotone" dataKey="hit_rate" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Raw snapshots table */}
              <div className="card p-6">
                <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
                  All Snapshots
                </h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['Recorded', 'Sharpe', 'Hit Rate', 'Trades', 'Avg Return'].map(h => (
                        <th key={h} className="font-mono text-[10px] text-text-dim text-left pb-2 pr-4 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(m => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="font-mono text-xs text-text-secondary py-2.5 pr-4">
                          {new Date(m.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="font-mono text-xs text-text-primary py-2.5 pr-4">{m.sharpe_ratio.toFixed(2)}</td>
                        <td className="font-mono text-xs text-text-primary py-2.5 pr-4">{(m.hit_rate * 100).toFixed(0)}%</td>
                        <td className="font-mono text-xs text-text-primary py-2.5 pr-4">{m.trade_count.toLocaleString()}</td>
                        <td className="font-mono text-xs text-text-primary py-2.5">{(m.avg_return * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'lineage' && (
        <div className="card p-6">
          <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-6">
            Fork Tree
          </h2>
          {lineage ? (
            <LineageTree node={lineage} currentSignalId={signal.id} />
          ) : (
            <p className="font-mono text-xs text-text-dim">No lineage data</p>
          )}
          <div className="mt-6 pt-4 border-t border-border flex items-center gap-6">
            {[
              { icon: '★', label: 'Golden', color: 'text-accent' },
              { icon: '◈', label: 'Shared', color: 'text-blue-400' },
              { icon: '○', label: 'Team', color: 'text-text-dim' },
              { icon: '◉', label: 'Private', color: 'text-text-dim' },
            ].map(({ icon, label, color }) => (
              <span key={label} className={`font-mono text-xs ${color} flex items-center gap-1`}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'sharing' && canShare && (
        <div className="flex flex-col gap-6">
          {/* Share with another team */}
          {signal.visibility !== 'golden' && availableTeams.length > 0 && (
            <div className="card p-6">
              <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
                Share With Team
              </h2>
              <div className="flex items-center gap-3">
                <select
                  className="select w-auto"
                  value={shareTeamId}
                  onChange={e => setShareTeamId(e.target.value)}
                >
                  <option value="">Select team...</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!shareTeamId || sharing}
                  onClick={handleShare}
                >
                  {sharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          )}

          {/* Active shares */}
          <div className="card p-6">
            <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
              Active Shares
            </h2>
            {shares.length === 0 ? (
              <p className="font-mono text-xs text-text-dim">
                This signal has not been shared with any other teams.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {shares.map(share => (
                  <div key={share.id} className="flex items-center justify-between
                                                  border border-border rounded px-4 py-3">
                    <div>
                      <span className="font-mono text-sm text-text-primary">
                        {share.target_team.name}
                      </span>
                      <span className="font-mono text-xs text-text-dim ml-3">
                        shared by {share.granted_by.name} on {new Date(share.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="font-mono text-xs text-danger/70 hover:text-danger transition-colors"
                      onClick={() => handleRevoke(share.id)}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
