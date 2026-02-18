import datetime

from sqlalchemy import (
    Integer, String, BigInteger, ForeignKey,
    CheckConstraint, DateTime
)
from sqlalchemy.dialects.postgresql import ENUM, JSON
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
import enum
from .database import Base


# Enums

class TypeGame(str, enum.Enum):
    Online = "Online"
    Hotseat = "Hotseat"

class OX(str, enum.Enum):
    X = "X"
    O = "O"

class GameMode(str, enum.Enum):
    Fixed = "Fixed"
    Infinity = "Infinity"

class ResGame(str, enum.Enum):
    WinX = "WinX"
    WinO = "WinO"
    Actual = "Actual"
    Draw = "Draw"
    Freeze = "Freeze"



pg_type_game = PG_ENUM(
    TypeGame, name="type_game", create_type=False,
    values_callable=lambda x: [e.value for e in x],
)
pg_ox = PG_ENUM(
    OX, name="ox", create_type=False,
    values_callable=lambda x: [e.value for e in x],
)
pg_game_mode = PG_ENUM(
    GameMode, name="game_mode", create_type=False,
    values_callable=lambda x: [e.value for e in x],
)
pg_res_game = PG_ENUM(
    ResGame, name="res_game", create_type=False,
    values_callable=lambda x: [e.value for e in x],
)


# Tables

class Gamer(Base):
    __tablename__ = "gamers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint("level >= 0", name="gamers_level_nonnegative"),
    )

    # relationships
    first_games: Mapped[list["Game"]] = relationship(
        back_populates="first_gamer",
        foreign_keys="Game.f_gamer_id",
    )
    second_games: Mapped[list["Game"]] = relationship(
        back_populates="second_gamer",
        foreign_keys="Game.s_gamer_id",
    )
    moves: Mapped[list["Move"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    f_gamer_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True,
    )
    s_gamer_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True,
    )

    f_ox: Mapped[OX] = mapped_column("f_ox", pg_ox, nullable=False)
    current_ox: Mapped[OX | None] = mapped_column("current_ox", pg_ox, nullable=True)

    result: Mapped[ResGame] = mapped_column(pg_res_game, nullable=False)

    dimensions: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    mode: Mapped[GameMode] = mapped_column(pg_game_mode, nullable=False, default=GameMode.Fixed)
    type: Mapped[TypeGame] = mapped_column(pg_type_game, nullable=False, default=TypeGame.Online)

    __table_args__ = (
        CheckConstraint("dimensions > 0", name="games_dimensions"),
    )

    # relationships
    first_gamer: Mapped[Gamer | None] = relationship(
        back_populates="first_games",
        foreign_keys=[f_gamer_id],
    )
    second_gamer: Mapped[Gamer | None] = relationship(
        back_populates="second_games",
        foreign_keys=[s_gamer_id],
    )

    moves: Mapped[list["Move"]] = relationship(
        back_populates="game",
        cascade="all, delete-orphan",
    )




class Move(Base):
    __tablename__ = "moves"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    game_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("games.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )

    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)

    played_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    owner: Mapped[Gamer] = relationship(back_populates="moves")
    game: Mapped[Game] = relationship(back_populates="moves")



