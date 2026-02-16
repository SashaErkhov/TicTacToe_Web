import { Link } from 'react-router-dom';
import { useState } from 'react';

function MatchHotseat() {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [moves, setMoves] = useState<any[]>([]);

    const winner = calculateWinner(board);
    const currentPlayer = xIsNext ? 'X' : 'O';

    const handleClick = (i: number) => {
        if (winner || board[i]) return;

        const newBoard = [...board];
        newBoard[i] = currentPlayer;

        const newMove = {
            index: moves.length + 1,
            player: currentPlayer === 'X' ? 'Игрок 1' : 'Игрок 2',
            symbol: currentPlayer,
            position: `(${Math.floor(i/3)}, ${i%3})`,
            time: new Date().toLocaleTimeString()
        };

        setBoard(newBoard);
        setMoves([...moves, newMove]);
        setXIsNext(!xIsNext);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setMoves([]);
    };

    const getCellClass = (symbol: string) => {
        if (symbol === 'X') return 'bg-blue-600 text-white';
        if (symbol === 'O') return 'bg-red-600 text-white';
        return 'bg-white hover:bg-gray-100 cursor-pointer';
    };

    return (
        <div className="main-page">
            <div className="w-3xl h-xl bg-white rounded-md shadow-lg px-3 py-3 flex flex-col gap-3">

                {/* Header */}
                <div className="flex justify-between items-center border-2 border-black rounded-md px-3 py-3">
                    <div className="text-2xl">Хотсит игра</div>
                    <div className="flex gap-3">
                        <Link
                            className="text-2xl px-3 py-1 rounded-md bg-[#C5C5C5] hover:bg-gray-400 text-white"
                            to="/new"
                        >
                            Назад
                        </Link>
                        <button
                            className="text-2xl px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white"
                            onClick={resetGame}
                        >
                            Новая игра
                        </button>
                    </div>
                </div>

                {/* Content area */}
                <div className="border-2 border-black rounded-md min-h-[500px] p-3 flex flex-col items-center">

                    <div className="text-2xl mb-2">
                        {winner ? `Победитель: ${winner}` : `Ход игрока: ${currentPlayer}`}
                    </div>

                    {/* Игровое поле */}
                    <div className="mb-6">
                        <div className="grid grid-cols-3 gap-2">
                            {board.map((cell, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleClick(i)}
                                    className={`rounded-md w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-gray-300 ${getCellClass(cell)}`}
                                >
                                    {cell}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Список ходов */}
                    <div className="w-full">
                        <div className="text-2xl mb-2 text-center">История ходов</div>
                        {moves.length > 0 ? (
                            <table className="min-w-full bg-white rounded-md border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-4 border-b">#</th>
                                        <th className="py-2 px-4 border-b">Игрок</th>
                                        <th className="py-2 px-4 border-b">Символ</th>
                                        <th className="py-2 px-4 border-b">Позиция</th>
                                        <th className="py-2 px-4 border-b">Время</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moves.map((move) => (
                                        <tr key={move.index} className="text-center hover:bg-gray-100">
                                            <td className="py-2 px-4 border-b">{move.index}</td>
                                            <td className="py-2 px-4 border-b">{move.player}</td>
                                            <td className="py-2 px-4 border-b">
                                                <span className={`inline-block w-6 h-6 rounded ${move.symbol === 'X' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                                                    {move.symbol}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 border-b">{move.position}</td>
                                            <td className="py-2 px-4 border-b">{move.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                Нажмите на клетку, чтобы сделать первый ход
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function calculateWinner(squares: (string | null)[]) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
        const [a, b, c] = line;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

export default MatchHotseat;