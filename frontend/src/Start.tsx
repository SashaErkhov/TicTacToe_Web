import { Link } from 'react-router-dom';

function Start() {
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