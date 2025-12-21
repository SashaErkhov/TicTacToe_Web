import {Link, useNavigate} from 'react-router-dom';
import { BACKEND_URL } from "../config.ts";
import {useEffect, useState} from 'react';

function Start() {

    const navigate = useNavigate();

    const [good, setGood] = useState<boolean>(false);

    useEffect(() => {
        fetch(`${BACKEND_URL}/users/me`,{
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(response => {
            if (response.ok) {
                console.debug("Success post /auth/login");
                setGood(true);
            } else {
                console.debug('Error post /auth/login:', response.statusText);
                setGood(false);
            }
            })
            .catch(error => {
                console.debug('Error post /auth/login:', error);
                setGood(false);
            })
    }, []);
    if (good) {
        navigate("/new");
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