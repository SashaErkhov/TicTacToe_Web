import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../AuthContext";
import {BACKEND_URL} from "../config.ts";

function New() {
    const navigate = useNavigate();
    const { user, accessToken } = useAuth();

    const findOnlineGame = async () => {
        try {
            // TODO уведомление о поиске

            const response = await fetch(`${BACKEND_URL}/matches/find`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/match/${data.matchId}`);
            } else {
                console.error("Failed to find game");
            }
        } catch (error) {
            console.log("Error finding game:", error);
        }
    }

    return (
        <div className="main-page">
            <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 py-5 px-5">

                {/* Верхняя панель с именем пользователя */}
                <div className="w-full flex justify-between items-center gap-5">
                    <div className="text-sm px-3 py-1">
                        {user?.username} {user?.rating ? `(Рейтинг: ${user.rating})` : ''}
                    </div>
                    <div className="flex gap-5">
                        <Link className="bg-[#D9D8D8] hover:bg-[#bdbcbc] text-sm px-3 py-1 rounded-md"
                        to="/profile">
                            Профиль
                        </Link>
                        <Link className="bg-[#D9D8D8] hover:bg-[#bdbcbc] text-sm px-3 py-1 rounded-md"
                        to="/leaders">
                            Лидеры
                        </Link>
                    </div>
                </div>

                {/* Заголовок */}
                <div className="text-2xl text-center">
                    Новая игра
                </div>

                {/* Основные кнопки */}
                <button
                    className="text-white text-2xl w-full h-[60px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
                    onClick={() => {
                        navigate("/match/hotseat");
                    }}
                >
                    Хотсит
                </button>

                <button className="text-white text-2xl w-full h-[60px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
                    onClick={findOnlineGame}
                >
                    Сетевая
                </button>
            </div>
        </div>
    );
}

export default New;
