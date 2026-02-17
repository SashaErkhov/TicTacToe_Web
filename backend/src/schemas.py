from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, conint, constr



class TypeGame(str, Enum):
    ONLINE = "Online"
    HOTSEAT = "Hotseat"

class OX(str, Enum):
    X = "X"
    O = "O"

class GameMode(str, Enum):
    FIXED = "Fixed"
    INFINITY = "Infinity"

class ResGame(str, Enum):
    WIN_X = "WinX"
    WIN_O = "WinO"
    ACTUAL = "Actual"
    DRAW = "Draw"
    FREEZE = "Freeze"

class Pos(BaseModel):
    x: int
    y: int





class Error(BaseModel):
    code: int = Field(..., description='Application-specific error code.')
    message: str = Field(..., description='Human-readable error message.')


class ErrorResponse(BaseModel):
    error: Error


class User(BaseModel):
    id: int
    username: str
    level: int
    createdAt: datetime

class UserInternal(BaseModel):
    id: int
    username: constr(min_length=3, max_length=32)
    password_hash: str
    level: int = 1
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class RegisterRequest(BaseModel):
    username: constr(min_length=3, max_length=32)
    password: constr(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthToken(BaseModel):
    accessToken: str = Field(..., description='JWT access token.')
    tokenType: str = Field(..., description='Token type, usually "Bearer".')
    expiresIn: Optional[int] = Field(
        None, description='Access token lifetime in seconds.'
    )


class UpdateUserRequest(BaseModel):
    password: Optional[constr(min_length=8, max_length=128)] = None


class FirstPlayerSymbol(Enum):
    X = 'X'
    O = 'O'


class Mode(Enum):
    fixed = 'fixed'
    infinite = 'infinite'


class Status(Enum):
    waiting = 'waiting'
    in_progress = 'in_progress'
    paused = 'paused'
    finished = 'finished'


class Result(Enum):
    first_win = 'first_win'
    second_win = 'second_win'
    draw = 'draw'
    NoneType_None = None


class Match(BaseModel):
    id: int
    firstPlayerId: Optional[int] = None
    secondPlayerId: Optional[int] = None
    currentPlayerId: Optional[int] = None
    firstPlayerSymbol: Optional[FirstPlayerSymbol] = None
    dimensions: conint(ge=3) = Field(
        ..., description='Board dimension (N for an N×N board).'
    )
    mode: Mode = Field(
        ..., description='Match mode – fixed-size board or infinite/expanding board.'
    )
    status: Status
    result: Optional[Result] = Field(
        None, description='Final match result, null if not finished.'
    )
    board: Optional[List[List[Optional[str]]]] = Field(
        None,
        description='Current board state represented as a 2D array board[row][column]. Each cell is either "X", "O" or null.\n',
    )


class Result1(Enum):
    win = 'win'
    loss = 'loss'
    draw = 'draw'


class MatchSummary(BaseModel):
    id: int
    opponentLogin: Optional[str] = None
    mode: Mode
    dimensions: conint(ge=1)
    result: Result1
    startedAt: datetime
    finishedAt: Optional[datetime] = None


class MoveRequest(BaseModel):
    x: conint(ge=0)
    y: conint(ge=0)


class Symbol(Enum):
    X = 'X'
    O = 'O'


class Move(BaseModel):
    index: int = Field(..., description='Sequential move number starting from 1.')
    matchId: int
    playerId: int
    symbol: Symbol
    x: int
    y: int
    createdAt: datetime


class UserStats(BaseModel):
    totalMatches: int
    wins: int
    losses: int
    draws: int
    winRate: float = Field(..., description='Win rate in range [0, 1].')
    level: int


class LeaderboardEntry(BaseModel):
    rank: int
    userId: int
    username: str
    level: int
    wins: Optional[int] = None
    losses: Optional[int] = None
    draws: Optional[int] = None


class Status1(Enum):
    idle = 'idle'
    searching = 'searching'
    match_found = 'match_found'


class MatchmakingStatus(BaseModel):
    status: Status1
    matchId: Optional[int] = Field(
        None, description='Present when a match has been found.'
    )


class JoinMatchmakingRequest(BaseModel):
    mode: Mode
    dimensions: conint(ge=3)


class HotseatMatchRequest(BaseModel):
    dimensions: conint(ge=3)
    mode: Mode
