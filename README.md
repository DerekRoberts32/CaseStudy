# Signal Research Platform

A full-stack application for quantitative researchers to create, iterate on, and manage trading signals.

## Project Structure

```
├── case_study.md          # Full design document (overview, API spec, data model)
├── backend/              # FastAPI Python backend
│   ├── main.py           # App entry point
│   ├── auth.py           # Permission helpers (mock auth via X-User-Id header)
│   ├── models.py         # Pydantic response/request models
│   ├── mock_data.py      # In-memory mock data (users, teams, signals, metrics)
│   ├── routers/
│   │   ├── signals.py    # /signals endpoints (CRUD, metrics, shares, lineage)
│   │   └── teams.py      # /teams endpoints (list, detail, productivity)
│   └── requirements.txt
└── frontend/             # React + Vite + Tailwind frontend
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/index.ts        # Axios API client
        ├── types/index.ts      # TypeScript interfaces
        ├── context/UserContext.tsx  # Auth context + role switcher state
        ├── components/
        │   ├── Layout.tsx      # Shell with nav + role switcher
        │   ├── Badges.tsx      # Status/visibility/role badge components
        │   ├── SignalCard.tsx   # Signal list card component
        │   └── LineageTree.tsx  # Recursive fork tree visualization
        └── pages/
            ├── SignalListPage.tsx
            ├── SignalDetailPage.tsx
            ├── CreateSignalPage.tsx
            ├── GoldenLibraryPage.tsx
            └── DashboardPage.tsx
```

## Running the Application

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

### Using the App

The frontend includes a **role switcher** in the top-right corner that lets you simulate different users (researchers, managers, executives) to see how permissions affect visibility. No real authentication is required — the selected user's ID is sent as an `X-User-Id` header on every API request.

## Key Features

- **Signal Feed** — Filtered, sorted list of all signals you have permission to see
- **Signal Detail** — Overview, metrics history charts, fork lineage tree, sharing controls
- **Golden Library** — Org-wide baseline signals available for forking
- **Create / Fork** — Create new signals or fork existing ones
- **Cross-team Sharing** — Managers can share signals with other teams
- **Dashboard** — Team productivity metrics (managers/execs only)
- **Permission Model** — Private → Team → Shared → Golden visibility levels enforced server-side
