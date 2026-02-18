from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field, conint, constr


# Errors

class Error(BaseModel):
    code: int
    message: str

class ErrorResponse(BaseModel):
    error: Error


# Enums (same as DB)


class TypeGame(str, Enum):
    Online = "Online"
    Hotseat = "Hotseat"


class OX(str, Enum):
    X = "X"
    O = "O"


class GameMode(str, Enum):
    Fixed = "Fixed"
    Infinity = "Infinity"


class ResGame(str, Enum):
    WinX = "WinX"
    WinO = "WinO"
    Actual = "Actual"
    Draw = "Draw"
    Freeze = "Freeze"


# Auth / User

class AuthToken(BaseModel):
    accessToken: str = Field(..., description="JWT access token.")
    tokenType: str = Field("Bearer", description='Token type, usually "Bearer".')
    expiresIn: Optional[int] = Field(None, description="Access token lifetime in seconds.")


class User(BaseModel):
    id: int
    username: str
    level: int
    created_at: datetime


class RegisterRequest(BaseModel):
    username: constr(min_length=3, max_length=32)
    password: constr(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class UpdateUserRequest(BaseModel):
    password: Optional[constr(min_length=8, max_length=128)] = None



# Game / Move

class GameCreateRequest(BaseModel):
    f_gamer_id: Optional[int] = None
    s_gamer_id: Optional[int] = None

    f_ox: OX
    dimensions: conint(gt=0) = 3
    mode: GameMode = GameMode.Fixed
    type: TypeGame = TypeGame.Online


class GameResponse(BaseModel):
    id: int
    f_gamer_id: Optional[int] = None
    s_gamer_id: Optional[int] = None

    f_ox: OX
    current_ox: Optional[OX] = None

    result: ResGame
    dimensions: int
    mode: GameMode
    type: TypeGame


class MoveCreateRequest(BaseModel):
    x: conint(ge=0)
    y: conint(ge=0)


class MoveResponse(BaseModel):
    id: int
    owner_id: int
    game_id: int
    x: int
    y: int
    played_at: datetime


class GameWithMovesResponse(GameResponse):
    moves: List[MoveResponse] = Field(default_factory=list)







class MatchSummary(BaseModel):
    id: int
    opponentLogin: Optional[str] = None
    mode: Mode
    dimensions: int
    result: Result1
    startedAt: int  # ms
    finishedAt: Optional[int] = None  # ms


class MoveRequest(BaseModel):
    x: conint(ge=0)
    y: conint(ge=0)



class UserStats(BaseModel):
    totalMatches: int
    wins: int
    losses: int
    draws: int
    winRate: float
    level: int

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    level: int
    wins: int = 0
    losses: int = 0
    draws: int = 0


class FirstPlayerSymbol(str, Enum):
    X = "X"
    O = "O"


class Mode(str, Enum):
    fixed = "fixed"
    infinite = "infinite"

class Status(str, Enum):
    waiting = "waiting"
    in_progress = "in_progress"
    frozen = "frozen"
    finished = "finished"


class Result(str, Enum):
    first_win = "first_win"
    second_win = "second_win"
    draw = "draw"


class Match(BaseModel):
    id: int
    firstPlayerLogin: Optional[str] = None
    secondPlayerLogin: Optional[str] = None
    currentPlayerLogin: Optional[str] = None
    firstPlayerSymbol: FirstPlayerSymbol
    dimensions: conint(ge=3)
    mode: Mode
    status: Status
    result: Optional[Result] = None
    board: Optional[List[List[Optional[str]]]] = None


class Symbol(str, Enum):
    X = "X"
    O = "O"


class Move(BaseModel):
    index: int
    matchId: int
    playerLogin: str
    symbol: Symbol
    x: int
    y: int
    createdAt: int = Field(..., description="Unix timestamp in milliseconds")


class MatchmakingState(str, Enum):
    Idle = "Idle"
    Searching = "Searching"
    MatchFound = "MatchFound"


class JoinMatchmakingRequest(BaseModel):
    mode: GameMode
    dimensions: conint(ge=3)


class HotseatMatchRequest(BaseModel):
    dimensions: conint(ge=3) = 3
    mode: Mode = Mode.fixed

class Result1(str, Enum):
    win = "win"
    loss = "loss"
    draw = "draw"
    frozen = "frozen"


