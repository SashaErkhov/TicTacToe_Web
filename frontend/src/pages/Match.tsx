import {Link, useParams} from 'react-router-dom';
import { BACKEND_URL } from "../config.ts";
import {useEffect, useState} from 'react';
import {checkCookies} from "../foos.ts";

function Match() {
    const { matchId } = useParams<{ matchId: string }>();

    const [error, setError] = useState<string>("");
    const [info, setInfo] = useState<any>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [moves, setMoves] = useState<any[]>([]);
    const [isFrozen, setIsFrozen] = useState<boolean>(false);

    let ID: number = NaN;

    if (matchId === undefined) {
        console.error("Match ID is undefined");
        setError("ID игры не указан");
    } else {
        ID = parseInt(matchId);
    }
    if (isNaN(ID)) {
        console.error("Invalid match ID");
        setError("Неверный ID игры");
    }

    const getCellClass = (symbol: string) => {
        if (symbol === 'X') return 'bg-blue-600 text-white';
        if (symbol === 'O') return 'bg-red-600 text-white';
        return 'bg-white';
    };

    useEffect(() => {
        try {
            checkCookies();
        } catch {
            setError("Ошибка авторизации");
            console.error("Error auth");
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setInfo(undefined);
        setError("");

        fetch(`${BACKEND_URL}/matches/${ID}`,{
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Ошибка ${response.status} от ${BACKEND_URL}: ${response.statusText}`);
                }
            })
            .then(data => {
                console.log('Success get /matches/${ID}');
                setInfo(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get /matches/${ID}:', error);
                setError(error);
                setInfo(undefined);
            })
            .finally(() => {
                setIsLoading(false);
                setIsFrozen(info.result === 'frozen');
            });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setMoves([]);
        setError("");

        fetch(`${BACKEND_URL}/matches/${ID}/moves`,{
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Ошибка ${response.status} от ${BACKEND_URL}: ${response.statusText}`);
                }
            })
            .then(data => {
                console.log('Success get }/matches/${ID}/moves');
                setMoves(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get }/matches/${ID}/moves:', error);
                setError(error);
                setMoves([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="main-page">
                <div className="w-md h-md rounded-md shadow-lg px-5 py-5 text-red-600 bg-red-100">
                    Произошла ошибка. Скоро исправим.
                </div>
            </div>
        );
    }
    if (isLoading) {
        return (
            <div className="main-page">
                <div className="w-md h-md bg-white rounded-md shadow-lg px-5 py-5">
                    Загрузка...
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
                            className="text-2xl px-1 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white"
                            to="/profile"
                        >
                            Назад
                        </Link>
                        {isFrozen && (
                            <button
                                className="text-2xl px-1 rounded-md bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {}}
                            >
                                Продолжить
                            </button>
                        )}
                    </div>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">
                    
                    <div className="text-2xl mb-2">Информация об игре</div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xl mb-2">
                        <div>Режим: {info.mode === 'fixed' ? 'Фиксированный' : 'Бесконечный'}</div>
                        <div>Размер поля: {info.dimensions}x{info.dimensions}</div>
                        <div>Статус: {info.status}</div>
                        <div>Текущий игрок: {info.currentPlayerLogin}</div>
                        <div>Первый игрок: {info.firstPlayerLogin}</div>
                        <div>Второй игрок: {info.secondPlayerLogin}</div>
                        <div>Символ первого игрока: {info.firstPlayerSymbol}</div>
                        {info.status === "finished" && (<div>Результат: {info.result || 'в процессе'}</div>)}
                    </div>

                    {/* Игровое поле */}
                    <div className="mb-6">
                        <div className="text-xl mb-2">Состояние поля:</div>
                        <div className="grid grid-cols-3 gap-4 border-2 border-gray-400 rounded-md">
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
                                    {moves.map((move: any) => (
                                        <tr key={move.index} className="text-center hover:bg-gray-100">
                                            <td className="py-2 px-4">{move.index}</td>
                                            <td className="py-2 px-4">{move.playerLogin}</td>
                                            <td className="py-2 px-4">
                                                <span className={`inline-block w-6 h-6 items-center justify-center text-white rounded ${move.symbol === 'X' ? 'bg-blue-600' : 'bg-red-600'}`}>
                                                    {move.symbol}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4">({move.x}, {move.y})</td>
                                            <td className="py-2 px-4">{new Date(move.createdAt).toLocaleTimeString()}</td>
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