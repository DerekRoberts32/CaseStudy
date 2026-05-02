from datetime import datetime, timedelta

# ─── Users ────────────────────────────────────────────────────────────────────

USERS = {
    "user-r1": {
        "id": "user-r1",
        "name": "Alice Chen",
        "email": "alice@firm.com",
        "role": "researcher",
        "team_id": "team-1",
    },
    "user-r2": {
        "id": "user-r2",
        "name": "Bob Patel",
        "email": "bob@firm.com",
        "role": "researcher",
        "team_id": "team-1",
    },
    "user-r3": {
        "id": "user-r3",
        "name": "Carol Smith",
        "email": "carol@firm.com",
        "role": "researcher",
        "team_id": "team-2",
    },
    "user-r4": {
        "id": "user-r4",
        "name": "Dan Lee",
        "email": "dan@firm.com",
        "role": "researcher",
        "team_id": "team-2",
    },
    "user-m1": {
        "id": "user-m1",
        "name": "Eva Martinez",
        "email": "eva@firm.com",
        "role": "researcher",
        "team_id": "team-1",
    },
    "user-m2": {
        "id": "user-m2",
        "name": "Frank Wong",
        "email": "frank@firm.com",
        "role": "manager",
        "team_id": "team-2",
    },
    "user-e1": {
        "id": "user-e1",
        "name": "Grace Kim",
        "email": "grace@firm.com",
        "role": "manager_exec",
        "team_id": "team-1",
    },
    "user-e2": {
        "id": "user-e2",
        "name": "Henry Ford",
        "email": "henry@firm.com",
        "role": "exec",
        "team_id": None,
    },
}

# ─── Teams ────────────────────────────────────────────────────────────────────

TEAMS = {
    "team-1": {
        "id": "team-1",
        "name": "Alpha Strategies",
        "manager_id": "user-e1",
    },
    "team-2": {
        "id": "team-2",
        "name": "Beta Quant",
        "manager_id": "user-m2",
    },
}

# ─── Signals ──────────────────────────────────────────────────────────────────

SIGNALS = {
    # Golden signals -- visible to all
    "sig-golden-1": {
        "id": "sig-golden-1",
        "name": "Momentum Base",
        "description": "Baseline momentum signal across large-cap equities. Org-approved starting point.",
        "status": "active",
        "visibility": "golden",
        "created_by": "user-e1",
        "team_id": "team-1",
        "parent_signal_id": None,
        "dataset_id": "ds-001",
        "config": {"window": 20, "universe": "large_cap"},
        "created_at": (datetime.now() - timedelta(days=90)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=90)).isoformat(),
    },
    "sig-golden-2": {
        "id": "sig-golden-2",
        "name": "Mean Reversion Base",
        "description": "Baseline mean reversion signal. Use as a starting point for reversion strategies.",
        "status": "active",
        "visibility": "golden",
        "created_by": "user-m2",
        "team_id": "team-2",
        "parent_signal_id": None,
        "dataset_id": "ds-002",
        "config": {"lookback": 10, "threshold": 1.5},
        "created_at": (datetime.now() - timedelta(days=80)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=80)).isoformat(),
    },

    # Team 1 signals
    "sig-t1-1": {
        "id": "sig-t1-1",
        "name": "Momentum v2",
        "description": "Fork of Momentum Base with a tighter entry window.",
        "status": "active",
        "visibility": "team",
        "created_by": "user-r1",
        "team_id": "team-1",
        "parent_signal_id": "sig-golden-1",
        "dataset_id": "ds-001",
        "config": {"window": 10, "universe": "large_cap"},
        "created_at": (datetime.now() - timedelta(days=60)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=10)).isoformat(),
    },
    "sig-t1-2": {
        "id": "sig-t1-2",
        "name": "Momentum v3 -- Small Cap",
        "description": "Extended Momentum v2 to small-cap universe.",
        "status": "draft",
        "visibility": "team",
        "created_by": "user-r1",
        "team_id": "team-1",
        "parent_signal_id": "sig-t1-1",
        "dataset_id": "ds-001",
        "config": {"window": 10, "universe": "small_cap"},
        "created_at": (datetime.now() - timedelta(days=20)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=5)).isoformat(),
    },
    "sig-t1-3": {
        "id": "sig-t1-3",
        "name": "Alice Private Draft",
        "description": "Experimental signal, not ready to share.",
        "status": "draft",
        "visibility": "private",
        "created_by": "user-r1",
        "team_id": "team-1",
        "parent_signal_id": None,
        "dataset_id": "ds-003",
        "config": {"window": 5},
        "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=1)).isoformat(),
    },
    "sig-t1-4": {
        "id": "sig-t1-4",
        "name": "Bob Reversion Experiment",
        "description": "Bob's take on mean reversion forked from the golden base.",
        "status": "active",
        "visibility": "shared",
        "created_by": "user-r2",
        "team_id": "team-1",
        "parent_signal_id": "sig-golden-2",
        "dataset_id": "ds-002",
        "config": {"lookback": 7, "threshold": 1.2},
        "created_at": (datetime.now() - timedelta(days=45)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=15)).isoformat(),
    },

    # Team 2 signals
    "sig-t2-1": {
        "id": "sig-t2-1",
        "name": "Reversion v2",
        "description": "Team 2 fork of Mean Reversion Base with adjusted threshold.",
        "status": "active",
        "visibility": "team",
        "created_by": "user-r3",
        "team_id": "team-2",
        "parent_signal_id": "sig-golden-2",
        "dataset_id": "ds-002",
        "config": {"lookback": 14, "threshold": 2.0},
        "created_at": (datetime.now() - timedelta(days=55)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=12)).isoformat(),
    },
    "sig-t2-2": {
        "id": "sig-t2-2",
        "name": "Reversion v3",
        "description": "Further iteration on Reversion v2 with volatility filter.",
        "status": "draft",
        "visibility": "team",
        "created_by": "user-r3",
        "team_id": "team-2",
        "parent_signal_id": "sig-t2-1",
        "dataset_id": "ds-002",
        "config": {"lookback": 14, "threshold": 2.0, "vol_filter": True},
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
    },
    "sig-t2-3": {
        "id": "sig-t2-3",
        "name": "Dan Momentum Fork",
        "description": "Dan's fork of Momentum Base adapted for mid-cap.",
        "status": "active",
        "visibility": "team",
        "created_by": "user-r4",
        "team_id": "team-2",
        "parent_signal_id": "sig-golden-1",
        "dataset_id": "ds-001",
        "config": {"window": 15, "universe": "mid_cap"},
        "created_at": (datetime.now() - timedelta(days=40)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=8)).isoformat(),
    },
}

# ─── Signal Metrics ───────────────────────────────────────────────────────────

SIGNAL_METRICS = {
    "sig-golden-1": [
        {"id": "m-g1-1", "signal_id": "sig-golden-1", "sharpe_ratio": 1.4, "hit_rate": 0.58, "trade_count": 320, "avg_return": 0.021, "last_run_at": (datetime.now() - timedelta(days=90)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=90)).isoformat()},
    ],
    "sig-golden-2": [
        {"id": "m-g2-1", "signal_id": "sig-golden-2", "sharpe_ratio": 1.2, "hit_rate": 0.55, "trade_count": 210, "avg_return": 0.018, "last_run_at": (datetime.now() - timedelta(days=80)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=80)).isoformat()},
    ],
    "sig-t1-1": [
        {"id": "m-t11-1", "signal_id": "sig-t1-1", "sharpe_ratio": 1.5, "hit_rate": 0.60, "trade_count": 180, "avg_return": 0.024, "last_run_at": (datetime.now() - timedelta(days=30)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=30)).isoformat()},
        {"id": "m-t11-2", "signal_id": "sig-t1-1", "sharpe_ratio": 1.7, "hit_rate": 0.63, "trade_count": 195, "avg_return": 0.027, "last_run_at": (datetime.now() - timedelta(days=10)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=10)).isoformat()},
    ],
    "sig-t1-2": [
        {"id": "m-t12-1", "signal_id": "sig-t1-2", "sharpe_ratio": 1.1, "hit_rate": 0.54, "trade_count": 90, "avg_return": 0.015, "last_run_at": (datetime.now() - timedelta(days=5)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=5)).isoformat()},
    ],
    "sig-t1-4": [
        {"id": "m-t14-1", "signal_id": "sig-t1-4", "sharpe_ratio": 1.3, "hit_rate": 0.57, "trade_count": 140, "avg_return": 0.019, "last_run_at": (datetime.now() - timedelta(days=20)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=20)).isoformat()},
        {"id": "m-t14-2", "signal_id": "sig-t1-4", "sharpe_ratio": 1.45, "hit_rate": 0.60, "trade_count": 155, "avg_return": 0.022, "last_run_at": (datetime.now() - timedelta(days=15)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=15)).isoformat()},
    ],
    "sig-t2-1": [
        {"id": "m-t21-1", "signal_id": "sig-t2-1", "sharpe_ratio": 1.25, "hit_rate": 0.56, "trade_count": 160, "avg_return": 0.020, "last_run_at": (datetime.now() - timedelta(days=25)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=25)).isoformat()},
        {"id": "m-t21-2", "signal_id": "sig-t2-1", "sharpe_ratio": 1.35, "hit_rate": 0.58, "trade_count": 170, "avg_return": 0.022, "last_run_at": (datetime.now() - timedelta(days=12)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=12)).isoformat()},
    ],
    "sig-t2-2": [
        {"id": "m-t22-1", "signal_id": "sig-t2-2", "sharpe_ratio": 0.9, "hit_rate": 0.51, "trade_count": 60, "avg_return": 0.012, "last_run_at": (datetime.now() - timedelta(days=2)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=2)).isoformat()},
    ],
    "sig-t2-3": [
        {"id": "m-t23-1", "signal_id": "sig-t2-3", "sharpe_ratio": 1.6, "hit_rate": 0.62, "trade_count": 200, "avg_return": 0.026, "last_run_at": (datetime.now() - timedelta(days=15)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=15)).isoformat()},
        {"id": "m-t23-2", "signal_id": "sig-t2-3", "sharpe_ratio": 1.65, "hit_rate": 0.63, "trade_count": 210, "avg_return": 0.027, "last_run_at": (datetime.now() - timedelta(days=8)).isoformat(), "recorded_at": (datetime.now() - timedelta(days=8)).isoformat()},
    ],
}

# ─── Signal Shares ────────────────────────────────────────────────────────────

# sig-t1-4 (Bob's Reversion Experiment) is shared from team-1 to team-2
SIGNAL_SHARES = {
    "share-1": {
        "id": "share-1",
        "signal_id": "sig-t1-4",
        "granted_by": "user-e1",
        "target_team_id": "team-2",
        "created_at": (datetime.now() - timedelta(days=14)).isoformat(),
    }
}
