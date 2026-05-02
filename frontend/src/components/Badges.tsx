import type { Status, Visibility } from '../types'

const STATUS_STYLES: Record<Status, string> = {
  draft:      'border-text-dim text-text-dim',
  active:     'border-accent/50 text-accent',
  deprecated: 'border-danger/40 text-danger/70',
}

const VISIBILITY_STYLES: Record<Visibility, string> = {
  private: 'border-muted text-text-dim',
  team:    'border-warn/40 text-warn/80',
  shared:  'border-blue-500/40 text-blue-400',
  golden:  'border-accent/60 text-accent',
}

const VISIBILITY_ICONS: Record<Visibility, string> = {
  private: '⬤',
  team:    '⬤',
  shared:  '⬤',
  golden:  '★',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className={`badge ${VISIBILITY_STYLES[visibility]}`}>
      {VISIBILITY_ICONS[visibility]} {visibility}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    researcher:   'border-text-dim/40 text-text-secondary',
    manager:      'border-warn/40 text-warn/80',
    exec:         'border-accent/40 text-accent',
    manager_exec: 'border-accent/60 text-accent',
  }
  return (
    <span className={`badge ${styles[role] ?? 'border-border text-text-dim'}`}>
      {role.replace('_', ' + ')}
    </span>
  )
}
