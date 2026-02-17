# triggers.py
from sqlalchemy import event, DDL
from models import Gamer, Game

create_trigger_sql = """
CREATE OR REPLACE FUNCTION delete_empty_games()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM games
    WHERE f_gamer_id IS NULL
      AND s_gamer_id IS NULL;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gamers_delete_empty_games ON gamers;

CREATE TRIGGER gamers_delete_empty_games
AFTER DELETE ON gamers
FOR EACH ROW
EXECUTE FUNCTION delete_empty_games();
"""

event.listen(
    Gamer.__table__,
    'after_create',
    DDL(create_trigger_sql)
)