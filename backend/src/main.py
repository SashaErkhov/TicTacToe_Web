from fastapi import FastAPI, Path, Query
from typing import List, Optional, Union
from datetime import date
from pydantic import conint

from fastapi import HTTPException

from fastapi import Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from .game_logic import mode_api_to_db
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

from .schemas import (
    AuthToken,
    ErrorResponse,
    HotseatMatchRequest,
    JoinMatchmakingRequest,
    LeaderboardEntry,
    LoginRequest,
    MatchSummary,
    MoveRequest,
    RegisterRequest,
    UpdateUserRequest,
    User,
    UserStats,
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .database import get_db
from .models import Game, Move, Gamer, OX, ResGame, TypeGame
from .schemas import Match, Move as MoveSchema, MoveRequest, HotseatMatchRequest, FirstPlayerSymbol, Symbol, Mode, Result, Result1
from sqlalchemy import select
from .game_logic import *

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

def get_user_from_access(credentials: HTTPAuthorizationCredentials = Depends(bearer),
                         db: Session = Depends(get_db)) -> Gamer:
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub or not sub.isdigit():
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(sub)

    result = db.execute(select(Gamer).where(Gamer.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def _match_response(db: Session, match_id: int) -> Match:
    g = db.execute(select(Game).where(Game.id == match_id)).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")

    # usernames
    ids = [i for i in (g.f_gamer_id, g.s_gamer_id) if i is not None]
    gamers = {}
    if ids:
        rows = db.execute(select(Gamer).where(Gamer.id.in_(ids))).scalars().all()
        gamers = {u.id: u.username for u in rows}

    first_login = gamers.get(g.f_gamer_id) if g.f_gamer_id else None
    second_login = gamers.get(g.s_gamer_id) if g.s_gamer_id else None

    moves = db.execute(
        select(Move).where(Move.game_id == g.id).order_by(Move.played_at, Move.id)
    ).scalars().all()

    syms = infer_symbols_for_moves(g, moves)
    board = build_board(g.dimensions, moves, syms)

    st = status_from_game(g)
    res = result_from_game(g)

    return Match(
        id=g.id,
        firstPlayerLogin=first_login,
        secondPlayerLogin=second_login,
        currentPlayerLogin=current_player_login(g, first_login, second_login),
        firstPlayerSymbol=FirstPlayerSymbol(g.f_ox.value),
        dimensions=g.dimensions,
        mode=mode_db_to_api(g.mode),
        status=st,
        result=res,
        board=board,
    )


@app.post("/auth/login", tags=["Auth"])
async def login_user(body: LoginRequest, response: Response, db: Session = Depends(get_db)) -> Union[AuthToken, ErrorResponse]:
    result = db.execute(select(Gamer).where(Gamer.username == body.username))
    user = result.scalar_one_or_none()

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
async def refresh_access(request: Request,
                         response: Response,
                         db: Session = Depends(get_db)) -> Union[AuthToken, ErrorResponse]:

    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    r = get_redis()
    user_id_str = await r.get(f"refresh:{refresh}")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # delete old refresh
    await r.delete(f"refresh:{refresh}")

    user_id = int(user_id_str)

    user = db.execute(select(Gamer).where(Gamer.id == user_id)).scalar_one_or_none()

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
async def register_user(body: RegisterRequest, response: Response,
                        db: Session = Depends(get_db)) -> Union[AuthToken, ErrorResponse]:
    existing_user = db.execute(
        select(Gamer).where(Gamer.username == body.username)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")

    password_hash = hash_password(body.password)

    new_user = Gamer(
        username=body.username,
        password_hash=password_hash,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)


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




@app.get('/users/me', response_model=User, tags=['Users'])
async def get_current_user(user: Gamer = Depends(get_user_from_access)) -> User:
    return User(
        id=user.id,
        username=user.username,
        level=user.level,
        created_at=user.created_at
    )



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


from datetime import datetime, timezone
from sqlalchemy import select, func, or_, case

def _ms(dt: Optional[datetime]) -> Optional[int]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)

def _opposite(sym: OX) -> OX:
    return OX.O if sym == OX.X else OX.X

def _mode_db_to_api(m: GameMode) -> Mode:
    return Mode.fixed if m == GameMode.Fixed else Mode.infinite

def _user_symbol(game: Game, user_id: int) -> Optional[OX]:
    if game.f_gamer_id == user_id:
        return game.f_ox
    if game.s_gamer_id == user_id:
        return _opposite(game.f_ox)
    return None

def _user_result(game: Game, user_id: int) -> Optional[Result1]:
    if game.result == ResGame.Actual:
        return None

    if game.result == ResGame.Draw:
        return Result1.draw

    if game.result == ResGame.Freeze:
        return Result1.frozen

    sym = _user_symbol(game, user_id)
    if sym is None:
        return None

    if game.result == ResGame.WinX:
        return Result1.win if sym == OX.X else Result1.loss
    if game.result == ResGame.WinO:
        return Result1.win if sym == OX.O else Result1.loss

    return None

@app.get(
    "/users/me/matches",
    response_model=List[MatchSummary],
    tags=["Users", "Matches"],
)
def get_user_matches(
    user: Gamer = Depends(get_user_from_access),
    db: Session = Depends(get_db),
    mode: Optional[Mode] = Query(None),
    result: Optional[Result1] = Query(None),
    from_ms: Optional[int] = Query(None, alias="from"),
    to_ms: Optional[int] = Query(None, alias="to"),
    from_date: Optional[int] = Query(None, alias="from_date"),
    to_date: Optional[int] = Query(None, alias="to_date"),
    limit: int = Query(20, ge=1, le=100),
) -> Union[List[MatchSummary], None]:
    if from_ms is None:
        from_ms = from_date
    if to_ms is None:
        to_ms = to_date

    moves_agg = (
        select(
            Move.game_id.label("game_id"),
            func.min(Move.played_at).label("started_at"),
            func.max(Move.played_at).label("finished_at"),
            func.count(Move.id).label("moves_count"),
        )
        .group_by(Move.game_id)
        .subquery()
    )

    opponent_id_expr = case(
        (Game.f_gamer_id == user.id, Game.s_gamer_id),
        else_=Game.f_gamer_id,
    )

    stmt = (
        select(
            Game,
            func.coalesce(moves_agg.c.started_at, func.now()).label("started_at"),
            moves_agg.c.finished_at.label("finished_at"),
            Gamer.username.label("opponent_login"),
        )
        .outerjoin(moves_agg, moves_agg.c.game_id == Game.id)
        .outerjoin(Gamer, Gamer.id == opponent_id_expr)
        .where(or_(Game.f_gamer_id == user.id, Game.s_gamer_id == user.id))
        .where(Game.result != ResGame.Actual)
        .order_by(func.coalesce(moves_agg.c.started_at, func.now()).desc())
        .limit(limit)
    )

    if mode is not None:
        if mode == Mode.fixed:
            stmt = stmt.where(Game.mode == GameMode.Fixed)
        else:
            stmt = stmt.where(Game.mode == GameMode.Infinity)

    if from_ms is not None:
        from_dt = datetime.fromtimestamp(from_ms / 1000, tz=timezone.utc)
        stmt = stmt.where(func.coalesce(moves_agg.c.started_at, func.now()) >= from_dt)

    if to_ms is not None:
        to_dt = datetime.fromtimestamp(to_ms / 1000, tz=timezone.utc)
        stmt = stmt.where(func.coalesce(moves_agg.c.started_at, func.now()) <= to_dt)

    rows = db.execute(stmt).all()

    out: List[MatchSummary] = []
    for game, started_at, finished_at, opponent_login in rows:
        r = _user_result(game, user.id)
        if r is None:
            continue

        if result is not None and r != result:
            continue

        if game.type == TypeGame.Hotseat:
            opponent_login = None

        out.append(
            MatchSummary(
                id=game.id,
                opponentLogin=opponent_login,
                mode=_mode_db_to_api(game.mode),
                dimensions=game.dimensions,
                result=r,
                startedAt=_ms(started_at) or 0,
                finishedAt=_ms(finished_at),
            )
        )

    return out



@app.get(
    "/users/me/stats",
    response_model=UserStats,
    tags=["Users", "Stats"],
)
def get_user_stats(
    user: Gamer = Depends(get_user_from_access),
    db: Session = Depends(get_db),
) -> UserStats:

    games = db.execute(
        select(Game)
        .where(or_(Game.f_gamer_id == user.id, Game.s_gamer_id == user.id))
        .where(Game.result != ResGame.Actual)
    ).scalars().all()

    wins = losses = draws = 0

    for g in games:
        r = _user_result(g, user.id)
        if r == Result1.win:
            wins += 1
        elif r == Result1.loss:
            losses += 1
        elif r == Result1.draw:
            draws += 1

    total = wins + losses + draws
    win_rate = (wins / total) if total > 0 else 0.0

    return UserStats(
        totalMatches=total,
        wins=wins,
        losses=losses,
        draws=draws,
        winRate=win_rate,
        level=user.level,
    )















@app.get('/leaderboard', response_model=List[LeaderboardEntry], tags=['Stats'])
async def get_leaderboard() -> List[LeaderboardEntry]:
    """
    Get global leaderboard
    """
    pass




@app.get(
    '/matches/{matchId}',
    response_model=Match,
    tags=['Matches'],
)
async def get_match_by_id(
    match_id: int = Path(..., alias='matchId'),
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access)
):
    g = db.execute(select(Game).where(Game.id == match_id)).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")

    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")

    return await _match_response(db, match_id)


@app.post(
    "/matches/{matchId}/moves",
    response_model=Match,
    tags=["Matches", "Moves"],
)
async def make_move(
    match_id: int = Path(..., alias="matchId"),
    body: MoveRequest = ...,
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access),
):
    g = db.execute(
        select(Game).where(Game.id == match_id).with_for_update()
    ).scalar_one_or_none()

    if not g:
        raise HTTPException(status_code=404, detail="Match not found")

    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")

    st = status_from_game(g)
    if st == Status.waiting:
        raise HTTPException(status_code=400, detail="Match is waiting for opponent")
    if g.result == ResGame.Freeze:
        raise HTTPException(status_code=400, detail="Match is frozen")
    if g.result in (ResGame.WinX, ResGame.WinO, ResGame.Draw):
        raise HTTPException(status_code=400, detail="Match already finished")

    if g.mode == GameMode.Fixed:
        if body.x >= g.dimensions or body.y >= g.dimensions:
            raise HTTPException(status_code=400, detail="Move is out of board")
    else:
        if body.x >= g.dimensions or body.y >= g.dimensions:
            g.dimensions = max(g.dimensions, body.x + 1, body.y + 1)

    if g.current_ox is None:
        g.current_ox = g.f_ox

    expected = g.current_ox

    if g.type == TypeGame.Hotseat:
        player_sym = expected
    else:
        if user.id == g.f_gamer_id:
            player_sym = g.f_ox
        else:
            player_sym = opposite_ox(g.f_ox)

        if player_sym != expected:
            raise HTTPException(status_code=400, detail="Not your turn")

    exists = db.execute(
        select(Move.id).where(Move.game_id == g.id, Move.x == body.x, Move.y == body.y).limit(1)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Cell already occupied")

    mv = Move(owner_id=user.id, game_id=g.id, x=body.x, y=body.y)
    db.add(mv)
    db.flush()

    moves = db.execute(
        select(Move).where(Move.game_id == g.id).order_by(Move.played_at, Move.id)
    ).scalars().all()
    syms = infer_symbols_for_moves(g, moves)

    cells = {(m.x, m.y): s.value for m, s in zip(moves, syms)}
    played_sym = player_sym.value

    if is_win(cells, body.x, body.y, played_sym, g):
        g.result = ResGame.WinX if played_sym == "X" else ResGame.WinO
        g.current_ox = None
    else:
        if g.mode == GameMode.Fixed and len(moves) >= g.dimensions * g.dimensions:
            g.result = ResGame.Draw
            g.current_ox = None
        else:
            g.current_ox = opposite_ox(expected)

    db.commit()
    return await _match_response(db, g.id)



@app.get(
    "/matches/{matchId}/moves",
    response_model=list[MoveSchema],
    tags=["Matches", "Moves"],
)
async def get_match_moves(
    match_id: int = Path(..., alias="matchId"),
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access),
):
    g = db.execute(select(Game).where(Game.id == match_id)).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")
    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")

    # usernames
    ids = [i for i in (g.f_gamer_id, g.s_gamer_id) if i is not None]
    rows = db.execute(select(Gamer).where(Gamer.id.in_(ids))).scalars().all()
    gamers = {u.id: u.username for u in rows}

    moves = db.execute(
        select(Move).where(Move.game_id == g.id).order_by(Move.played_at, Move.id)
    ).scalars().all()

    syms = infer_symbols_for_moves(g, moves)

    out: list[MoveSchema] = []
    for idx, (mv, sym) in enumerate(zip(moves, syms), start=1):
        out.append(
            MoveSchema(
                index=idx,
                matchId=g.id,
                playerLogin=gamers.get(mv.owner_id, "unknown"),
                symbol=Symbol(sym.value),
                x=mv.x,
                y=mv.y,
                createdAt=dt_ms(mv.played_at),
            )
        )
    return out



@app.post("/matches/{matchId}/pause", response_model=Match, tags=["Matches"])
async def pause_match(
    match_id: int = Path(..., alias="matchId"),
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access),
):
    g = db.execute(select(Game).where(Game.id == match_id).with_for_update()).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")
    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")
    if g.result != ResGame.Actual:
        raise HTTPException(status_code=400, detail="Cannot pause match in this state")

    g.result = ResGame.Freeze
    db.commit()
    return await _match_response(db, g.id)



@app.post("/matches/{matchId}/resume", response_model=Match, tags=["Matches"])
async def resume_match(
    match_id: int = Path(..., alias="matchId"),
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access),
):
    g = db.execute(select(Game).where(Game.id == match_id).with_for_update()).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")
    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")
    if g.result != ResGame.Freeze:
        raise HTTPException(status_code=400, detail="Match is not frozen")

    g.result = ResGame.Actual
    db.commit()
    return await _match_response(db, g.id)



@app.post("/matches/{matchId}/resign", response_model=Match, tags=["Matches"])
async def resign_match(
    match_id: int = Path(..., alias="matchId"),
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access),
):
    g = db.execute(select(Game).where(Game.id == match_id).with_for_update()).scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Match not found")
    if user.id not in (g.f_gamer_id, g.s_gamer_id):
        raise HTTPException(status_code=404, detail="Match not found")
    if g.result in (ResGame.WinX, ResGame.WinO, ResGame.Draw):
        raise HTTPException(status_code=400, detail="Match already finished")

    if g.current_ox is None:
        g.current_ox = g.f_ox

    resigning = g.current_ox
    winner = opposite_ox(resigning)
    g.result = ResGame.WinX if winner == OX.X else ResGame.WinO
    g.current_ox = None
    db.commit()
    return await _match_response(db, g.id)



@app.post(
    '/matchmaking/hotseat',
    response_model=Match,
    status_code=201,
    tags=['Matchmaking'],
)
async def create_hotseat_match(
    body: HotseatMatchRequest,
    db: Session = Depends(get_db),
    user: Gamer = Depends(get_user_from_access)
):
    g = Game(
        f_gamer_id=user.id,
        s_gamer_id=user.id,
        f_ox=OX.X,
        current_ox=OX.X,
        result=ResGame.Actual,
        dimensions=body.dimensions,
        mode=mode_api_to_db(body.mode),
        type=TypeGame.Hotseat
    )
    db.add(g)
    db.commit()
    db.refresh(g)

    return await _match_response(db, g.id)

@app.post(
    '/matchmaking/join',
    #response_model=MatchmakingStatus,
    responses={'400': {'model': ErrorResponse}, '401': {'model': ErrorResponse}},
    tags=['Matchmaking'],
)
async def join_matchmaking(
    body: JoinMatchmakingRequest,
):
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
    #response_model=MatchmakingStatus,
    tags=['Matchmaking'],
)
async def get_matchmaking_status():
    """
    Get matchmaking search status
    """
    pass

