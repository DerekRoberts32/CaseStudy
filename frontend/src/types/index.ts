export type Role = 'researcher' | 'manager' | 'exec' | 'manager_exec'
export type Status = 'draft' | 'active' | 'deprecated'
export type Visibility = 'private' | 'team' | 'shared' | 'golden'

export interface UserSummary {
  id: string
  name: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  team_id: string | null
}

export interface TeamSummary {
  id: string
  name: string
}

export interface TeamListItem {
  id: string
  name: string
  manager: UserSummary
  member_count: number
}

export interface TeamDetail {
  id: string
  name: string
  manager: UserSummary
  members: User[]
}

export interface MetricsSummary {
  sharpe_ratio: number
  hit_rate: number
  trade_count: number
  avg_return: number
  recorded_at: string
}

export interface MetricsSnapshot extends MetricsSummary {
  id: string
  signal_id: string
  last_run_at: string
}

export interface SignalListItem {
  id: string
  name: string
  description: string
  status: Status
  visibility: Visibility
  created_by: UserSummary
  team: TeamSummary
  parent_signal_id: string | null
  created_at: string
  updated_at: string
  latest_metrics: MetricsSummary | null
}

export interface SignalDetail extends SignalListItem {
  dataset_id: string
  config: Record<string, unknown>
}

export interface LineageNode {
  id: string
  name: string
  visibility: Visibility
  status: Status
  team: TeamSummary
  created_by: UserSummary
  children: LineageNode[]
}

export interface ShareDetail {
  id: string
  signal_id: string
  granted_by: UserSummary
  target_team: TeamSummary
  created_at: string
}

export interface AvgMetrics {
  sharpe_ratio: number
  hit_rate: number
  avg_return: number
}

export interface SignalCounts {
  draft: number
  active: number
  deprecated: number
}

export interface TeamProductivity {
  team_id: string
  team_name: string
  signal_counts: SignalCounts
  golden_signals_originated: number
  signals_shared_outbound: number
  signals_shared_inbound: number
  avg_metrics: AvgMetrics
}

export interface SignalCreatePayload {
  name: string
  description: string
  status: Status
  visibility: Visibility
  parent_signal_id?: string
  dataset_id: string
  config: Record<string, unknown>
}

export interface SignalUpdatePayload {
  name?: string
  description?: string
  status?: Status
  visibility?: Visibility
  config?: Record<string, unknown>
}
