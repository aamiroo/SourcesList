"""
tser for main.py with pytest
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Repository Generator API"
    }


def test_repository_data():
    response = client.get("/repository_data")

    assert response.status_code == 200
    assert "components" in response.json()
    assert "suites" in response.json()


def test_generator():
    response = client.post(
        "/generator",
        json={
            "mirror": "https://deb.debian.org/debian",
            "release": "stable",
            "components": ["main"],
            "suites": ["trixie"]
        }
    )

    assert response.status_code == 200

    data = response.json()
    assert "format" in data
    assert "content" in data