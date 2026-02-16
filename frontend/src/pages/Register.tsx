import {Link, useNavigate} from 'react-router-dom';
import {useState} from "react";
import {BACKEND_URL} from './../config.ts';
import { useAuth } from '../AuthContext';

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const { setAccessToken, fetchUser } = useAuth();

    const handleRegister = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (isLoading) return;

        if (!username || !password || !confirmPassword) {
            setError("Заполните все поля");
            return;
        }

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const response = await fetch(`${BACKEND_URL}/auth/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAccessToken(data.accessToken);
                await fetchUser();
                navigate("/new");
                return;
            }

            if (response.status === 409) {
                setError("Игрок с таким логином уже существует");
            } else if (response.status === 400 || response.status === 422) {
                setError(
                    "Некорректный логин или пароль. 3≤логин≤32, 8≤пароль≤128"
                );
            } else {
                setError("Ошибка при регистрации");
            }
        } catch {
            setError("Ошибка соединения с сервером");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-page">
            <form
                onSubmit={handleRegister}
                className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5"
            >
                <input
                    type="text"
                    placeholder="Логин"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={username}
                    disabled={isLoading}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                    }}
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                />

                <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={confirmPassword}
                    disabled={isLoading}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                    }}
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white text-2xl w-full h-[100px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
                >
                    {isLoading ? "Загрузка..." : "Зарегистрироваться"}
                </button>

                {error && (
                    <div className="text-red-600 text-center p-3 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Уже есть аккаунт? Войдите
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default Register;
