from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Role(str, Enum):
    researcher = "researcher"
    manager = "manager"
    exec = "exec"
    manager_exec = "manager_exec"


class Status(str, Enum):
    draft = "draft"
    active = "active"
    deprecated = "deprecated"


class Visibility(str, Enum):
    private = "private"
    team = "team"
    shared = "shared"
    golden = "golden"


# ─── User ─────────────────────────────────────────────────────────────────────

class UserSummary(BaseModel):
    id: str
    name: str

class User(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    team_id: Optional[str]


# ─── Team ─────────────────────────────────────────────────────────────────────

class TeamSummary(BaseModel):
    id: str
    name: str

class TeamListItem(BaseModel):
    id: str
    name: str
    manager: UserSummary
    member_count: int

class TeamDetail(BaseModel):
    id: str
    name: str
    manager: UserSummary
    members: List[User]


# ─── Metrics ──────────────────────────────────────────────────────────────────

class MetricsSummary(BaseModel):
    sharpe_ratio: float
    hit_rate: float
    trade_count: int
    avg_return: float
    recorded_at: str

class MetricsSnapshot(BaseModel):
    id: str
    signal_id: str
    sharpe_ratio: float
    hit_rate: float
    trade_count: int
    avg_return: float
    last_run_at: str
    recorded_at: str

class MetricsCreate(BaseModel):
    sharpe_ratio: float
    hit_rate: float
    trade_count: int
    avg_return: float
    last_run_at: str


# ─── Signal ───────────────────────────────────────────────────────────────────

class SignalListItem(BaseModel):
    id: str
    name: str
    description: str
    status: Status
    visibility: Visibility
    created_by: UserSummary
    team: TeamSummary
    parent_signal_id: Optional[str]
    created_at: str
    updated_at: str
    latest_metrics: Optional[MetricsSummary]

class SignalDetail(BaseModel):
    id: str
    name: str
    description: str
    status: Status
    visibility: Visibility
    created_by: UserSummary
    team: TeamSummary
    parent_signal_id: Optional[str]
    dataset_id: str
    config: dict
    created_at: str
    updated_at: str
    latest_metrics: Optional[MetricsSummary]

class SignalCreate(BaseModel):
    name: str
    description: str
    status: Status = Status.draft
    visibility: Visibility = Visibility.private
    parent_signal_id: Optional[str] = None
    dataset_id: str
    config: dict

class SignalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
    visibility: Optional[Visibility] = None
    config: Optional[dict] = None


# ─── Lineage ──────────────────────────────────────────────────────────────────

class LineageNode(BaseModel):
    id: str
    name: str
    visibility: Visibility
    status: Status
    team: TeamSummary
    created_by: UserSummary
    children: List["LineageNode"] = []

LineageNode.model_rebuild()


# ─── Signal Share ─────────────────────────────────────────────────────────────

class ShareDetail(BaseModel):
    id: str
    signal_id: str
    granted_by: UserSummary
    target_team: TeamSummary
    created_at: str

class ShareCreate(BaseModel):
    target_team_id: str


# ─── Productivity ─────────────────────────────────────────────────────────────

class AvgMetrics(BaseModel):
    sharpe_ratio: float
    hit_rate: float
    avg_return: float

class SignalCounts(BaseModel):
    draft: int
    active: int
    deprecated: int

class TeamProductivity(BaseModel):
    team_id: str
    team_name: str
    signal_counts: SignalCounts
    golden_signals_originated: int
    signals_shared_outbound: int
    signals_shared_inbound: int
    avg_metrics: AvgMetrics


# ─── Error ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    message: str
