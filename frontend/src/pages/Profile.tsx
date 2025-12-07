import { useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import {BACKEND_URL} from "./../config.ts";
import { checkCookies } from "./../foos.ts";

function Profile() {
    const navigate = useNavigate();

    const logout = () => {
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
    };

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [data, setData] = useState<any>(undefined)
    const [login, setLogin] = useState<string>("");
    const [level, setLevel] = useState<number>(0);

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
        setData(undefined);
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
                setData(data);
                setError("");
            })
            .catch(error => {
                console.error('Error get /users/me:', error);
                setError(error);
                setData(undefined);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (data === undefined) return;
        setLogin(data.login);
        setLevel(data.level);
    }, [data]);

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
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-5 py-5 flex flex-col gap-5">

                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-3xl">{login}. Уровень игрока: {level}</div>
                    <button
                        className="text-3xl px-6 py-2 border-2 border-black rounded-md bg-gray-300 hover:bg-gray-400"
                        onClick={() => logout()}
                    >
                        Выйти
                    </button>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-4 flex flex-col items-center">

                    <div className="text-4xl mt-2">Игры</div>

                    <div className="flex gap-4 mt-5">
                        <button className="text-3xl px-6 py-2 border-2 border-black rounded-md bg-gray-300 hover:bg-gray-400">
                            Сортировка
                        </button>
                        <button className="text-3xl px-6 py-2 border-2 border-black rounded-md bg-gray-300 hover:bg-gray-400">
                            Фильтр.
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Profile;