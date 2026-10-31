import uuid
from datetime import datetime

from sqlalchemy import DateTime,String,Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase , Mapped , mapped_column


class Base(DeclarativeBase):
    pass
class Paste (Base):
    __tablename__ = "pastes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    content: Mapped[str] = mapped_column (
        Text,
        nullable=False,

    )

    format: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="sources.list"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )