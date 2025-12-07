import { Link } from "react-router-dom";
import {useEffect} from "react";
import {checkCookies} from "../foos.ts";

function New() {

    useEffect(() => {
        checkCookies();
    }, []);

    return (
        <div className="main-page">
            <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 py-5 px-5">

                {/* Верхняя панель */}
                <div className="w-full flex justify-end gap-5">
                    <Link className="bg-[#D9D8D8] hover:bg-[#bdbcbc] text-sm px-3 py-1 rounded-md"
                    to="/profile">
                        Профиль
                    </Link>
                    <button className="bg-[#D9D8D8] hover:bg-[#bdbcbc] text-sm px-3 py-1 rounded-md">
                        Лидеры
                    </button>
                </div>

                {/* Заголовок */}
                <div className="text-2xl text-center">
                    Новая игра
                </div>

                {/* Основные кнопки */}
                <button className="text-white text-2xl w-full h-[60px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center">
                    Хотсит
                </button>

                <button className="text-white text-2xl w-full h-[60px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center">
                    Сетевая
                </button>
            </div>
        </div>
    );
}

export default New;
