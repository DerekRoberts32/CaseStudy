# Signal Research Platform: Case Study
**Walleye Capital / Quantic Full Stack QD Case Study**

---

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Users & Roles](#2-users--roles)
3. [Data Model](#3-data-model)
4. [Assumptions](#4-assumptions)
5. [Discovery Questions](#5-discovery-questions)
6. [UI Mockups](#6-ui-mockups)
7. [API Specification](#7-api-specification)
8. [User Flows](#8-user-flows)
9. [Future Work](#9-future-work)

---

## 1. Application Overview

This application is a signal research platform that helps quantitative researchers create, iterate on, and manage **signals** used for trading. A signal is produced by applying some operation to a dataset; the specifics of signal generation and configuration are abstracted away. What matters to this platform is how signals are organized, tracked, shared, and monitored across the organization.

The platform serves three types of users: researchers, managers, and executives, each with different levels of access and different goals. Researchers need a workspace to build and experiment with signals. Managers need visibility into their team's output and the ability to control what gets shared. Executives need an org-wide picture of signal health and team productivity.

Data security is a first-class concern. Researchers and teams do not always share data with each other, and it is critical that users only ever see data they have explicit permission to access.

---

## 2. Users & Roles

There are three named user types in the problem, which map to four distinct permission levels in practice:

```
Exec (org-wide visibility)
  └── Manager-Exec (is both a manager AND exec)
        └── Manager (sees their team + any shared signals + golden signals)
              └── Researcher (sees their team + any shared signals + golden signals)
```

| Role           | Description                                                                      |
|----------------|----------------------------------------------------------------------------------|
| `researcher`   | Team-scoped. Sees own signals, team signals, signals shared to their team, and golden signals. |
| `manager`      | Same as researcher, plus can grant cross-team sharing for signals their team owns. |
| `exec`         | Org-wide read access to all signals and teams.                                   |
| `manager_exec` | Org-wide read access plus the ability to manage cross-team sharing.              |

**Notes:**
- Researchers work in teams of 4–7. Every team has exactly one manager.
- Some executives are also managers and have a team assignment. Some are exec-only with no team.
- Managers and executives have access to productivity dashboards and signal health monitoring.

---

## 3. Data Model

### User
| Field     | Type                                                    | Notes             |
|-----------|---------------------------------------------------------|-------------------|
| `id`      | UUID                                                    | Primary key       |
| `name`    | string                                                  |                   |
| `email`   | string                                                  |                   |
| `role`    | enum: `researcher` `manager` `exec` `manager_exec`      |                   |
| `team_id` | UUID → Team                                             | Null if exec-only |

### Team
| Field        | Type        | Notes                     |
|--------------|-------------|---------------------------|
| `id`         | UUID        | Primary key               |
| `name`       | string      |                           |
| `manager_id` | UUID → User | The team's single manager |

Team members are looked up by querying `User` where `team_id` matches.

### Signal
| Field              | Type                                         | Notes                                |
|--------------------|----------------------------------------------|--------------------------------------|
| `id`               | UUID                                         | Primary key                          |
| `name`             | string                                       |                                      |
| `description`      | string                                       |                                      |
| `status`           | enum: `draft` `active` `deprecated`          | Researcher-controlled                |
| `visibility`       | enum: `private` `team` `shared` `golden`     | See rules below                      |
| `created_by`       | UUID → User                                  |                                      |
| `team_id`          | UUID → Team                                  | Always set, even for private signals |
| `parent_signal_id` | UUID → Signal                                | Null if original; set if forked      |
| `dataset_id`       | UUID → Dataset                               | Abstracted                           |
| `config`           | JSON                                         | Abstracted                           |
| `created_at`       | timestamp                                    |                                      |
| `updated_at`       | timestamp                                    |                                      |

**Visibility rules:**

| Value     | Who can see it                                              |
|-----------|-------------------------------------------------------------|
| `private` | Only the `created_by` user                                  |
| `team`    | All members of the owning team                              |
| `shared`  | Owning team + any teams listed in `SignalShare`             |
| `golden`  | All users org-wide, read only, fork only, cannot be edited  |

`team_id` is always populated on a signal. It records which team owns the signal regardless of visibility, and is used for record-keeping and permission checks when visibility changes.

### SignalMetrics
| Field          | Type          | Notes                              |
|----------------|---------------|------------------------------------|
| `id`           | UUID          | Primary key                        |
| `signal_id`    | UUID → Signal |                                    |
| `sharpe_ratio` | float         |                                    |
| `hit_rate`     | float         | % of trades that were profitable   |
| `trade_count`  | int           |                                    |
| `avg_return`   | float         |                                    |
| `last_run_at`  | timestamp     |                                    |
| `recorded_at`  | timestamp     | When this snapshot was taken       |

Metrics are stored as **time-series snapshots**, not as a single overwritten value on the Signal record. Each run of a signal appends a new row, allowing researchers and managers to track whether performance is improving or degrading over time.

### SignalShare
| Field            | Type          | Notes                             |
|------------------|---------------|-----------------------------------|
| `id`             | UUID          | Primary key                       |
| `signal_id`      | UUID → Signal |                                   |
| `granted_by`     | UUID → User   | Must be a manager or manager_exec |
| `target_team_id` | UUID → Team   |                                   |
| `created_at`     | timestamp     |                                   |

`SignalShare` is the mechanism behind `visibility: shared`. A signal can be shared with multiple teams; each share relationship is a separate row. Only managers or manager-execs can create these records.

---

## 4. Assumptions

### Signals & Iteration
- **Forking is the primary iteration mechanism.** When a researcher wants to experiment with a new approach, they fork an existing signal. This creates a new independent signal with `parent_signal_id` pointing to the original. The original is never modified by a fork.
- **`parent_signal_id` is a breadcrumb, not a live link.** Changes to a parent signal do not propagate to forks. The fork tree is for lineage tracking and UI visualization only.
- **Metrics snapshots handle passive performance tracking.** Each time a signal is run, a new `SignalMetrics` row is recorded. This tracks how a stable signal performs over time as market conditions change; it is not a substitute for forking when a researcher wants to try a fundamentally different approach.
- **Signal `status` is researcher-controlled.** Managers can observe status but do not change it.
- **Golden signals are read-only.** Any user can fork a golden signal, but no one edits it in place. This protects org-wide baselines from accidental modification.

### Permissions & Sharing
- **A researcher belongs to exactly one team.**
- **Exec-only users have no team assignment** (`team_id` is null). Manager-execs have both a team and exec-level access.
- **Exec-only users are read-only.** They can view all signals across the organization but cannot create, edit, delete, or share signals. This ensures executive oversight without accidental interference in research workflows.
- **Signals can only be created with private or team visibility.** Promotion to shared or golden is a separate post-creation action that requires manager (or manager-exec) permissions. This prevents researchers from bypassing the review process.
- **Only managers can promote signal visibility.** Promotion to shared or golden requires the manager or manager-exec role on the signal's owning team. Exec-only users cannot promote signals.
- **Managers can share a signal with multiple teams.** Nothing in the problem restricts sharing to a single target team.
- **Receiving teams can fork a shared signal.** Read access implies the ability to iterate on it; that is the purpose of sharing.
- **Promotion to golden is a manager action.** Researchers and exec-only users cannot promote a signal to golden status.

### Abstracted Components
- **Dataset and config are fully abstracted.** `dataset_id` and `config` are placeholders. The internals of signal generation are out of scope for this design.
- **Specific metric definitions are illustrative.** Sharpe ratio, hit rate, trade count, and avg return are reasonable examples but the actual metric schema is treated as flexible.
- **User authentication and account management are out of scope.** Roles and team assignments are assumed to be pre-configured.

---

## 5. Questions for Users of the System

**Q1 - For researchers:**
When iterating on a signal, what is your general approach? Do you prefer to modify a signal in place and use metric snapshots to track whether your changes improve performance, or do you prefer to fork the signal and treat each fork as a distinct experiment? Understanding this will shape how prominently we surface metrics history vs. fork lineage in the signal detail view.

**Q2 - For managers and executives:**
When a signal is shared cross-team or promoted to golden, how much context about its origins should travel with it? Specifically, should the receiving teams be able to see who created it, which team it belongs to, and its full fork history including any ancestor signals that may have been private or team-scoped? Or should a shared or golden signal appear as a clean artifact with no visibility into its history?

**Q3 - For managers and executives:**
How do you define team productivity? Should it be measured by the volume of signals created, the number of signals reaching active or trading status, the performance metrics of those signals, or some combination? Additionally, does active iteration on a signal that has not yet reached trading status count as productive work, or does only a completed and deployed signal contribute to a team's output?

**Q4 - For manager-executives specifically:**
As both a team manager and an org-wide executive, should your view of your own team's signals and productivity be visually distinct from your view of other teams, for example a more detailed or personalized view for your own team, or would you prefer a uniform view across all teams for easier comparison?

**Q5 - For managers and executives:**
If a researcher's signal is shared cross-team or promoted to golden and subsequently adopted or forked by other teams, should that adoption reflect back on the original researcher and team as a measure of their contribution and productivity? Or should each team's metrics only reflect the signals they originate themselves?

---

## 6. UI Mockups

*To be completed.*

---

## 7. API Specification

All endpoints are REST. All requests and responses are JSON. All endpoints require an authenticated session; the current user's role and team are derived from that session and used to enforce permissions on every request. Authentication and session management are out of scope and assumed to be handled externally.

Permission levels referenced below:
- `researcher` -- team-scoped access
- `manager` -- team-scoped access plus cross-team sharing controls
- `exec` -- org-wide read access
- `manager_exec` -- org-wide read access plus sharing controls

---

### Session

#### GET /me
Returns the current authenticated user and their role and team assignment. This is the first call the client makes on load to determine which views and actions to render.

Accessible by: all roles

Response:
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "researcher | manager | exec | manager_exec",
  "team_id": "uuid | null"
}
```

---

### Teams

#### GET /teams
Returns all teams the current user has permission to see. Researchers and managers see only their own team. Execs and manager-execs see all teams.

Accessible by: all roles

Response:
```json
[
  {
    "id": "uuid",
    "name": "string",
    "manager": {
      "id": "uuid",
      "name": "string"
    },
    "member_count": "int"
  }
]
```

#### GET /teams/:id
Returns a single team and its members. Researchers and managers can only fetch their own team. Execs and manager-execs can fetch any team.

Accessible by: all roles (scoped by permission)

Response:
```json
{
  "id": "uuid",
  "name": "string",
  "manager": {
    "id": "uuid",
    "name": "string"
  },
  "members": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "string"
    }
  ]
}
```

#### GET /teams/:id/productivity
Returns productivity metrics for a single team. Includes signal counts by status, average signal performance metrics, and number of signals shared outbound or promoted to golden. Used to populate manager and exec dashboards.

Accessible by: manager (own team only), exec, manager_exec

Response:
```json
{
  "team_id": "uuid",
  "signal_counts": {
    "draft": "int",
    "active": "int",
    "deprecated": "int"
  },
  "golden_signals_originated": "int",
  "signals_shared_outbound": "int",
  "signals_shared_inbound": "int",
  "avg_metrics": {
    "sharpe_ratio": "float",
    "hit_rate": "float",
    "avg_return": "float"
  }
}
```

#### GET /teams/productivity
Returns productivity metrics for all teams the current user has permission to see, in a single call. Execs and manager-execs see all teams. A manager with no exec role sees only their own team. This endpoint exists so the exec and manager-exec dashboard can load a full cross-team comparison view without making one productivity request per team.

Accessible by: manager (own team only), exec, manager_exec

Response:
```json
[
  {
    "team_id": "uuid",
    "team_name": "string",
    "signal_counts": {
      "draft": "int",
      "active": "int",
      "deprecated": "int"
    },
    "golden_signals_originated": "int",
    "signals_shared_outbound": "int",
    "signals_shared_inbound": "int",
    "avg_metrics": {
      "sharpe_ratio": "float",
      "hit_rate": "float",
      "avg_return": "float"
    }
  }
]
```

---

### Signals

#### GET /signals
The primary signal feed for the current user. Returns every signal the user has permission to see in a single call, which for a researcher includes their own private signals, all team-scoped signals on their team, any signals shared with their team from other teams, and all golden signals. This is the endpoint that powers the researcher's main signal list view.

Managers receive the same scope as researchers on their team. Execs and manager-execs receive all signals org-wide. Supports filtering and sorting via query parameters to allow users to narrow the feed by status, visibility, or owning team.

Accessible by: all roles

Query parameters:
- `status` -- filter by `draft`, `active`, or `deprecated`
- `visibility` -- filter by `private`, `team`, `shared`, or `golden`
- `team_id` -- filter by owning team (exec and manager_exec only)
- `created_by` -- filter by user id
- `sort` -- `created_at`, `updated_at`, `name` (default: `updated_at` descending)

Response:
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "draft | active | deprecated",
    "visibility": "private | team | shared | golden",
    "created_by": {
      "id": "uuid",
      "name": "string"
    },
    "team": {
      "id": "uuid",
      "name": "string"
    },
    "parent_signal_id": "uuid | null",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "latest_metrics": {
      "sharpe_ratio": "float",
      "hit_rate": "float",
      "trade_count": "int",
      "avg_return": "float",
      "recorded_at": "timestamp"
    }
  }
]
```

#### GET /signals/golden
Returns all golden signals in the org. This is the dedicated endpoint for the golden signal library -- the browsable catalog of org-approved baseline signals that any user can fork to start new work. Separated from the main feed so the UI can present it as a distinct entry point for researchers looking for a starting point rather than managing their own signals.

Accessible by: all roles

Response: array of signal objects (same shape as GET /signals), all with `visibility: golden`

---

#### GET /signals/:id
Returns a single signal by id. Returns 403 if the current user does not have permission to view it.

Accessible by: all roles (scoped by permission)

Response:
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "status": "draft | active | deprecated",
  "visibility": "private | team | shared | golden",
  "created_by": {
    "id": "uuid",
    "name": "string"
  },
  "team": {
    "id": "uuid",
    "name": "string"
  },
  "parent_signal_id": "uuid | null",
  "dataset_id": "uuid",
  "config": "object",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "latest_metrics": {
    "sharpe_ratio": "float",
    "hit_rate": "float",
    "trade_count": "int",
    "avg_return": "float",
    "recorded_at": "timestamp"
  }
}
```

#### POST /signals
Creates a new signal. The `team_id` is automatically set to the current user's team. `created_by` is set to the current user. If `parent_signal_id` is provided, this is treated as a fork of an existing signal and the user must have read access to the parent.

Accessible by: researcher, manager, manager_exec

Request body:
```json
{
  "name": "string",
  "description": "string",
  "status": "draft | active | deprecated",
  "visibility": "private | team",
  "parent_signal_id": "uuid | null",
  "dataset_id": "uuid",
  "config": "object"
}
```

Response: the created signal object (same shape as GET /signals/:id)

#### PATCH /signals/:id
Updates a signal's metadata, status, or visibility. Only the signal's creator or their team manager can update it. Visibility can only be escalated by a manager (e.g. team to shared, or team to golden). Researchers can update name, description, status, and config. Visibility changes from `team` to `shared` or `golden` require manager or exec role.

Accessible by: researcher (own signals), manager (own team signals), exec, manager_exec

Request body (all fields optional):
```json
{
  "name": "string",
  "description": "string",
  "status": "draft | active | deprecated",
  "visibility": "private | team | shared | golden",
  "config": "object"
}
```

Response: the updated signal object

#### DELETE /signals/:id
Soft-deletes a signal by setting its status to `deprecated`. Hard delete is not supported to preserve lineage integrity; a signal that has been forked should not disappear from the fork tree.

Accessible by: researcher (own signals), manager (own team signals)

Response:
```json
{ "success": true }
```

#### GET /signals/:id/lineage
Returns the full fork tree rooted at the given signal, traversing both ancestors (parent chain) and descendants (all forks). Only returns nodes the current user has permission to see. Nodes the user cannot see are represented as redacted placeholders to preserve tree structure.

Design note: redacted placeholders are returned rather than omitting invisible nodes entirely. This is a deliberate choice -- omitting nodes would silently collapse the tree, making it appear that a fork came directly from a grandparent when an intermediate signal exists that the user cannot see. Returning a placeholder preserves the true shape of the lineage without leaking any data about the hidden signal.

Accessible by: all roles (scoped by permission)

Response:
```json
{
  "root": {
    "id": "uuid",
    "name": "string",
    "visibility": "string",
    "team": { "id": "uuid", "name": "string" },
    "children": [
      {
        "id": "uuid",
        "name": "string",
        "visibility": "string",
        "team": { "id": "uuid", "name": "string" },
        "children": []
      }
    ]
  }
}
```

---

### Signal Metrics

#### GET /signals/:id/metrics
Returns all metrics snapshots for a signal in reverse chronological order. Used to render the performance history chart on the signal detail page.

Accessible by: all roles (scoped by signal permission)

Response:
```json
[
  {
    "id": "uuid",
    "signal_id": "uuid",
    "sharpe_ratio": "float",
    "hit_rate": "float",
    "trade_count": "int",
    "avg_return": "float",
    "last_run_at": "timestamp",
    "recorded_at": "timestamp"
  }
]
```

#### POST /signals/:id/metrics
Records a new metrics snapshot for a signal. In a real system this would likely be triggered by a signal run event; here it is exposed as an explicit endpoint to support the abstracted signal execution model.

Accessible by: researcher (own signals), manager (own team signals)

Request body:
```json
{
  "sharpe_ratio": "float",
  "hit_rate": "float",
  "trade_count": "int",
  "avg_return": "float",
  "last_run_at": "timestamp"
}
```

Response: the created metrics snapshot object

---

### Signal Shares

#### GET /signals/:id/shares
Returns all active share records for a signal, showing which teams the signal has been shared with and who granted each share.

Accessible by: manager (own team signals), exec, manager_exec

Response:
```json
[
  {
    "id": "uuid",
    "signal_id": "uuid",
    "granted_by": {
      "id": "uuid",
      "name": "string"
    },
    "target_team": {
      "id": "uuid",
      "name": "string"
    },
    "created_at": "timestamp"
  }
]
```

#### POST /signals/:id/shares
Shares a signal with another team. The signal must belong to the current user's team. The target team must be different from the owning team. Creates a SignalShare record and updates the signal's visibility to `shared` if it is not already.

Accessible by: manager, manager_exec

Request body:
```json
{
  "target_team_id": "uuid"
}
```

Response: the created share object

#### DELETE /signals/:id/shares/:share_id
Revokes a share. The signal's visibility is updated back to `team` if no other share records remain.

Accessible by: manager (own team signals), manager_exec

Response:
```json
{ "success": true }
```

---

### Error Responses

All endpoints return standard error shapes:

```json
{
  "error": "string",
  "message": "string"
}
```

Common status codes:
- `400` -- malformed request or invalid field value
- `403` -- authenticated but not permitted to access this resource
- `404` -- resource not found or not visible to current user (404 is preferred over 403 for hidden resources to avoid leaking existence)
- `422` -- valid request but failed business logic validation (e.g. sharing a signal with your own team)

Design note: returning 404 rather than 403 for resources that exist but are not visible to the current user is a deliberate security choice. Returning 403 would confirm that the resource exists, which itself leaks information in a system where data visibility is strictly controlled. A user who should not know a signal exists should receive the same response whether the signal is hidden or genuinely absent.

---

## 8. User Flows

*To be completed.*

---

## 9. Future Work

*To be completed.*