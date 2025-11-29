import { Link } from 'react-router-dom';

function Start() {
  return (
    <div className="main-page">
      <div className="w-[450px] h-[260px] rounded-lg bg-white shadow-lg">
        <Link to="/login">
          <div className="w-[410px] h-[100px] m-5 rounded-lg spbu flex items-center justify-center">
            <span className="text-white text-2xl">Войти</span>
          </div>
        </Link>
        <Link to="/register">
          <div className="w-[410px] h-[100px] m-5 rounded-lg spbu flex items-center justify-center">
            <span className="text-white text-2xl">Зарегистрироваться</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Start;