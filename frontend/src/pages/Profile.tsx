import { useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import {BACKEND_URL} from "./../config.ts";
import { checkCookies } from "./../foos.ts";

function Profile() {
    const navigate = useNavigate();

    const logout = () => {
        if (window.confirm("Вы действительно хотите выйти?")) {
            fetch(`${BACKEND_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .finally(() => {
                navigate("/");
            });
        }
    };

    enum Sort {
        id=0,
        opponent=1,
        dimension=2,
        date=3,
        none=4,
    }

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [user, setUser] = useState<any>(undefined)
    const [login, setLogin] = useState<string>("");
    const [level, setLevel] = useState<number>(0);
    const [stats, setStats] = useState<any>(undefined);
    const [games, setGames] = useState<any[]>([]);
    const [params, setParams] = useState<any>({
        mode: undefined,
        result: undefined,
        from_date: undefined,
        to_date: undefined,
        limit: 20,
    });
    const [reload, setReload] = useState<boolean>(true);
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [sortOpen, setSortOpen] = useState<boolean>(false);
    const [sort, setSort] = useState<Sort>(Sort.none);



    useEffect(() => {
        try {
            checkCookies();
        } catch {
            setError("Ошибка авторизации")
            console.error("Error auth");
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setUser(undefined);
        setError("");

        fetch(`${BACKEND_URL}/users/me`,{
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
                console.log('Success get /users/me');
                setUser(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get /users/me:', error);
                setError(error);
                setUser(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setStats(undefined);
        setError("");

        fetch(`${BACKEND_URL}/users/me/stats`,{
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
                console.log('Success get /users/me/stats');
                setStats(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get /users/me/stats:', error);
                setError(error);
                setStats(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!reload) {
            return;
        }
        setReload(false);
        setIsLoading(true);
        setGames([]);
        setError("");

        const filtered = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v)
        );

        const query = new URLSearchParams(filtered).toString();

        fetch(`${BACKEND_URL}/users/me/matches?${query}`,{
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
                console.log('Success get /users/me/matches');
                let copy = [...data];
                switch (sort) {
                    case Sort.id:
                        copy.sort((a, b) => b.id - a.id);
                        break;
                    case Sort.opponent:
                        copy.sort((a, b) => a.opponentLogin.localeCompare(b.opponentLogin));
                        break;
                    case Sort.dimension:
                        copy.sort((a, b) => b.dimensions - a.dimensions);
                        break;
                    case Sort.date:
                        copy.sort((a, b) => b.startedAt - a.startedAt);
                        break;
                }

                setGames(copy);
                setError("");
            })
            .catch(error => {
                console.error('Error get /users/me/matches:', error);
                setError(error);
                setGames([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [params, sort, reload]);

    useEffect(() => {
        if (user === undefined) return;
        setLogin(user.login);
        setLevel(user.level);
    }, [user]);

    if (isLoading) {
        return (
            <div className="main-page">
                <div className="w-md h-md bg-white rounded-md shadow-lg px-5 py-5">
                    Загрузка...
                </div>
            </div>
        )
    }
    if (error) {
        return (
            <div className="main-page">
                <div className="w-md h-md rounded-md shadow-lg px-5 py-5 text-red-600 bg-red-100">
                    Произошла ошибка. Скоро исправим.
                </div>
            </div>
        )
    }
    return (
        <div className="main-page">
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex flex-col gap-3">

                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-2xl">{login}. Уровень игрока: {level}</div>
                    <div className="flex gap-3">
                        <button
                            className="text-2xl px-1  rounded-md bg-[#C5C5C5] hover:bg-gray-400
                        text-white"
                            onClick={() => navigate("/new")}
                        >
                            Новая игра
                        </button>
                        <button
                            className="text-2xl px-1  rounded-md bg-[#C5C5C5] hover:bg-gray-400
                        text-white underline"
                            onClick={() => logout()}
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">

                    {stats && (
                        <>
                            <div className="text-2xl">Статистика</div>

                            <div className="grid grid-cols-2 gap-4 mt-4 text-xl">
                                <div>Всего игр: {stats.totalMatches}</div>
                                <div>Побед: {stats.wins}</div>
                                <div>Поражений: {stats.losses}</div>
                                <div>Ничьих: {stats.draws}</div>
                                <div>Процент побед: {(stats.winRate * 100).toFixed(1)}%</div>
                            </div>
                        </>
                    )}

                    <div className="text-2xl">Игры</div>

                    <div className="flex gap-3 self-end">
                        <div className="relative">
                            <button 
                                className="text-2xl px-1 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white"
                                onClick={() => {
                                    setSortOpen(!sortOpen);
                                    setFilterOpen(false);
                                }}
                            >
                                Сортировка
                            </button>
                            {sortOpen && (
                                <div className="fixed right-0 bottom-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                    <div className="p-3">
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Сортировать по</label>
                                            <select 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={sort}
                                                onChange={(e) => setSort(parseInt(e.target.value))}
                                            >
                                                <option value={Sort.none}>Без сортировки</option>
                                                <option value={Sort.id}>ID игры</option>
                                                <option value={Sort.opponent}>Оппоненту</option>
                                                <option value={Sort.dimension}>Размеру поля</option>
                                                <option value={Sort.date}>Дате</option>
                                            </select>
                                        </div>
                                        <button 
                                            className="w-full mt-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            onClick={() => {
                                                setSortOpen(false);
                                                setReload(true);
                                            }}
                                        >
                                            Применить
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button 
                                className="text-2xl px-1 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white"
                                onClick={() => {
                                    setFilterOpen(!filterOpen);
                                    setSortOpen(false);
                                }}
                            >
                                Фильтр.
                            </button>
                            {filterOpen && (
                                <div className="fixed right-0 bottom-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                    <div className="p-3">
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Режим игры</label>
                                            <select 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={params.mode || ""}
                                                onChange={(e) => setParams({...params, mode: e.target.value || undefined})}
                                            >
                                                <option value="">Все</option>
                                                <option value="fixed">Фиксированный</option>
                                                <option value="infinite">Бесконечный</option>
                                            </select>
                                        </div>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Результат</label>
                                            <select 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={params.result || ""}
                                                onChange={(e) => setParams({...params, result: e.target.value || undefined})}
                                            >
                                                <option value="">Все</option>
                                                <option value="win">Победа</option>
                                                <option value="loss">Поражение</option>
                                                <option value="draw">Ничья</option>
                                                <option value="frozen">Замороженная</option>
                                            </select>
                                        </div>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Показать</label>
                                            <input 
                                                type="number" 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={params.limit || ""}
                                                onChange={(e) => setParams({...params, limit: e.target.value ? parseInt(e.target.value) : undefined})}
                                                min="1"
                                                max="100"
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Дата от</label>
                                            <input 
                                                type="date" 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={params.from_date ? new Date(params.from_date).toISOString().split('T')[0] : ""}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                                                    setParams({...params, from_date: date});
                                                }}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Дата до</label>
                                            <input 
                                                type="date" 
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={params.to_date ? new Date(params.to_date).toISOString().split('T')[0] : ""}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                                                    setParams({...params, to_date: date});
                                                }}
                                            />
                                        </div>
                                        <button 
                                            className="w-full mt-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            onClick={() => {
                                                setFilterOpen(false);
                                                setReload(true);
                                            }}
                                        >
                                            Применить
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {games && (
                        <div className="mt-4 w-full">
                            <table className="min-w-full bg-white rounded-md border border-gray-300 border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4">#</th>
                                        <th className="py-2 px-4">Оппонент</th>
                                        <th className="py-2 px-4">Режим</th>
                                        <th className="py-2 px-4">Размер</th>
                                        <th className="py-2 px-4">Результат</th>
                                        <th className="py-2 px-4">Дата</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {games.length > 0 ? (
                                        games.map((game: any, index: number) => (
                                            <tr key={game.id} className="text-center hover:bg-gray-100">
                                                <td className="py-2 px-4">{index + 1}</td>
                                                <td className="py-2 px-4">{game.opponentLogin}</td>
                                                <td className="py-2 px-4">{game.mode === 'fixed' ? 'Фиксированный' : 'Бесконечный'}</td>
                                                <td className="py-2 px-4">{game.dimensions}x{game.dimensions}</td>
                                                <td className="py-2 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-white text-xs ${
                                                        game.result === 'win' ? 'bg-green-600' :
                                                        game.result === 'loss' ? 'bg-red-600' : 
                                                            game.result === 'frozen' ? 'bg-blue-600' :
                                                        'bg-yellow-600'
                                                    }`}>
                                                        {game.result === 'win' ? 'Победа' :
                                                         game.result === 'loss' ? 'Поражение' :
                                                             game.result === 'frozen' ? 'Заморожена': 'Ничья'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4">{new Date(game.startedAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-2 px-4 text-center text-gray-500">Игр не найдено</td>
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

export default Profile;