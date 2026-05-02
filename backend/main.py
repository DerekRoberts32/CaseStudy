from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import User
from mock_data import USERS
from auth import get_current_user
from routers import signals, teams

app = FastAPI(
    title="Signal Research Platform",
    description="API for quantitative researchers to create and manage trading signals.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)
app.include_router(teams.router)


@app.get("/me", response_model=User, tags=["Session"])
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the current user derived from the X-User-Id header.
    This is the first call the frontend makes on load to determine
    role-based rendering.
    """
    return User(**current_user)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
