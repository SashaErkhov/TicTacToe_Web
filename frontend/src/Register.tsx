import { Link } from 'react-router-dom';

function Register() {
  return (
    <div className="main-page">
      <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 p-5">
        <input
          type="text"
          placeholder="Логин"
          className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
        />
        <input
          type="password"
          placeholder="Пароль"
          className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
        />
        <input
          type="password"
          placeholder="Подтвердите пароль"
          className="w-full h-[100px] rounded-md border-2 border-dashed border-black p-5 text-2xl"
        />
        <button
          className="text-white text-2xl w-full h-[100px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center"
        >
          Зарегистрироваться
        </button>
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