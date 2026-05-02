# Signal Research Platform

A full-stack application for quantitative researchers to create, iterate on, and manage trading signals.

Built with **FastAPI** (Python) + **React + TypeScript** (Vite).

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.
Interactive API docs are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be running at `http://localhost:5173`.

---

## Role Switcher

Because authentication is out of scope, the app includes a role switcher in the top navigation bar. Use it to switch between the following mock users and see how the UI and data access changes per role:

| User | Role | Team |
|------|------|------|
| Alice Chen | Researcher | Alpha Strategies |
| Bob Patel | Researcher | Alpha Strategies |
| Carol Smith | Researcher | Beta Quant |
| Dan Lee | Researcher | Beta Quant |
| Eva Martinez | Manager | Alpha Strategies |
| Frank Wong | Manager | Beta Quant |
| Grace Kim | Manager + Exec | Alpha Strategies |
| Henry Ford | Exec only | None |

---

## Project Structure

```
signal-platform/
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── models.py         # Pydantic request/response models
│   ├── mock_data.py      # Seed data (users, teams, signals, metrics, shares)
│   ├── auth.py           # Mock session + permission helpers
│   ├── routers/
│   │   ├── signals.py    # Signal, metrics, and share endpoints
│   │   └── teams.py      # Team and productivity endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── context/      # User/role context and role switcher data
│   │   ├── types/        # TypeScript types mirroring backend models
│   │   ├── components/   # Shared UI components
│   │   └── pages/        # Page-level components
│   └── package.json
└── case_study.md
```

---

## Key Design Decisions

- All data is in-memory. Restarting the backend resets to seed data.
- The `X-User-Id` header on every API request determines the active user. The frontend role switcher sets this via localStorage.
- `GET /signals` returns the unified signal feed for the current user -- scoped by role and team automatically.
- `DELETE /signals/:id` soft-deletes by setting status to `deprecated` to preserve lineage integrity.
- `GET /signals/:id/lineage` returns redacted placeholder nodes for signals the user cannot see, preserving the tree shape without leaking data.
- Resources the user cannot see return `404` rather than `403` to avoid confirming their existence.
