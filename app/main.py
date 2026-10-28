"""
repository generator API.

FastAPI application for validating Debian repository
configuration options and generating sources.list content.
"""

# Python's built-in library for working with JSON.
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Used for data validation.
from pydantic import BaseModel

# Using our own file(generator.py)
from .generator import generate
from .validator import (
    valid_components,
    valid_mirror,
    valid_release,
    valid_suites,
)
from pathlib import Path

app = FastAPI()
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


@app.get("/")
def home():
    return {
        "message": "Repository Generator API"
    }


@app.get("/repository_data")
def repo_data():
    return load_data()


@app.post("/generator")
def generator(data: RepositoryRequest):

# Run Generator.
    repository_data = load_data()
    if not valid_release(
        data.release,
        repository_data
    ):
        return {
            "error": f"Invalid release: {data.release}"
        }

    if not valid_components(
        data.components,
        repository_data
    ):
        return {
            "error": "Invalid component"
        }

    if not valid_suites(
        data.suites,
        repository_data,
        data.release
    ):
        return {
            "error": "Invalid suite"
        }

    if not valid_mirror(
        data.mirror,
        repository_data
    ):
        return {
            "error": "Invalid mirror"
        }

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