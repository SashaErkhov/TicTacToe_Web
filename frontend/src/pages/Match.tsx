import {Link, useNavigate, useParams} from 'react-router-dom';
import { BACKEND_URL } from "../config.ts";
import {useEffect, useState} from 'react';
import {checkCookies} from "../foos.ts";

function Match() {
    const { matchId } = useParams<{ matchId: string }>();

    const [error, setError] = useState<string>("");

    let ID: number = NaN;

    if (matchId === undefined) {
        console.error("Match ID is undefined");
        setError("ID игры не указан");
    } else {
        ID = parseInt(matchId);
    }
    if (isNaN(ID)) {
        console.error("Invalid match ID");
        setError("Неверный ID игры");
    }

    useEffect(() => {
        try {
            checkCookies();
        } catch {
            setError("Ошибка авторизации");
            console.error("Error auth");
        }
    }, []);

    if (error) {
        return (
            <></>
        );
    }
    return (
        <div>{ID}</div>
    );
}

export default Match;