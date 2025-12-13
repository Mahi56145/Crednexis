import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client")

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.database import Base, engine
from backend import main

client = TestClient(main.app)
FIXTURE_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture(autouse=True)
def prepare_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_features():
    return {"Income": 50000, "Age": 35, "Loan": 15000, "Loan to Income": 0.3}

@pytest.fixture
def google_stub(monkeypatch):
    def _fake_verify(token: str, client_id: str):
        return {
            "sub": "fake-sub",
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://example.com/pic.png",
        }
    monkeypatch.setattr(main, "verify_google_token", _fake_verify)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_predict_endpoint(sample_features):
    response = client.post("/predict", json={"features": sample_features})
    assert response.status_code == 200
    data = response.json()
    assert "default_probability" in data
    assert "risk_score" in data


def test_predict_csv_endpoint():
    path = FIXTURE_DIR / "sample.csv"
    with path.open("rb") as handle:
        response = client.post("/predict_csv", files={"file": ("sample.csv", handle, "text/csv")})
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total"] == 3
    assert len(data["predictions"]) == 3


def test_auth_flow_and_protected_endpoints(google_stub, sample_features):
    auth_response = client.post("/auth/google", json={"id_token": "test"})
    assert auth_response.status_code == 200
    tokens = auth_response.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    predict_response = client.post("/predict", json={"features": sample_features}, headers=headers)
    assert predict_response.status_code == 200
    explain_response = client.post("/explain", json={"features": sample_features}, headers=headers)
    assert explain_response.status_code == 200
    refresh_response = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_response.status_code == 200
    logout_response = client.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers=headers,
    )
    assert logout_response.status_code == 200
