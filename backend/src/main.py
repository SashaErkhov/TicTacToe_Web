from fastapi import FastAPI, Path, Query
from typing import List, Optional, Union
from datetime import date
from pydantic import conint

from fastapi import HTTPException

from .storage import users, next_user_id

from fastapi import Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from .redis_client import get_redis
from .auth.utils_auth import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
    create_refresh_token, refresh_ttl_seconds
)
from dotenv import load_dotenv
import os

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

from .models import (
    AuthToken,
    ErrorResponse,
    HotseatMatchRequest,
    JoinMatchmakingRequest,
    LeaderboardEntry,
    LoginRequest,
    Match,
    MatchmakingStatus,
    MatchSummary,
    Mode,
    Move,
    MoveRequest,
    RegisterRequest,
    Result1,
    UpdateUserRequest,
    UserInternal,
    User,
    UserStats,
)

app = FastAPI(
    title='TicTacToe_Web REST API',
    description='REST API for a Tic-Tac-Toe game',
    version='1.0.0',
    license={'name': 'MIT License', 'url': 'https://opensource.org/licenses/MIT'},
    servers=[
        {
            'name': 'Dev',
            'url': 'http://localhost:8000',
            'description': 'Local development server',
        },
        {
            'name': 'prod',
            'url': 'http://176.108.250.40',
            'description': 'Production server',
        },
    ],
)

REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from .redis_client import init_redis, close_redis

@app.on_event("startup")
async def _startup():
    await init_redis()

@app.on_event("shutdown")
async def _shutdown():
    await close_redis()



bearer = HTTPBearer(auto_error=True)

def get_user_from_access(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> UserInternal:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub or not sub.isdigit():
        raise HTTPException(status_code=401, detail="Invalid token")

    user = users.get(int(sub))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user




@app.post("/auth/login", tags=["Auth"])
async def login_user(body: LoginRequest, response: Response) -> Union[AuthToken, ErrorResponse]:
    user = next((u for u in users.values() if u.username == body.username), None)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access, expires_in = create_access_token(user_id=user.id, username=user.username)

    refresh = create_refresh_token()
    ttl = refresh_ttl_seconds()

    r = get_redis()
    await r.setex(f"refresh:{refresh}", ttl, str(user.id))

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh,
        httponly=True,
        secure=False, # in prod: True
        samesite="lax",
        max_age=ttl,
        path="/",
        domain="localhost",
    )

    return AuthToken(accessToken=access, tokenType="Bearer", expiresIn=expires_in)



@app.post("/auth/refresh", tags=["Auth"])
async def refresh_access(request: Request, response: Response) -> Union[AuthToken, ErrorResponse]:
    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    r = get_redis()
    user_id_str = await r.get(f"refresh:{refresh}")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    await r.delete(f"refresh:{refresh}")

    user_id = int(user_id_str)
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_refresh = create_refresh_token()
    ttl = refresh_ttl_seconds()
    await r.setex(f"refresh:{new_refresh}", ttl, str(user.id))

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ttl,
        path="/",
    )
    access, expires_in = create_access_token(user_id=user.id, username=user.username)
    return AuthToken(accessToken=access, tokenType="Bearer", expiresIn=expires_in)




@app.post("/auth/logout", tags=["Auth"])
async def logout_user(request: Request, response: Response):
    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if refresh:
        r = get_redis()
        await r.delete(f"refresh:{refresh}")
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/")
    return {"detail": "Logged out"}



@app.post('/auth/register', status_code=201, tags=['Auth'])
async def register_user(body: RegisterRequest, response: Response) -> Union[AuthToken, ErrorResponse]:
    global next_user_id
    for u in users.values():
        if u.username == body.username:
            raise HTTPException(status_code=409, detail="User already exists")
    user_id = next_user_id
    next_user_id += 1
    password_hash = hash_password(body.password)
    new_user = UserInternal(
        id=user_id,
        username=body.username,
        password_hash=password_hash,
    )
    users[user_id] = new_user


    # Auto log in

    # create refresh token
    access, expires_in = create_access_token(user_id=new_user.id, username=new_user.username)
    refresh = create_refresh_token()
    ttl = refresh_ttl_seconds()

    # save refresh token to Redis
    r = get_redis()
    await r.setex(f"refresh:{refresh}", ttl, str(new_user.id))

    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh,
        httponly=True,
        secure=False, # true in prod
        samesite="lax",
        max_age=ttl,
        path="/"
    )

    # Return access token
    return AuthToken(accessToken=access, tokenType="Bearer", expiresIn=expires_in)



@app.get('/leaderboard', response_model=List[LeaderboardEntry], tags=['Stats'])
async def get_leaderboard() -> List[LeaderboardEntry]:
    """
    Get global leaderboard
    """
    pass


@app.get(
    '/matches/{matchId}',
    response_model=Match,
    responses={'401': {'model': ErrorResponse}, '404': {'model': ErrorResponse}},
    tags=['Matches'],
)
async def get_match_by_id(
    match_id: int = Path(..., alias='matchId')
) -> Union[Match, ErrorResponse]:
    """
    Get match state
    """
    pass


@app.post(
    '/matches/{matchId}/moves',
    response_model=Match,
    responses={
        '400': {'model': ErrorResponse},
        '401': {'model': ErrorResponse},
        '404': {'model': ErrorResponse},
    },
    tags=['Matches', 'Moves'],
)
async def make_move(
    match_id: int = Path(..., alias='matchId'), body: MoveRequest = ...
) -> Union[Match, ErrorResponse]:
    """
    Make a move
    """
    pass


@app.get(
    '/matches/{matchId}/moves',
    response_model=List[Move],
    responses={'401': {'model': ErrorResponse}, '404': {'model': ErrorResponse}},
    tags=['Matches', 'Moves'],
)
async def get_match_moves(
    match_id: int = Path(..., alias='matchId')
) -> Union[List[Move], ErrorResponse]:
    """
    Get match move history
    """
    pass


@app.post(
    '/matches/{matchId}/pause',
    response_model=Match,
    responses={'401': {'model': ErrorResponse}, '404': {'model': ErrorResponse}},
    tags=['Matches'],
)
async def pause_match(
    match_id: int = Path(..., alias='matchId')
) -> Union[Match, ErrorResponse]:
    """
    Pause a match
    """
    pass


@app.post(
    '/matches/{matchId}/resign',
    response_model=Match,
    responses={'401': {'model': ErrorResponse}, '404': {'model': ErrorResponse}},
    tags=['Matches'],
)
async def resign_match(
    match_id: int = Path(..., alias='matchId')
) -> Union[Match, ErrorResponse]:
    """
    Resign from a match
    """
    pass


@app.post(
    '/matches/{matchId}/resume',
    response_model=Match,
    responses={'401': {'model': ErrorResponse}, '404': {'model': ErrorResponse}},
    tags=['Matches'],
)
async def resume_match(
    match_id: int = Path(..., alias='matchId')
) -> Union[Match, ErrorResponse]:
    """
    Resume a paused match
    """
    pass


@app.post(
    '/matchmaking/hotseat',
    response_model=None,
    responses={
        '201': {'model': Match},
        '400': {'model': ErrorResponse},
        '401': {'model': ErrorResponse},
    },
    tags=['Matchmaking'],
)
async def create_hotseat_match(
    body: HotseatMatchRequest,
) -> Optional[Union[Match, ErrorResponse]]:
    """
    Create a hotseat match
    """
    pass


@app.post(
    '/matchmaking/join',
    response_model=MatchmakingStatus,
    responses={'400': {'model': ErrorResponse}, '401': {'model': ErrorResponse}},
    tags=['Matchmaking'],
)
async def join_matchmaking(
    body: JoinMatchmakingRequest,
) -> Union[MatchmakingStatus, ErrorResponse]:
    """
    Join matchmaking queue
    """
    pass


@app.delete(
    '/matchmaking/leave',
    response_model=None,
    responses={'401': {'model': ErrorResponse}},
    tags=['Matchmaking'],
)
async def leave_matchmaking() -> Optional[ErrorResponse]:
    """
    Leave matchmaking queue
    """
    pass


@app.get(
    '/matchmaking/status',
    response_model=MatchmakingStatus,
    responses={'401': {'model': ErrorResponse}},
    tags=['Matchmaking'],
)
async def get_matchmaking_status() -> Union[MatchmakingStatus, ErrorResponse]:
    """
    Get matchmaking search status
    """
    pass



@app.get('/users/me', response_model=User, tags=['Users'])
async def get_current_user(user: UserInternal = Depends(get_user_from_access)) -> Union[User, ErrorResponse]:
    return User(id=user.id, username=user.username, level=user.level, createdAt=user.createdAt)



@app.patch(
    '/users/me',
    response_model=User,
    responses={'400': {'model': ErrorResponse}, '401': {'model': ErrorResponse}},
    tags=['Users'],
)
async def update_current_user(body: UpdateUserRequest) -> Union[User, ErrorResponse]:
    """
    Update the authenticated user's profile
    """
    pass


@app.get(
    '/users/me/matches',
    response_model=List[MatchSummary],
    responses={'401': {'model': ErrorResponse}},
    tags=['Users', 'Matches'],
)
async def get_user_matches(
    mode: Optional[Mode] = None,
    result: Optional[Result1] = None,
    from_: Optional[date] = Query(None, alias='from'),
    to: Optional[date] = None,
    limit: Optional[conint(ge=1, le=100)] = 20,
) -> Union[List[MatchSummary], ErrorResponse]:
    """
    Get match history of the authenticated user
    """
    pass


@app.get(
    '/users/me/stats',
    response_model=UserStats,
    responses={'401': {'model': ErrorResponse}},
    tags=['Users', 'Stats'],
)
async def get_user_stats() -> Union[UserStats, ErrorResponse]:
    """
    Get aggregated statistics of the authenticated user
    """
    pass
