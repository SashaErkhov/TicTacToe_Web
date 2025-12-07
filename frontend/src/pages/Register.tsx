import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { BACKEND_URL } from './../config.ts';

function Register() {
    const [login, setLogin] = useState<string>("");
    const [pswd, setPswd] = useState<string>("");
    const [confirmPswd, setConfirmPswd] = useState<string>("");
    const [chng, setChng] = useState<boolean | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        if (!chng || !login || !pswd || !confirmPswd) {
            setChng(false);
            return;
        }
        if (pswd !== confirmPswd) {
            setError('Пароли не совпадают');
            setChng(false);
            return;
        }

        setIsLoading(true);

        fetch(`${BACKEND_URL}/auth/register`, {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: login,
                password: pswd
            })
        })
            .then(response => {
                if (response.ok) {
                    setError(undefined);
                    console.debug("Success post /auth/register")
                    navigate('/login');
                } else {
                    setError('Ошибка при регистрации');
                    console.error('Error post /auth/register:', response.statusText)
                }
            })
            .catch(error => {
                setError('Ошибка соединения с сервером');
                console.error('Error post /auth/register:', error);
            })
            .finally(() => {
                setIsLoading(false);
                setChng(false);
            });
    }, [login, pswd, confirmPswd, chng]);

    return (
        <div className="main-page">
            <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5">
                <input
                    type="text"
                    placeholder="Логин"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={pswd}
                    onChange={(e) => setPswd(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
                    value={confirmPswd}
                    onChange={(e) => setConfirmPswd(e.target.value)}
                />
                <button
                    className="text-white text-2xl w-full h-[100px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
                    onClick={() => {
                        setError(undefined);
                        setChng(true);
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
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
            </div>
        </div>
    );
}

export default Register;