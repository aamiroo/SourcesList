"""
repository generator API.

FastAPI application for validating Debian repository
configuration options and generating sources.list content.
"""

import json

from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .paste.database import create_table
from .paste.router import router as paste_router
from .generator import generate
from .validator import (
    valid_components,
    valid_mirror,
    valid_release,
    valid_suites,
)

from pathlib import Path


app = FastAPI()

@app.on_event("startup")
def startup():
    create_table()

app.include_router(paste_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# reading data.
def load_data():
    data_file = Path(__file__).resolve().parent / "repository_data.json"
    with data_file.open("r", encoding="utf-8") as file:
        return json.load(file)

# Building a request model.
class RepositoryRequest(BaseModel):
    mirror: str
    release: str
    components: list[str]
    suites: list[str]


@app.get("/api/health")
def home():
    return {
        "message": "Repository Generator API"
    }


@app.get("/api/repository_data")
def repo_data():
    return load_data()


@app.post("/api/generator")
def generator(data: RepositoryRequest):

    # Run Generator.
    repository_data = load_data()
    if not valid_release(
        data.release,
        repository_data
    ):
        raise HTTPException(
                status_code=400,
                detail=f"Invalid release: {data.release}",
            )

    if not valid_components(
        data.components,
        repository_data
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid components: {data.release}",
        )

    if not valid_suites(
        data.suites,
        repository_data,
        data.release
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid suites: {data.release}",
        )

    if not valid_mirror(
        data.mirror,
        repository_data
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mirror: {data.mirror}",
        )
        

    release_data = repository_data["suites"][data.release]

    security_suites = release_data.get("security" , [])
    security_mirror = release_data.get(
        "security_repository",
        repository_data["official_mirrors"]["security"],
    )
    lines = []

    for suite in data.suites:
        mirror = (
            security_mirror
            if suite in security_suites
            else data.mirror
        )
        
        content = generate(
            mirror=mirror,
            components=data.components,
            suites=[suite],
        )
        lines.append(content)

    content = "\n".join(lines)
    
    return {
        "format": "sources.list",
        "content": content
    }


FRONTEND_DIR = Path(__file__).resolve().parents[1] / "frontend"


@app.get("/paste/{paste_id}")
def paste_page(paste_id: str):
    return FileResponse(FRONTEND_DIR / "index.html")


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")