from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models import (
    SignalListItem, SignalDetail, SignalCreate, SignalUpdate,
    UserSummary, TeamSummary, MetricsSummary,
    MetricsSnapshot, MetricsCreate, ShareDetail, ShareCreate,
    LineageNode,
)
from mock_data import USERS, TEAMS, SIGNALS, SIGNAL_METRICS, SIGNAL_SHARES
from auth import get_current_user, is_exec, is_manager, can_see_signal, can_edit_signal, can_manage_sharing

router = APIRouter(tags=["Signals"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_latest_metrics(signal_id: str) -> Optional[MetricsSummary]:
    snapshots = SIGNAL_METRICS.get(signal_id, [])
    if not snapshots:
        return None
    latest = snapshots[-1]
    return MetricsSummary(
        sharpe_ratio=latest["sharpe_ratio"],
        hit_rate=latest["hit_rate"],
        trade_count=latest["trade_count"],
        avg_return=latest["avg_return"],
        recorded_at=latest["recorded_at"],
    )


def build_signal_list_item(signal: dict) -> SignalListItem:
    creator = USERS[signal["created_by"]]
    team = TEAMS[signal["team_id"]]
    return SignalListItem(
        id=signal["id"],
        name=signal["name"],
        description=signal["description"],
        status=signal["status"],
        visibility=signal["visibility"],
        created_by=UserSummary(id=creator["id"], name=creator["name"]),
        team=TeamSummary(id=team["id"], name=team["name"]),
        parent_signal_id=signal["parent_signal_id"],
        created_at=signal["created_at"],
        updated_at=signal["updated_at"],
        latest_metrics=get_latest_metrics(signal["id"]),
    )


def build_signal_detail(signal: dict) -> SignalDetail:
    creator = USERS[signal["created_by"]]
    team = TEAMS[signal["team_id"]]
    return SignalDetail(
        id=signal["id"],
        name=signal["name"],
        description=signal["description"],
        status=signal["status"],
        visibility=signal["visibility"],
        created_by=UserSummary(id=creator["id"], name=creator["name"]),
        team=TeamSummary(id=team["id"], name=team["name"]),
        parent_signal_id=signal["parent_signal_id"],
        dataset_id=signal["dataset_id"],
        config=signal["config"],
        created_at=signal["created_at"],
        updated_at=signal["updated_at"],
        latest_metrics=get_latest_metrics(signal["id"]),
    )


def build_lineage_node(signal: dict, current_user: dict, visited: set) -> LineageNode:
    """Recursively build lineage tree. Redacts nodes user cannot see."""
    signal_id = signal["id"]
    if signal_id in visited:
        return None
    visited.add(signal_id)

    creator = USERS[signal["created_by"]]
    team = TEAMS[signal["team_id"]]

    children = []
    for s in SIGNALS.values():
        if s["parent_signal_id"] == signal_id:
            if can_see_signal(current_user, s):
                child_node = build_lineage_node(s, current_user, visited)
                if child_node:
                    children.append(child_node)
            else:
                # Redacted placeholder preserves tree shape without leaking data
                children.append(LineageNode(
                    id="redacted",
                    name="[Redacted]",
                    visibility=s["visibility"],
                    status=s["status"],
                    team=TeamSummary(id="redacted", name="[Redacted]"),
                    created_by=UserSummary(id="redacted", name="[Redacted]"),
                    children=[],
                ))

    return LineageNode(
        id=signal["id"],
        name=signal["name"],
        visibility=signal["visibility"],
        status=signal["status"],
        team=TeamSummary(id=team["id"], name=team["name"]),
        created_by=UserSummary(id=creator["id"], name=creator["name"]),
        children=children,
    )


# ─── Signal Routes ────────────────────────────────────────────────────────────

@router.get("/signals", response_model=List[SignalListItem])
def list_signals(
    status: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None),
    sort: Optional[str] = Query("updated_at"),
    current_user: dict = Depends(get_current_user),
):
    visible = [s for s in SIGNALS.values() if can_see_signal(current_user, s)]

    if status:
        visible = [s for s in visible if s["status"] == status]
    if visibility:
        visible = [s for s in visible if s["visibility"] == visibility]
    if team_id:
        if not is_exec(current_user):
            raise HTTPException(status_code=403, detail="Only execs can filter by team")
        visible = [s for s in visible if s["team_id"] == team_id]
    if created_by:
        visible = [s for s in visible if s["created_by"] == created_by]

    reverse = True
    if sort == "name":
        visible.sort(key=lambda s: s["name"], reverse=False)
    else:
        visible.sort(key=lambda s: s.get(sort, s["updated_at"]), reverse=reverse)

    return [build_signal_list_item(s) for s in visible]


@router.get("/signals/golden", response_model=List[SignalListItem])
def list_golden_signals(current_user: dict = Depends(get_current_user)):
    golden = [s for s in SIGNALS.values() if s["visibility"] == "golden"]
    golden.sort(key=lambda s: s["updated_at"], reverse=True)
    return [build_signal_list_item(s) for s in golden]


@router.get("/signals/{signal_id}", response_model=SignalDetail)
def get_signal(signal_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")
    return build_signal_detail(signal)


@router.post("/signals", response_model=SignalDetail, status_code=201)
def create_signal(body: SignalCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "exec":
        raise HTTPException(status_code=403, detail="Exec-only users cannot create signals")
    if not current_user["team_id"]:
        raise HTTPException(status_code=403, detail="User has no team assignment")

    # Signals can only be created as private or team visibility
    if body.visibility not in ("private", "team"):
        raise HTTPException(status_code=400, detail="Signals can only be created with private or team visibility")

    if body.parent_signal_id:
        parent = SIGNALS.get(body.parent_signal_id)
        if not parent or not can_see_signal(current_user, parent):
            raise HTTPException(status_code=404, detail="Parent signal not found")

    now = datetime.now().isoformat()
    new_id = f"sig-{uuid.uuid4().hex[:8]}"
    new_signal = {
        "id": new_id,
        "name": body.name,
        "description": body.description,
        "status": body.status,
        "visibility": body.visibility,
        "created_by": current_user["id"],
        "team_id": current_user["team_id"],
        "parent_signal_id": body.parent_signal_id,
        "dataset_id": body.dataset_id,
        "config": body.config,
        "created_at": now,
        "updated_at": now,
    }
    SIGNALS[new_id] = new_signal
    return build_signal_detail(new_signal)


@router.patch("/signals/{signal_id}", response_model=SignalDetail)
def update_signal(signal_id: str, body: SignalUpdate, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not can_edit_signal(current_user, signal):
        raise HTTPException(status_code=403, detail="Not permitted to edit this signal")

    # Visibility escalation to shared or golden requires manager role
    if body.visibility in ("shared", "golden"):
        if not is_manager(current_user):
            raise HTTPException(status_code=403, detail="Only managers can promote signal visibility")

    updates = body.model_dump(exclude_none=True)
    signal.update(updates)
    signal["updated_at"] = datetime.now().isoformat()
    return build_signal_detail(signal)


@router.delete("/signals/{signal_id}")
def delete_signal(signal_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not can_edit_signal(current_user, signal):
        raise HTTPException(status_code=403, detail="Not permitted to delete this signal")

    # Soft delete -- preserve lineage integrity
    signal["status"] = "deprecated"
    signal["updated_at"] = datetime.now().isoformat()
    return {"success": True}


@router.get("/signals/{signal_id}/lineage", response_model=LineageNode)
def get_signal_lineage(signal_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    # Walk up to find the root ancestor
    root = signal
    visited_up = set()
    while root["parent_signal_id"] and root["parent_signal_id"] not in visited_up:
        visited_up.add(root["id"])
        parent = SIGNALS.get(root["parent_signal_id"])
        if not parent:
            break
        root = parent

    return build_lineage_node(root, current_user, set())


# ─── Metrics Routes ───────────────────────────────────────────────────────────

@router.get("/signals/{signal_id}/metrics", response_model=List[MetricsSnapshot])
def get_metrics(signal_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    snapshots = SIGNAL_METRICS.get(signal_id, [])
    return [MetricsSnapshot(**m) for m in reversed(snapshots)]


@router.post("/signals/{signal_id}/metrics", response_model=MetricsSnapshot, status_code=201)
def add_metrics(signal_id: str, body: MetricsCreate, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not can_edit_signal(current_user, signal):
        raise HTTPException(status_code=403, detail="Not permitted to add metrics to this signal")

    now = datetime.now().isoformat()
    snapshot = {
        "id": f"m-{uuid.uuid4().hex[:8]}",
        "signal_id": signal_id,
        **body.model_dump(),
        "recorded_at": now,
    }
    if signal_id not in SIGNAL_METRICS:
        SIGNAL_METRICS[signal_id] = []
    SIGNAL_METRICS[signal_id].append(snapshot)
    return MetricsSnapshot(**snapshot)


# ─── Share Routes ─────────────────────────────────────────────────────────────

@router.get("/signals/{signal_id}/shares", response_model=List[ShareDetail])
def get_shares(signal_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not is_manager(current_user) and not is_exec(current_user):
        raise HTTPException(status_code=403, detail="Only managers or execs can view share records")

    shares = [sh for sh in SIGNAL_SHARES.values() if sh["signal_id"] == signal_id]
    result = []
    for sh in shares:
        grantor = USERS[sh["granted_by"]]
        target = TEAMS[sh["target_team_id"]]
        result.append(ShareDetail(
            id=sh["id"],
            signal_id=sh["signal_id"],
            granted_by=UserSummary(id=grantor["id"], name=grantor["name"]),
            target_team=TeamSummary(id=target["id"], name=target["name"]),
            created_at=sh["created_at"],
        ))
    return result


@router.post("/signals/{signal_id}/shares", response_model=ShareDetail, status_code=201)
def share_signal(signal_id: str, body: ShareCreate, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not can_manage_sharing(current_user, signal):
        raise HTTPException(status_code=403, detail="Only managers of the owning team can share signals")

    if body.target_team_id not in TEAMS:
        raise HTTPException(status_code=404, detail="Target team not found")

    if body.target_team_id == signal["team_id"]:
        raise HTTPException(status_code=422, detail="Cannot share a signal with its own team")

    # Check for duplicate share
    for sh in SIGNAL_SHARES.values():
        if sh["signal_id"] == signal_id and sh["target_team_id"] == body.target_team_id:
            raise HTTPException(status_code=422, detail="Signal is already shared with this team")

    now = datetime.now().isoformat()
    share_id = f"share-{uuid.uuid4().hex[:8]}"
    new_share = {
        "id": share_id,
        "signal_id": signal_id,
        "granted_by": current_user["id"],
        "target_team_id": body.target_team_id,
        "created_at": now,
    }
    SIGNAL_SHARES[share_id] = new_share

    # Update signal visibility to shared
    signal["visibility"] = "shared"
    signal["updated_at"] = now

    grantor = USERS[current_user["id"]]
    target = TEAMS[body.target_team_id]
    return ShareDetail(
        id=share_id,
        signal_id=signal_id,
        granted_by=UserSummary(id=grantor["id"], name=grantor["name"]),
        target_team=TeamSummary(id=target["id"], name=target["name"]),
        created_at=now,
    )


@router.delete("/signals/{signal_id}/shares/{share_id}")
def revoke_share(signal_id: str, share_id: str, current_user: dict = Depends(get_current_user)):
    signal = SIGNALS.get(signal_id)
    if not signal or not can_see_signal(current_user, signal):
        raise HTTPException(status_code=404, detail="Signal not found")

    if not can_manage_sharing(current_user, signal):
        raise HTTPException(status_code=403, detail="Only managers of the owning team can revoke shares")

    share = SIGNAL_SHARES.get(share_id)
    if not share or share["signal_id"] != signal_id:
        raise HTTPException(status_code=404, detail="Share not found")

    del SIGNAL_SHARES[share_id]

    # If no shares remain, revert visibility to team
    remaining = [sh for sh in SIGNAL_SHARES.values() if sh["signal_id"] == signal_id]
    if not remaining:
        signal["visibility"] = "team"
    signal["updated_at"] = datetime.now().isoformat()

    return {"success": True}
