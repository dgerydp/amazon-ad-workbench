from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.demo import DemoBootstrapRequest
from app.services.demo_data import bootstrap_demo_data


router = APIRouter()


@router.post("/bootstrap")
def demo_bootstrap(payload: DemoBootstrapRequest, db: Session = Depends(get_db)) -> dict:
    return bootstrap_demo_data(
        db=db,
        reset=payload.reset,
        use_ai=payload.use_ai,
        provider=payload.provider,
        model=payload.model,
    )
