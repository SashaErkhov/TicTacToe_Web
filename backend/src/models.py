import datetime

from sqlalchemy import (
    Integer, String, BigInteger, ForeignKey,
    CheckConstraint, DateTime
)
from sqlalchemy.dialects.postgresql import ENUM, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
import enum
from .database import Base


# Enums

class TypeGame(enum.Enum):
    ONLINE = "Online"
    HOTSEAT = "Hotseat"

class OX(enum.Enum):
    X = "X"
    O = "O"

class GameMode(enum.Enum):
    FIXED = "Fixed"
    INFINITY = "Infinity"

class ResGame(enum.Enum):
    WIN_X = "WinX"
    WIN_O = "WinO"
    ACTUAL = "Actual"
    DRAW = "Draw"
    FREEZE = "Freeze"



# Tables

class Gamer(Base):
    __tablename__ = "gamers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

'''
    games_as_first: Mapped[list["Game"]] = relationship(
        foreign_keys="Game.f_gamer_id",
        back_populates="first_gamer"
    )

    games_as_second: Mapped[list["Game"]] = relationship(
        foreign_keys="Game.s_gamer_id",
        back_populates="second_gamer"
    )

    moves: Mapped[list["Move"]] = relationship(
        back_populates="gamer"
    )

    __table_args__ = (
        CheckConstraint("level >= 0", name="gamers_level_nonnegative"),
    )
'''

'''
class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    f_gamer_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", ondelete="SET NULL", onupdate="CASCADE")
    )

    s_gamer_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", ondelete="SET NULL", onupdate="CASCADE")
    )

    f_ox: Mapped[OX] = mapped_column(
        ENUM(OX, name="ox", create_type=True),
        nullable=False
    )

    current_ox: Mapped[OX | None] = mapped_column(
        ENUM(OX, name="ox", create_type=False)
    )

    result: Mapped[ResGame] = mapped_column(
        ENUM(ResGame, name="res_game", create_type=True),
        nullable=False
    )

    dimensions: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    mode: Mapped[GameMode] = mapped_column(
        ENUM(GameMode, name="game_mode", create_type=True),
        default=GameMode.FIXED,
        nullable=False
    )

    type: Mapped[TypeGame] = mapped_column(
        ENUM(TypeGame, name="type_game", create_type=True),
        default=TypeGame.ONLINE,
        nullable=False
    )

    first_gamer: Mapped["Gamer | None"] = relationship(
        foreign_keys=[f_gamer_id],
        back_populates="games_as_first"
    )

    second_gamer: Mapped["Gamer | None"] = relationship(
        foreign_keys=[s_gamer_id],
        back_populates="games_as_second"
    )

    moves: Mapped[list["Move"]] = relationship(
        back_populates="game",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("dimensions > 0", name="games_dimensions"),
    )

    @hybrid_property
    def is_full(self):
        return self.f_gamer_id is not None and self.s_gamer_id is not None

    @hybrid_property
    def is_empty(self):
        return self.f_gamer_id is None and self.s_gamer_id is None





class Move(Base):
    __tablename__ = "moves"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("gamers.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )

    game_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("games.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )

    coordinates: Mapped[dict] = mapped_column(JSON, nullable=False)

    played_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    gamer: Mapped["Gamer"] = relationship(back_populates="moves")
    game: Mapped["Game"] = relationship(back_populates="moves")


'''
