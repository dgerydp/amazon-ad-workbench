from sqlalchemy.orm import Session

from app.db.session import get_db


DBSession = Session

__all__ = ["get_db", "DBSession"]

