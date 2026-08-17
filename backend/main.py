
from fastapi import FastAPI

# Python's built-in library for working with JSON.
import json
# Used for data validation.
from pydantic import BaseModel
# Using our own file(generator.py)
from generator import generate


app = FastAPI()

# reading data.
def load_data():
    with open("repository_data.json", "r") as file:
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
    content = generate(
        mirror=data.mirror,
        release=data.release,
        components=data.components,
        suites=data.suites,
    )
# answer Api
    return {
        "format": "sources.list",
        "content": content
    }