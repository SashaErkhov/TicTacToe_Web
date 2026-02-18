import {Link} from "react-router-dom";
import {useEffect, useMemo, useState, useCallback} from "react";
import {BACKEND_URL} from "../config";
import {useAuth} from "../AuthContext";
import { useSearchParams } from "react-router-dom";

type Mode = "fixed" | "infinite";
type Status = "waiting" | "in_progress" | "frozen" | "finished";
type Symbol = "X" | "O";
type Result = "first_win" | "second_win" | "draw" | null;

interface Match {
    id: number;
    firstPlayerUsername: string | null;
    secondPlayerUsername: string | null;
    currentPlayerUsername: string | null;
    firstPlayerSymbol: Symbol;
    dimensions: number;
    mode: Mode;
    status: Status;
    result: Result;
    board: (Symbol | null)[][];
}

interface Move {
    index: number;
    matchId: number;
    playerUsername: string;
    symbol: Symbol;
    x: number;
    y: number;
    createdAt: number; // ms
}

function opposite(sym: Symbol): Symbol {
    return sym === "X" ? "O" : "X";
}

function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString();
}

export default function MatchHotseat() {
    const {accessToken} = useAuth();

    const [match, setMatch] = useState<Match | null>(null);
    const [moves, setMoves] = useState<Move[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const mode = (searchParams.get("mode") as "fixed" | "infinite") ?? "fixed";
    const dimensions = Number(searchParams.get("dimensions") ?? "3") || 3;

    const apiFetch = useCallback(
        async (path: string, init?: RequestInit) => {
            if (!accessToken) {
                throw new Error("No access token");
            }

            const res = await fetch(`${BACKEND_URL}${path}`, {
                ...init,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                    ...(init?.headers ?? {}),
                },
            });

            return res;
        },
        [accessToken]
    );

    const loadMoves = useCallback(
        async (matchId: number) => {
            const res = await apiFetch(`/matches/${matchId}/moves`, {method: "GET"});
            if (!res.ok) {
                throw new Error(`Failed to load moves: ${res.status}`);
            }
            const data = (await res.json()) as Move[];
            setMoves(data);
        },
        [apiFetch]
    );

    const loadMatch = useCallback(
        async (matchId: number) => {
            const res = await apiFetch(`/matches/${matchId}`, {method: "GET"});
            if (!res.ok) {
                throw new Error(`Failed to load match: ${res.status}`);
            }
            const data = (await res.json()) as Match;
            setMatch(data);
        },
        [apiFetch]
    );

    const startNewMatch = useCallback(
        async (dimensions = 3, mode: Mode = "fixed") => {
            setIsBusy(true);
            setError(null);
            try {
                const res = await apiFetch(`/matchmaking/hotseat`, {
                    method: "POST",
                    body: JSON.stringify({dimensions, mode}),
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Create match failed: ${res.status} ${text}`);
                }

                const data = (await res.json()) as Match;
                setMatch(data);
                setMoves([]);
                await loadMoves(data.id);
            } finally {
                setIsBusy(false);
            }
        },
        [apiFetch, loadMoves]
    );

    useEffect(() => {
        if (!accessToken) return;
        startNewMatch(dimensions, mode).catch((e) => setError(e.message));
    }, [accessToken, startNewMatch]);

    const dim = match?.dimensions ?? 3;

    const boardFlat = useMemo(() => {
        if (!match?.board) return Array(dim * dim).fill(null) as (Symbol | null)[];
        // board[y][x] -> flat row-major
        return match.board.flat();
    }, [match, dim]);

    const currentSymbol: Symbol = useMemo(() => {
        if (!match) return "X";
        const first = match.firstPlayerSymbol;
        return moves.length % 2 === 0 ? first : opposite(first);
    }, [match, moves.length]);

    const winnerText = useMemo(() => {
        if (!match) return null;
        if (match.result === "draw") return "Ничья";
        if (match.result === "first_win") return `Победитель: ${match.firstPlayerSymbol}`;
        if (match.result === "second_win") return `Победитель: ${opposite(match.firstPlayerSymbol)}`;
        return null;
    }, [match]);

    const canPlay = !!match && match.status === "in_progress" && !match.result && !isBusy;

    const handleClick = async (i: number) => {
        if (!match) return;
        if (!canPlay) return;
        if (boardFlat[i]) return;

        const x = i % dim;
        const y = Math.floor(i / dim);

        setIsBusy(true);
        setError(null);
        try {
            const res = await apiFetch(`/matches/${match.id}/moves`, {
                method: "POST",
                body: JSON.stringify({x, y}),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Move failed: ${res.status} ${text}`);
            }

            const updated = (await res.json()) as Match;
            setMatch(updated);

            await loadMoves(updated.id);
        } catch (e: any) {
            setError(e.message ?? "Move error");
            await loadMatch(match.id).catch(() => {
            });
            await loadMoves(match.id).catch(() => {
            });
        } finally {
            setIsBusy(false);
        }
    };

    const resetGame = async () => {
        await startNewMatch(dimensions, mode).catch((e) => setError(e.message));
    };

    const getCellClass = (symbol: Symbol | null) => {
        if (symbol === "X") return "bg-blue-600 text-white";
        if (symbol === "O") return "bg-red-600 text-white";
        return "bg-white hover:bg-gray-100 cursor-pointer";
    };

    return (
        <div className="main-page">
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-2xl">Хотсит игра (сервер)</div>
                    <div className="flex gap-3">
                        <Link
                            className="text-2xl px-3 py-1 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white"
                            to="/new"
                        >
                            Назад
                        </Link>
                        <button
                            className="text-2xl px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                            onClick={resetGame}
                            disabled={isBusy}
                        >
                            Новая игра
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">
                    {error && (
                        <div className="w-full mb-3 p-2 border border-red-400 bg-red-50 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="text-2xl mb-2">
                        {!match ? (
                            "Загрузка матча..."
                        ) : winnerText ? (
                            winnerText
                        ) : match.status === "frozen" ? (
                            "Матч заморожен"
                        ) : match.status === "waiting" ? (
                            "Ожидание..."
                        ) : (
                            `Ход: ${currentSymbol}`
                        )}
                    </div>

                    {/* Board */}
                    <div className="mb-6">
                        <div
                            className="grid gap-2"
                            style={{
                                gridTemplateColumns: `repeat(${dim}, 4rem)`,
                            }}
                        >
                            {boardFlat.map((cell, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleClick(i)}
                                    className={`rounded-md w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-gray-300 ${getCellClass(
                                        cell
                                    )} ${!canPlay ? "cursor-not-allowed opacity-80" : ""}`}
                                >
                                    {cell}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Moves */}
                    <div className="w-full">
                        <div className="text-2xl mb-2 text-center">История ходов</div>

                        {moves.length > 0 ? (
                            <table className="min-w-full bg-white rounded-md border border-gray-300">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4 border-b">#</th>
                                    <th className="py-2 px-4 border-b">Игрок</th>
                                    <th className="py-2 px-4 border-b">Символ</th>
                                    <th className="py-2 px-4 border-b">Позиция</th>
                                    <th className="py-2 px-4 border-b">Время</th>
                                </tr>
                                </thead>
                                <tbody>
                                {moves.map((m) => (
                                    <tr key={m.index} className="text-center hover:bg-gray-100">
                                        <td className="py-2 px-4 border-b">{m.index}</td>
                                        <td className="py-2 px-4 border-b">
                                            {m.symbol === match?.firstPlayerSymbol ? "Игрок 1" : "Игрок 2"}
                                        </td>
                                        <td className="py-2 px-4 border-b">
                        <span
                            className={`inline-block w-6 h-6 rounded ${
                                m.symbol === "X" ? "bg-blue-600" : "bg-red-600"
                            } text-white`}
                        >
                          {m.symbol}
                        </span>
                                        </td>
                                        <td className="py-2 px-4 border-b">{`(${m.y}, ${m.x})`}</td>
                                        <td className="py-2 px-4 border-b">{formatTime(m.createdAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                Нажмите на клетку, чтобы сделать первый ход
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
