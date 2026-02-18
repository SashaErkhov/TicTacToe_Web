from typing import Optional, Dict, Tuple, List
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Game, Move, Gamer, OX, GameMode, ResGame, TypeGame
from .schemas import Match, Status, Mode, Result, FirstPlayerSymbol, Symbol

def opposite_ox(v: OX) -> OX:
    return OX.O if v == OX.X else OX.X

def mode_db_to_api(m: GameMode) -> Mode:
    return Mode.fixed if m == GameMode.Fixed else Mode.infinite

def mode_api_to_db(m: Mode) -> GameMode:
    return GameMode.Fixed if m == Mode.fixed else GameMode.Infinity

def status_from_game(g: Game) -> Status:
    if g.result == ResGame.Freeze:
        return Status.frozen
    if g.result in (ResGame.WinX, ResGame.WinO, ResGame.Draw):
        return Status.finished
    # Actual
    if g.type == TypeGame.Online and g.s_gamer_id is None:
        return Status.waiting
    return Status.in_progress

def result_from_game(g: Game) -> Optional[Result]:
    if g.result == ResGame.Draw:
        return Result.draw
    if g.result in (ResGame.WinX, ResGame.WinO):
        if g.f_ox == OX.X:
            return Result.first_win if g.result == ResGame.WinX else Result.second_win
        else:
            return Result.first_win if g.result == ResGame.WinO else Result.second_win
    return None

def current_player_login(g: Game, first_login: Optional[str], second_login: Optional[str]) -> Optional[str]:
    st = status_from_game(g)
    if st != Status.in_progress:
        return None
    if g.current_ox is None:
        return None
    return first_login if g.current_ox == g.f_ox else second_login

def dt_ms(dt) -> int:
    return int(dt.timestamp() * 1000)

def infer_symbols_for_moves(g: Game, moves: List[Move]) -> List[OX]:
    symbols: List[OX] = []
    if g.type == TypeGame.Hotseat:
        cur = g.f_ox
        for _ in moves:
            symbols.append(cur)
            cur = opposite_ox(cur)
        return symbols

    second_ox = opposite_ox(g.f_ox)
    for mv in moves:
        symbols.append(g.f_ox if mv.owner_id == g.f_gamer_id else second_ox)
    return symbols

def build_board(dim: int, moves: List[Move], symbols: List[OX]) -> List[List[Optional[str]]]:
    board: List[List[Optional[str]]] = [[None for _ in range(dim)] for _ in range(dim)]
    for mv, sym in zip(moves, symbols):
        if 0 <= mv.y < dim and 0 <= mv.x < dim:
            board[mv.y][mv.x] = sym.value
    return board

def win_len_for_game(g: Game) -> int:
    return g.dimensions if g.mode == GameMode.Fixed else 3

def is_win(cells: Dict[Tuple[int,int], str], x: int, y: int, sym: str, g: Game) -> bool:
    target = win_len_for_game(g)

    def in_bounds(nx: int, ny: int) -> bool:
        if g.mode == GameMode.Fixed:
            return 0 <= nx < g.dimensions and 0 <= ny < g.dimensions
        return True

    def count_dir(dx: int, dy: int) -> int:
        cnt = 0
        nx, ny = x + dx, y + dy
        while in_bounds(nx, ny) and cells.get((nx, ny)) == sym:
            cnt += 1
            nx += dx
            ny += dy
        return cnt

    for dx, dy in ((1,0), (0,1), (1,1), (1,-1)):
        streak = 1 + count_dir(dx, dy) + count_dir(-dx, -dy)
        if streak >= target:
            return True
    return False
