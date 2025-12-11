from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from schemas import RegisterRequest, LoginRequest, UpdateUserRequest, User as UserSchema, UserStats, MatchSummary
from auth import (
    register_user,
    login_user,
    get_current_user,
    get_db
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TicTacToe_API_Stub",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # настрой в проде
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────── AUTH ───────────────

@app.post("/auth/register", response_model=UserSchema, status_code=201)
def register(data: RegisterRequest, db=Depends(get_db)):
    return register_user(data, db)


@app.post("/auth/login")
def login(data: LoginRequest, response: Response, db=Depends(get_db)):
    return login_user(data, response, db)


@app.post("/auth/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(
        key="accessToken",
        httponly=True,
        path="/",
        secure=False,  # включи True в проде
        samesite="lax"
    )
    response.headers["Clear-Site-Data"] = '"cookies", "storage"'
    response.status_code = 204
    return response


# ─────────────── USERS ───────────────

@app.get("/users/me", response_model=UserSchema)
def get_me(user=Depends(get_current_user)):
    return user


@app.patch("/users/me", response_model=UserSchema)
def update_me(
    data: UpdateUserRequest,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    if data.password:
        from auth import pwd
        user.password_hash = pwd.hash(data.password)  # Передаем пароль как есть, обрезка будет внутри bcrypt

    db.commit()
    db.refresh(user)
    return user


@app.get("/users/me/stats", response_model=UserStats)
def get_user_stats(user=Depends(get_current_user)):
    # Заглушка: возвращаем фиксированные данные
    return UserStats(
        totalMatches=10,
        wins=6,
        losses=3,
        draws=1,
        winRate=0.6,
        level=user.level
    )


@app.get("/users/me/matches", response_model=list[MatchSummary])
def get_user_matches(
    mode: str | None = None,
    result: str | None = None,
    from_date: int | None = None,
    to_date: int | None = None,
    limit: int = 20,
    user=Depends(get_current_user)
):
    # Заглушка: возвращаем фиксированный список матчей, игнорируя параметры фильтрации
    return [
        MatchSummary(
            id=1,
            opponentLogin="Петя",
            mode="fixed",
            dimensions=3,
            result="win",
            startedAt=1765464116718 ,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=2,
            opponentLogin="Вася",
            mode="infinite",
            dimensions=4,
            result="loss",
            startedAt=1765464116718 ,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=3,
            opponentLogin="Коля",
            mode="fixed",
            dimensions=3,
            result="draw",
            startedAt=1765464116718 ,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=4,
            opponentLogin="Игнат",
            mode="fixed",
            dimensions=3,
            result="frozen",
            startedAt=1765464116718 ,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=5,
            opponentLogin="Петя",
            mode="fixed",
            dimensions=3,
            result="win",
            startedAt=1765464116718,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=6,
            opponentLogin="Вася",
            mode="infinite",
            dimensions=4,
            result="loss",
            startedAt=1765464116718,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=7,
            opponentLogin="Коля",
            mode="fixed",
            dimensions=3,
            result="draw",
            startedAt=1765464116718,
            finishedAt=1765464116718
        ),
        MatchSummary(
            id=8,
            opponentLogin="Игнат",
            mode="fixed",
            dimensions=3,
            result="frozen",
            startedAt=1765464116718,
            finishedAt=1765464116718
        )
    ]
