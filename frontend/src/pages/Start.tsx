import {Link, useNavigate} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {apiFetch} from "../api.ts";

function Start() {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;

        async function checkAuth() {
            try {
                const response = await apiFetch('/users/me');

                if (isMounted) {
                    if (response.ok) {
                        console.debug("User is authenticated, redirecting to /new");
                        navigate('/new');
                    } else {
                        setIsChecking(false);
                    }
                }
            } catch (error) {
                console.debug('Auth check failed:', error);
                if (isMounted) {
                    setIsChecking(false);
                }
            }
        }

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    if (isChecking) {
        return (
            <div className="main-page">
                <div className="w-md h-md rounded-md bg-white shadow-lg flex items-center justify-center">
                    Загрузка...
                </div>
            </div>
        );
    }

  return (
    <div className="main-page">
      <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5">
        <Link to="/login"
                   className="text-white text-2xl w-full h-[100px] rounded-md
              hover:bg-[#47140e] flex items-center justify-center bg-[#9F2D20]">
            Войти
        </Link>
        <Link to="/register"
            className="text-white text-2xl w-full h-[100px] rounded-md
            hover:bg-[#47140e] flex items-center justify-center bg-[#9F2D20]">
            Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}

export default Start;