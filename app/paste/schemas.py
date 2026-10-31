from pydantic import BaseModel, Field


class PasteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=65536)
    format: str = "sources.list"


class PasteResponse(BaseModel):
    id: str
    url: str
    expires_at: str