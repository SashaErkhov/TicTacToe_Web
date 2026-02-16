import {Link, useNavigate} from 'react-router-dom';
import {useState} from "react";
import {useAuth} from '../AuthContext';
import {BACKEND_URL} from '../config';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const { setAccessToken, fetchUser } = useAuth();

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isLoading) return;

        if (!username || !password) {
            setError("Введите логин и пароль");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                setError("Неверный логин или пароль");
                return;
            }

            const data = await response.json();

            setAccessToken(data.accessToken);

            await fetchUser();

            navigate("/new");
        } catch {
            setError("Ошибка соединения с сервером");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-page">
            <form
                onSubmit={handleLogin}
                className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5"
            >
                <input
                    type="text"
                    placeholder="Логин"
                    value={username}
                    disabled={isLoading}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                    }}
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="text-white text-2xl w-full h-[100px] rounded-md bg-[#9F2D20] hover:bg-[#47140e]"
                >
                    {isLoading ? "Загрузка..." : "Войти"}
                </button>

                {error && (
                    <div className="text-red-600 text-center p-3 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Нет аккаунта? Зарегистрируйтесь
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default Login;
