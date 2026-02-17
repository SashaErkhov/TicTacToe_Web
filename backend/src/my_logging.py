import logging
from enum import StrEnum

LOG_FORMAT_DEBUG = "%(levelName)s:%(message)s:%(pathname)s:%(funcName)s:%(lineno)d"

class LogLevels(StrEnum):
    info = "INFO"
    warn = "WARN"
    debug = "DEBUG"
    error = "ERROR"


def configure_logging(log_level: LogLevels | str = LogLevels.error):
    log_level = str(log_level).upper()
    log_levels = [level.value for level in LogLevels]

    if log_level not in log_levels:
        logging.basicConfig(level=LogLevels.error)
        return

    if log_level == LogLevels.debug:
        logging.basicConfig(level=log_level, format=LOG_FORMAT_DEBUG)
        return

    logging.basicConfig(level=log_level)
