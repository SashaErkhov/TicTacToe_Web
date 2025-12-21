import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { BACKEND_URL } from './../config.ts';

function Login() {
    const [username, setLogin] = useState<string>("");
    const [pswd, setPswd] = useState<string>("");
    const [chng, setChng] = useState<boolean | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        if (!chng || !username || !pswd) { setChng(false); return; }
        setIsLoading(true);

        fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({
                username: username,
                password: pswd
            })
        })
        .then(response => {
            if (response.ok) {
                setError(undefined);
                console.debug("Success post /auth/login");
                navigate('/new');
            } else {
                setError('Неверный логин или пароль');
                console.error('Error post /auth/login:', response.statusText);
            }
        })
        .catch(error => {
            setError('Ошибка соединения с сервером');
            console.error('Error post /auth/login:', error);
        })
        .finally(() => {
            setIsLoading(false);
            setChng(false);
        });
    }, [username, pswd, chng]);

  return (
    <div className="main-page">
      <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5">
        <input
          type="text"
          placeholder="Логин"
          className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
          value={username}
          onChange={(e) => setLogin(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
          value={pswd}
          onChange={(e) => setPswd(e.target.value)}
        />
        <button
          className="text-white text-2xl w-full h-[100px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
          onClick={() => {
              setError(undefined);
              setChng(true);
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Войти'}
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
      </div>
    </div>
  );
}

export default Login;