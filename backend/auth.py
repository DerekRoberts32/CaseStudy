from fastapi import Header, HTTPException
from mock_data import USERS, SIGNALS, SIGNAL_SHARES


def get_current_user(x_user_id: str = Header(...)):
    """
    Mock auth via X-User-Id header. In production this would be derived
    from a real session token. The frontend role switcher sets this header
    on every request to simulate different users.
    """
    user = USERS.get(x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user id in X-User-Id header")
    return user


def is_exec(user: dict) -> bool:
    return user["role"] in ("exec", "manager_exec")


def is_manager(user: dict) -> bool:
    return user["role"] in ("manager", "manager_exec")


def can_see_signal(user: dict, signal: dict) -> bool:
    """
    Core permission check. Returns True if the given user has read access
    to the given signal based on the visibility model.
    """
    # Execs see everything
    if is_exec(user):
        return True

    visibility = signal["visibility"]

    # Golden signals are visible to everyone
    if visibility == "golden":
        return True

    # Private signals are only visible to their creator
    if visibility == "private":
        return signal["created_by"] == user["id"]

    # Team signals are visible to all members of the owning team
    if visibility == "team":
        return signal["team_id"] == user["team_id"]

    # Shared signals are visible to the owning team plus any teams
    # listed in SignalShare
    if visibility == "shared":
        if signal["team_id"] == user["team_id"]:
            return True
        for share in SIGNAL_SHARES.values():
            if share["signal_id"] == signal["id"] and share["target_team_id"] == user["team_id"]:
                return True
        return False

    return False


def can_edit_signal(user: dict, signal: dict) -> bool:
    """
    A signal can be edited by its creator or by their team manager.
    Exec-only users are read-only and cannot edit signals.
    """
    if user["role"] == "exec":
        return False
    if signal["created_by"] == user["id"]:
        return True
    if is_manager(user) and signal["team_id"] == user["team_id"]:
        return True
    return False


def can_manage_sharing(user: dict, signal: dict) -> bool:
    """
    Only managers and manager-execs can share signals, and only
    for signals belonging to their own team (unless exec).
    """
    if user["role"] == "exec":
        return False
    if is_exec(user):
        return True
    if is_manager(user) and signal["team_id"] == user["team_id"]:
        return True
    return False


def can_view_productivity(user: dict, team_id: str) -> bool:
    """
    Managers can view productivity for their own team only.
    Execs can view all teams.
    """
    if is_exec(user):
        return True
    if is_manager(user) and user["team_id"] == team_id:
        return True
    return False
