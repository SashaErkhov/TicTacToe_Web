from pydantic import BaseModel, Field
from datetime import datetime

class LeaderboardEntry(BaseModel):
    rank: int
    userId: int
    login: str
    level: int
    wins: int
    losses: int
    draws: int


# ─────────── Request DTO ───────────

class RegisterRequest(BaseModel):
    login: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    login: str
    password: str

class UpdateUserRequest(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)

class UserStats(BaseModel):
    totalMatches: int
    wins: int
    losses: int
    draws: int
    winRate: float
    level: int

class MatchSummary(BaseModel):
    id: int
    opponentLogin: str | None
    mode: str
    dimensions: int
    result: str
    startedAt: int | None = None
    finishedAt: int | None = None

    class Config:
        json_encoders = {
            datetime: lambda v: int(v.timestamp())
        }

# ─────────── Response DTO ───────────

class User(BaseModel):
    id: int
    login: str
    level: int
    createdAt: datetime = Field(alias="created_at")

    class Config:
        orm_mode = True


class Match(BaseModel):
    id: int
    firstPlayerLogin: str | None
    secondPlayerLogin: str | None
    currentPlayerLogin: str | None
    firstPlayerSymbol: str
    dimensions: int
    mode: str
    status: str
    result: str | None
    board: list[list[str | None]]


class Move(BaseModel):
    index: int
    matchId: int
    playerLogin: str
    symbol: str
    x: int
    y: int
    createdAt: int
