import axios from 'axios'
import type {
  User, TeamListItem, TeamDetail, TeamProductivity,
  SignalListItem, SignalDetail, LineageNode, MetricsSnapshot,
  ShareDetail, SignalCreatePayload, SignalUpdatePayload,
} from '../types'

const BASE_URL = 'http://localhost:8000'

// The active user id is stored in localStorage and sent as X-User-Id on every request
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId') ?? 'user-r1'
  config.headers['X-User-Id'] = userId
  return config
})

// ─── Session ──────────────────────────────────────────────────────────────────

export const getMe = (): Promise<User> =>
  api.get('/me').then(r => r.data)

// ─── Teams ────────────────────────────────────────────────────────────────────

export const getTeams = (): Promise<TeamListItem[]> =>
  api.get('/teams').then(r => r.data)

export const getTeam = (teamId: string): Promise<TeamDetail> =>
  api.get(`/teams/${teamId}`).then(r => r.data)

export const getTeamProductivity = (teamId: string): Promise<TeamProductivity> =>
  api.get(`/teams/${teamId}/productivity`).then(r => r.data)

export const getAllTeamsProductivity = (): Promise<TeamProductivity[]> =>
  api.get('/teams/productivity').then(r => r.data)

// ─── Signals ──────────────────────────────────────────────────────────────────

export interface SignalFilters {
  status?: string
  visibility?: string
  team_id?: string
  created_by?: string
  sort?: string
}

export const getSignals = (filters?: SignalFilters): Promise<SignalListItem[]> =>
  api.get('/signals', { params: filters }).then(r => r.data)

export const getGoldenSignals = (): Promise<SignalListItem[]> =>
  api.get('/signals/golden').then(r => r.data)

export const getSignal = (signalId: string): Promise<SignalDetail> =>
  api.get(`/signals/${signalId}`).then(r => r.data)

export const createSignal = (payload: SignalCreatePayload): Promise<SignalDetail> =>
  api.post('/signals', payload).then(r => r.data)

export const updateSignal = (signalId: string, payload: SignalUpdatePayload): Promise<SignalDetail> =>
  api.patch(`/signals/${signalId}`, payload).then(r => r.data)

export const deleteSignal = (signalId: string): Promise<{ success: boolean }> =>
  api.delete(`/signals/${signalId}`).then(r => r.data)

export const getSignalLineage = (signalId: string): Promise<LineageNode> =>
  api.get(`/signals/${signalId}/lineage`).then(r => r.data)

// ─── Metrics ──────────────────────────────────────────────────────────────────

export const getSignalMetrics = (signalId: string): Promise<MetricsSnapshot[]> =>
  api.get(`/signals/${signalId}/metrics`).then(r => r.data)

export const addSignalMetrics = (signalId: string, payload: Omit<MetricsSnapshot, 'id' | 'signal_id' | 'recorded_at'>): Promise<MetricsSnapshot> =>
  api.post(`/signals/${signalId}/metrics`, payload).then(r => r.data)

// ─── Shares ───────────────────────────────────────────────────────────────────

export const getSignalShares = (signalId: string): Promise<ShareDetail[]> =>
  api.get(`/signals/${signalId}/shares`).then(r => r.data)

export const shareSignal = (signalId: string, targetTeamId: string): Promise<ShareDetail> =>
  api.post(`/signals/${signalId}/shares`, { target_team_id: targetTeamId }).then(r => r.data)

export const revokeShare = (signalId: string, shareId: string): Promise<{ success: boolean }> =>
  api.delete(`/signals/${signalId}/shares/${shareId}`).then(r => r.data)
