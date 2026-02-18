import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

type Mode = "fixed" | "infinite";

function HotseatSetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("fixed");
  const [dimensions, setDimensions] = useState<number>(3);

  const dimOptions = useMemo(() => [3, 4, 5, 6, 7, 8, 9, 10], []);

  const canStart = mode === "infinite" || (Number.isInteger(dimensions) && dimensions >= 3);

  const start = () => {
    const params = new URLSearchParams();
    params.set("mode", mode);

    params.set("dimensions", String(dimensions));

    navigate(`/match/hotseat?${params.toString()}`);
  };

  return (
    <div className="main-page">
      <div className="w-md h-md rounded-md bg-white shadow-lg flex flex-col gap-5 py-5 px-5">

        <div className="w-full flex justify-between items-center">
          <div className="text-2xl">Хотсит</div>
          <Link
            className="bg-[#D9D8D8] hover:bg-[#bdbcbc] text-sm px-3 py-1 rounded-md"
            to="/new"
          >
            Назад
          </Link>
        </div>

        <div className="text-xl">Настройки</div>

        {/* Mode */}
        <div className="border rounded-md p-3 flex flex-col gap-3">
          <div className="text-lg">Режим</div>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="fixed"
              checked={mode === "fixed"}
              onChange={() => setMode("fixed")}
            />
            <span>Фиксированное поле</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="infinite"
              checked={mode === "infinite"}
              onChange={() => setMode("infinite")}
            />
            <span>Бесконечное поле</span>
          </label>
        </div>

        {/* Dimensions */}
        <div className={`border rounded-md p-3 flex flex-col gap-3 ${mode !== "fixed" ? "opacity-60" : ""}`}>
          <div className="text-lg">Размерность (N×N)</div>

          {mode === "fixed" ? (
            <select
              className="border rounded-md px-2 py-2"
              value={dimensions}
              onChange={(e) => setDimensions(parseInt(e.target.value, 10))}
            >
              {dimOptions.map((d) => (
                <option key={d} value={d}>
                  {d}×{d}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-gray-600">Для бесконечного режима размерность не фиксируется</div>
          )}
        </div>

        <button
          className="text-white text-2xl w-full h-[60px] rounded-md bg-[#9F2D20] hover:bg-[#47140e] flex items-center justify-center disabled:opacity-50"
          onClick={start}
          disabled={!canStart}
        >
          Начать
        </button>
      </div>
    </div>
  );
}

export default HotseatSetup;
