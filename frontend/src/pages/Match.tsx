import {Link, useParams} from 'react-router-dom';
import { BACKEND_URL } from "../config.ts";
import {useEffect, useState} from 'react';
import { useAuth } from "../AuthContext";

interface MatchInfo {
    mode: 'fixed' | 'infinite';
    dimensions: number;
    status: string;
    currentPlayerLogin: string;
    firstPlayerLogin: string;
    secondPlayerLogin: string;
    firstPlayerSymbol: 'X' | 'O';
    result?: string;
    board: string[][];
}

interface Move {
    index: number;
    playerLogin: string;
    symbol: 'X' | 'O';
    x: number;
    y: number;
    createdAt: number;
}

function Match() {
    const { matchId } = useParams<{ matchId: string }>();
    const { accessToken } = useAuth();

    const [error, setError] = useState<string>("");
    const [info, setInfo] = useState<MatchInfo | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [moves, setMoves] = useState<Move[]>([]);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);

    if (matchId === undefined) {
        console.error("Match ID is undefined");
        return <div>ID игры не указан</div>;
    }

    const ID = parseInt(matchId);
    if (isNaN(ID)) {
        console.error("Invalid match ID");
        return <div>Неверный ID игры</div>;
    }

    const getCellClass = (symbol: string) => {
        if (symbol === 'X') return 'bg-blue-600 text-white';
        if (symbol === 'O') return 'bg-red-600 text-white';
        return 'bg-white';
    };

    const authFetch = async (url: string, options: RequestInit = {}) => {
        return fetch(`${BACKEND_URL}${url}`, {
            ...options,
            credentials: "include",
            headers: {
                ...options.headers,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
    };

    // Load game info
    useEffect(() => {
        if (!accessToken || !ID) return;

        setIsLoading(true);
        setInfo(undefined);
        setError("");

        authFetch(`/matches/${ID}`)
            .then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    setInfo(data);
                    setIsFrozen(data.result === 'frozen');
                    setError("");
                } else {
                    throw new Error(`Ошибка ${response.status}`);
                }
            })
            .catch(error => {
                console.error(`Error get /matches/${ID}:`, error);
                setError(error.message);
                setInfo(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [accessToken, ID]);

    // Load game history
    useEffect(() => {
        if (!accessToken || !ID) return;

        setIsLoading(true);
        setMoves([]);
        setError("");

        authFetch(`/matches/${ID}/moves`)
            .then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    setMoves(data);
                    setError("");
                } else {
                    throw new Error(`Ошибка ${response.status}`);
                }
            })
            .catch(error => {
                console.error(`Error get /matches/${ID}/moves:`, error);
                setError(error.message);
                setMoves([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [accessToken, ID]);

    const handleContinueGame = async () => {
        if (!accessToken || !ID) return;

        try {
            const response = await authFetch(`/matches/${ID}/continue`, {
                method: "POST"
            });

            if (response.ok) {
                const data = await response.json();
                setInfo(data);
                setIsFrozen(false);
            } else {
                setError("Не удалось продолжить игру");
            }
        } catch (error) {
            setError("Ошибка при продолжении игры");
        }
    };

    if (error) {
        return (
            <div className="main-page">
                <div className="w-md h-md rounded-md shadow-lg px-5 py-5 text-red-600 bg-red-100">
                    Ошибка: {error}
                </div>
            </div>
        );
    }

    if (isLoading && !info) {
        return (
            <div className="main-page">
                <div className="w-md h-md bg-white rounded-md shadow-lg px-5 py-5">
                    Загрузка игры...
                </div>
            </div>
        );
    }

    if (!info) {
        return (
            <div className="main-page">
                <div className="w-md h-md rounded-md shadow-lg px-5 py-5 text-red-600 bg-red-100">
                    Игра не найдена.
                </div>
            </div>
        );
    }

    return (
        <div className="main-page">
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex flex-col gap-3">

                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-2xl">Игра #{ID}</div>
                    <div className="flex gap-3">
                        <Link
                            className="text-2xl px-4 py-2 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white no-underline"
                            to="/profile"
                        >
                            Назад
                        </Link>
                        {isFrozen && (
                            <button
                                className="text-2xl px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleContinueGame}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">

                    <div className="text-2xl mb-4">Информация об игре</div>

                    <div className="grid grid-cols-2 gap-4 text-xl mb-4">
                        <div>Режим: {info.mode === 'fixed' ? 'Фиксированный' : 'Бесконечный'}</div>
                        <div>Размер поля: {info.dimensions}x{info.dimensions}</div>
                        <div>Статус: {info.status}</div>
                        <div>Текущий игрок: {info.currentPlayerLogin}</div>
                        <div>Первый игрок: {info.firstPlayerLogin}</div>
                        <div>Второй игрок: {info.secondPlayerLogin}</div>
                        <div>Символ первого игрока: {info.firstPlayerSymbol}</div>
                        {info.status === "finished" && (
                            <div>Результат: {info.result || 'в процессе'}</div>
                        )}
                    </div>

                    {/* Игровое поле */}
                    <div className="mb-6">
                        <div className="text-xl mb-2 text-center">Состояние поля:</div>
                        <div className="grid gap-1" style={{
                            gridTemplateColumns: `repeat(${info.dimensions}, minmax(0, 1fr))`
                        }}>
                            {info.board.map((row: string[], rowIndex: number) => (
                                row.map((cell: string, colIndex: number) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`rounded-md w-12 h-12 flex items-center justify-center text-2xl font-bold border-2 border-gray-300 ${getCellClass(cell)}`}
                                    >
                                        {cell}
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>

                    {/* Список ходов */}
                    <div className="w-full">
                        <div className="text-2xl mb-2 text-center">История ходов</div>
                        {moves.length > 0 ? (
                            <table className="min-w-full bg-white rounded-md border border-gray-300 border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4">#</th>
                                        <th className="py-2 px-4">Игрок</th>
                                        <th className="py-2 px-4">Символ</th>
                                        <th className="py-2 px-4">Позиция</th>
                                        <th className="py-2 px-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moves.map((move: Move) => (
                                        <tr key={move.index} className="text-center hover:bg-gray-100">
                                            <td className="py-2 px-4">{move.index}</td>
                                            <td className="py-2 px-4">{move.playerLogin}</td>
                                            <td className="py-2 px-4">
                                                <span className={`inline-block w-6 h-6 items-center justify-center text-white rounded ${move.symbol === 'X' ? 'bg-blue-600' : 'bg-red-600'}`}>
                                                    {move.symbol}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4">({move.x}, {move.y})</td>
                                            <td className="py-2 px-4">{new Date(move.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-gray-500 text-center py-4">Ходов еще не было</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Match;