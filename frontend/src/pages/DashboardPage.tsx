import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTeamsProductivity, getSignals } from '../api'
import type { TeamProductivity, SignalListItem } from '../types'
import { useUser } from '../context/UserContext'
import { StatusBadge } from '../components/Badges'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">{label}</span>
      <p className="font-mono text-2xl font-semibold text-text-primary mt-1">{value}</p>
      {sub && <p className="font-mono text-xs text-text-dim mt-0.5">{sub}</p>}
    </div>
  )
}

function TeamProductivityCard({ team, isOwnTeam }: { team: TeamProductivity; isOwnTeam: boolean }) {
  const total = team.signal_counts.draft + team.signal_counts.active + team.signal_counts.deprecated

  return (
    <div className={`card p-6 ${isOwnTeam ? 'border-accent/30 bg-accent-dim/20' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-medium text-text-primary">{team.team_name}</h3>
            {isOwnTeam && (
              <span className="font-mono text-[10px] text-accent border border-accent/30
                               px-1.5 py-0.5 rounded-sm">
                YOUR TEAM
              </span>
            )}
          </div>
        </div>
        <div className="font-mono text-xs text-text-dim">{total} total signals</div>
      </div>

      {/* Signal status breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Active', value: team.signal_counts.active, color: 'text-accent' },
          { label: 'Draft', value: team.signal_counts.draft, color: 'text-text-secondary' },
          { label: 'Deprecated', value: team.signal_counts.deprecated, color: 'text-danger/70' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg rounded p-3 text-center">
            <span className={`font-mono text-xl font-semibold ${color}`}>{value}</span>
            <p className="font-mono text-[10px] text-text-dim mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Avg metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Avg Sharpe', value: team.avg_metrics.sharpe_ratio.toFixed(2) },
          { label: 'Avg Hit Rate', value: `${(team.avg_metrics.hit_rate * 100).toFixed(0)}%` },
          { label: 'Avg Return', value: `${(team.avg_metrics.avg_return * 100).toFixed(2)}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="font-mono text-[10px] text-text-dim">{label}</span>
            <p className="font-mono text-sm text-text-primary mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Sharing activity */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="font-mono text-xs text-text-dim">
          <span className="text-accent">{team.golden_signals_originated}</span> golden originated
        </div>
        <div className="font-mono text-xs text-text-dim">
          <span className="text-blue-400">{team.signals_shared_outbound}</span> shared out
        </div>
        <div className="font-mono text-xs text-text-dim">
          <span className="text-text-secondary">{team.signals_shared_inbound}</span> received
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isExec, isManager } = useUser()

  const [productivity, setProductivity] = useState<TeamProductivity[]>([])
  const [recentSignals, setRecentSignals] = useState<SignalListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isManager && !isExec) return
    Promise.all([
      getAllTeamsProductivity(),
      getSignals({ sort: 'updated_at' }),
    ]).then(([prod, sigs]) => {
      setProductivity(prod)
      setRecentSignals(sigs.slice(0, 8))
    }).finally(() => setLoading(false))
  }, [user?.id])

  if (!isManager && !isExec) {
    return (
      <div className="card p-12 text-center">
        <p className="font-mono text-text-dim text-sm">
          Dashboard access requires manager or executive role.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="font-mono text-text-dim text-sm animate-pulse">loading dashboard...</span>
      </div>
    )
  }

  // Org-wide totals for exec header cards
  const orgTotals = {
    active: productivity.reduce((sum, t) => sum + t.signal_counts.active, 0),
    draft: productivity.reduce((sum, t) => sum + t.signal_counts.draft, 0),
    golden: productivity.reduce((sum, t) => sum + t.golden_signals_originated, 0),
    shared: productivity.reduce((sum, t) => sum + t.signals_shared_outbound, 0),
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-mono text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          {isExec ? 'Org-wide signal health and team productivity' : 'Your team productivity overview'}
        </p>
      </div>

      {/* Summary stats -- shown to all managers, org totals for execs */}
      {isExec && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Signals" value={orgTotals.active} sub="across all teams" />
          <StatCard label="In Draft" value={orgTotals.draft} sub="in progress" />
          <StatCard label="Golden Signals" value={orgTotals.golden} sub="org-wide baselines" />
          <StatCard label="Cross-team Shares" value={orgTotals.shared} sub="active shares" />
        </div>
      )}

      {/* Team productivity cards */}
      <div className="mb-8">
        <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
          {isExec ? 'All Teams' : 'Your Team'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {productivity.map(team => (
            <TeamProductivityCard
              key={team.team_id}
              team={team}
              isOwnTeam={team.team_id === user?.team_id}
            />
          ))}
        </div>
      </div>

      {/* Recent signals */}
      <div>
        <h2 className="font-mono text-xs text-text-dim uppercase tracking-wider mb-4">
          Recently Updated Signals
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Signal', 'Team', 'Status', 'Sharpe', 'Updated'].map(h => (
                  <th key={h} className="font-mono text-[10px] text-text-dim text-left px-4 py-3
                                         uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSignals.map(sig => (
                <tr
                  key={sig.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer
                             transition-colors duration-150"
                  onClick={() => navigate(`/signals/${sig.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-text-primary">{sig.name}</span>
                    {sig.parent_signal_id && (
                      <span className="font-mono text-[10px] text-text-dim border border-border
                                       px-1 py-0.5 rounded-sm ml-2">FORK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{sig.team.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={sig.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">
                    {sig.latest_metrics ? sig.latest_metrics.sharpe_ratio.toFixed(2) : '--'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-dim">
                    {new Date(sig.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
