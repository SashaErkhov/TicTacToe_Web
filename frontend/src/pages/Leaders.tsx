import {Link} from 'react-router-dom';
import { BACKEND_URL } from "../config.ts";
import {useEffect, useState} from 'react';
import { useAuth } from "../AuthContext";

interface LeaderboardEntry {
    userId: number;
    login: string;
    level: number;
    wins: number;
    losses: number;
    draws: number;
    rank: number;
}

function Leaders() {
    const { accessToken } = useAuth();
    const [error, setError] = useState<string>("");
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [limit, setLimit] = useState<number>(10);

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            setLimit(value);
        }
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

    useEffect(() => {
        if (!accessToken) return;

        setIsLoading(true);
        setData([]);
        setError("");

        authFetch(`/leaderboard`)
            .then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    setData(data);
                    setError("");
                } else {
                    throw new Error(`Ошибка ${response.status}`);
                }
            })
            .catch(error => {
                console.error('Error get /leaderboard:', error);
                setError(error.message);
                setData([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [accessToken]);

    const filteredData = data.slice(0, limit);

    if (isLoading) {
        return (
            <div className="main-page">
                <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex items-center justify-center">
                    Загрузка таблицы лидеров...
                </div>
            </div>
        );
    }

    return (
        <div className="main-page">
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex flex-col gap-3">

                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-2xl">Таблица лидеров</div>
                    <div className="flex gap-3">
                        <Link
                            className="text-2xl px-4 py-2 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white no-underline"
                            to="/new"
                        >
                            Назад
                        </Link>
                    </div>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">

                    <div className="text-2xl mb-4">Топ игроков</div>

                    <div className="flex items-center gap-2 mb-4">
                        <label htmlFor="limit" className="text-xl">Показать лидеров:</label>
                        <input
                            type="number"
                            id="limit"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center"
                            value={limit}
                            onChange={handleLimitChange}
                            min="1"
                            max="100"
                        />
                    </div>

                    {error ? (
                        <div className="text-red-600 bg-red-100 p-3 rounded-md">
                            Произошла ошибка: {error}
                        </div>
                    ) : (
                        <div className="mt-4 w-full">
                            <table className="min-w-full bg-white rounded-md border border-gray-300 border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4">#</th>
                                        <th className="py-2 px-4">Игрок</th>
                                        <th className="py-2 px-4">Уровень</th>
                                        <th className="py-2 px-4">Побед</th>
                                        <th className="py-2 px-4">Поражений</th>
                                        <th className="py-2 px-4">Ничьих</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((entry: LeaderboardEntry) => (
                                            <tr key={entry.userId} className="text-center hover:bg-gray-100">
                                                <td className="py-2 px-4">{entry.rank}</td>
                                                <td className="py-2 px-4">{entry.login}</td>
                                                <td className="py-2 px-4">{entry.level}</td>
                                                <td className="py-2 px-4">{entry.wins}</td>
                                                <td className="py-2 px-4">{entry.losses}</td>
                                                <td className="py-2 px-4">{entry.draws}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-2 px-4 text-center text-gray-500">
                                                {isLoading ? 'Загрузка...' : 'Лидеров не найдено'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Leaders;