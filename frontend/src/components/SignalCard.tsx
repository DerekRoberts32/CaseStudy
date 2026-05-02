import { useNavigate } from 'react-router-dom'
import type { SignalListItem } from '../types'
import { StatusBadge, VisibilityBadge } from './Badges'

interface Props {
  signal: SignalListItem
  showTeam?: boolean
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-dim font-mono text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-text-primary font-mono text-sm">{value}</span>
    </div>
  )
}

export default function SignalCard({ signal, showTeam = false }: Props) {
  const navigate = useNavigate()
  const m = signal.latest_metrics

  return (
    <div
      onClick={() => navigate(`/signals/${signal.id}`)}
      className="card p-5 cursor-pointer hover:border-accent/30 hover:bg-surface/80
                 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {signal.parent_signal_id && (
              <span className="font-mono text-[10px] text-text-dim border border-border
                               px-1.5 py-0.5 rounded-sm">
                FORK
              </span>
            )}
            <h3 className="font-mono text-sm font-medium text-text-primary
                           group-hover:text-accent transition-colors truncate">
              {signal.name}
            </h3>
          </div>
          <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-3">
            {signal.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={signal.status} />
            <VisibilityBadge visibility={signal.visibility} />
            {showTeam && (
              <span className="badge border-border text-text-dim">{signal.team.name}</span>
            )}
          </div>
        </div>

        {/* Metrics column */}
        {m ? (
          <div className="shrink-0 grid grid-cols-2 gap-x-6 gap-y-2 border-l border-border pl-5">
            <MetricPill label="Sharpe" value={m.sharpe_ratio.toFixed(2)} />
            <MetricPill label="Hit Rate" value={`${(m.hit_rate * 100).toFixed(0)}%`} />
            <MetricPill label="Trades" value={m.trade_count.toLocaleString()} />
            <MetricPill label="Avg Ret" value={`${(m.avg_return * 100).toFixed(2)}%`} />
          </div>
        ) : (
          <div className="shrink-0 border-l border-border pl-5 flex items-center">
            <span className="font-mono text-xs text-text-dim">no metrics</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <span className="font-mono text-[11px] text-text-dim">
          {signal.created_by.name}
        </span>
        <span className="text-text-dim text-[11px]">·</span>
        <span className="font-mono text-[11px] text-text-dim">
          updated {new Date(signal.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
