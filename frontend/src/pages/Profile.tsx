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

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [user, setUser] = useState<any>(undefined)
    const [login, setLogin] = useState<string>("");
    const [level, setLevel] = useState<number>(0);
    const [stats, setStats] = useState<any>(undefined);
    const [games, setGames] = useState<any>(undefined);
    const [params, setParams] = useState<any>({
        mode: undefined,
        result: undefined,
        from_date: undefined,
        to_date: undefined,
        limit: undefined,
    });



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
        setIsLoading(true);
        setGames(undefined);
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
                setGames(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get /users/me/matches:', error);
                setError(error);
                setGames(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [params]);

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
                <div className="w-md h-md bg-white rounded-md shadow-lg px-5 py-5 text-red-600 bg-red-100">
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
                        <button className="text-2xl px-1  rounded-md bg-[#C5C5C5] hover:bg-gray-400
                        text-white">
                            Сортировка
                        </button>
                        <button className="text-2xl px-1  rounded-md bg-[#C5C5C5] hover:bg-gray-400
                        text-white">
                            Фильтр.
                        </button>
                    </div>

                    {games && (
                        <></>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Profile;