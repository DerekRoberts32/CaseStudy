from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models import TeamListItem, TeamDetail, TeamProductivity, UserSummary, User, AvgMetrics, SignalCounts
from mock_data import USERS, TEAMS, SIGNALS, SIGNAL_METRICS, SIGNAL_SHARES
from auth import get_current_user, is_exec, is_manager, can_view_productivity

router = APIRouter(prefix="/teams", tags=["Teams"])


def build_team_list_item(team_id: str) -> TeamListItem:
    team = TEAMS[team_id]
    manager = USERS[team["manager_id"]]
    members = [u for u in USERS.values() if u["team_id"] == team_id]
    return TeamListItem(
        id=team["id"],
        name=team["name"],
        manager=UserSummary(id=manager["id"], name=manager["name"]),
        member_count=len(members),
    )


def compute_productivity(team_id: str) -> TeamProductivity:
    team = TEAMS[team_id]
    team_signals = [s for s in SIGNALS.values() if s["team_id"] == team_id]

    counts = SignalCounts(
        draft=sum(1 for s in team_signals if s["status"] == "draft"),
        active=sum(1 for s in team_signals if s["status"] == "active"),
        deprecated=sum(1 for s in team_signals if s["status"] == "deprecated"),
    )

    golden_count = sum(1 for s in team_signals if s["visibility"] == "golden")
    shared_out = sum(1 for sh in SIGNAL_SHARES.values()
                     if SIGNALS[sh["signal_id"]]["team_id"] == team_id)
    shared_in = sum(1 for sh in SIGNAL_SHARES.values()
                    if sh["target_team_id"] == team_id)

    # Average latest metrics across team signals that have metrics
    all_latest = []
    for sig in team_signals:
        snapshots = SIGNAL_METRICS.get(sig["id"], [])
        if snapshots:
            all_latest.append(snapshots[-1])

    if all_latest:
        avg_sharpe = round(sum(m["sharpe_ratio"] for m in all_latest) / len(all_latest), 3)
        avg_hit = round(sum(m["hit_rate"] for m in all_latest) / len(all_latest), 3)
        avg_ret = round(sum(m["avg_return"] for m in all_latest) / len(all_latest), 4)
    else:
        avg_sharpe = avg_hit = avg_ret = 0.0

    return TeamProductivity(
        team_id=team_id,
        team_name=team["name"],
        signal_counts=counts,
        golden_signals_originated=golden_count,
        signals_shared_outbound=shared_out,
        signals_shared_inbound=shared_in,
        avg_metrics=AvgMetrics(
            sharpe_ratio=avg_sharpe,
            hit_rate=avg_hit,
            avg_return=avg_ret,
        ),
    )


@router.get("", response_model=List[TeamListItem])
def list_teams(current_user: dict = Depends(get_current_user)):
    if is_exec(current_user) or is_manager(current_user):
        visible_team_ids = list(TEAMS.keys())
    else:
        visible_team_ids = [current_user["team_id"]] if current_user["team_id"] else []

    return [build_team_list_item(tid) for tid in visible_team_ids]


@router.get("/productivity", response_model=List[TeamProductivity])
def all_teams_productivity(current_user: dict = Depends(get_current_user)):
    if is_exec(current_user):
        team_ids = list(TEAMS.keys())
    elif is_manager(current_user) and current_user["team_id"]:
        team_ids = [current_user["team_id"]]
    else:
        raise HTTPException(status_code=403, detail="Not permitted to view productivity data")

    return [compute_productivity(tid) for tid in team_ids]


@router.get("/{team_id}", response_model=TeamDetail)
def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    if team_id not in TEAMS:
        raise HTTPException(status_code=404, detail="Team not found")

    if not is_exec(current_user) and current_user["team_id"] != team_id:
        raise HTTPException(status_code=404, detail="Team not found")

    team = TEAMS[team_id]
    manager = USERS[team["manager_id"]]
    members = [
        User(**u) for u in USERS.values() if u["team_id"] == team_id
    ]

    return TeamDetail(
        id=team["id"],
        name=team["name"],
        manager=UserSummary(id=manager["id"], name=manager["name"]),
        members=members,
    )


@router.get("/{team_id}/productivity", response_model=TeamProductivity)
def team_productivity(team_id: str, current_user: dict = Depends(get_current_user)):
    if team_id not in TEAMS:
        raise HTTPException(status_code=404, detail="Team not found")

    if not can_view_productivity(current_user, team_id):
        raise HTTPException(status_code=403, detail="Not permitted to view this team's productivity")

    return compute_productivity(team_id)
