import uuid
from datetime import datetime , timedelta , timezone

from fastapi import APIRouter , Depends , HTTPException
from sqlalchemy.orm import Session

from .models import Paste
from .database import get_session_local
from .schemas import PasteCreate , PasteResponse

router = APIRouter(prefix="/paste" , tags=["Paste"])

def get_db ():
    db = get_session_local()
    try:
        yield db
    finally:
        db.close()

@router.post("/" , response_model=PasteResponse)
def create_paste(data: PasteCreate, db : Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    paste = Paste(
        content=data.content,
        format=data.format,
        created_at=now,
        expires_at=now + timedelta(hours=2)
    )

    db.add(paste)
    db.commit()
    db.refresh(paste)

    return PasteResponse(
        id = str(paste.id),
        url= f"/paste/{paste.id}",
        expires_at=paste.expires_at.isoformat()
    )

@router.get("/{paste_id}")
def get_paste(paste_id: uuid.UUID, db: Session = Depends(get_db)):
    paste = db.query(Paste).filter(
        Paste.id == paste_id,
        Paste.expires_at > datetime.now(timezone.utc)
    ).first()

    if paste is None:
        raise HTTPException(
            status_code=404,
            detail="Paste not found or expired"
        )

    return{
        "format":paste.format,
        "content":paste.content,
        "expires_at":paste.expires_at.isoformat()
    }