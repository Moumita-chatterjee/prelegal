from fastapi.testclient import TestClient


def test_signup_creates_user_and_returns_token(client: TestClient) -> None:
    response = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_signup_rejects_duplicate_email(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})

    response = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "otherpassword"})

    assert response.status_code == 400


def test_signup_rejects_short_password(client: TestClient) -> None:
    response = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "short"})

    assert response.status_code == 422


def test_signin_with_correct_credentials_returns_token(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})

    response = client.post("/api/auth/signin", json={"email": "a@example.com", "password": "password123"})

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_signin_with_wrong_password_is_rejected(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})

    response = client.post("/api/auth/signin", json={"email": "a@example.com", "password": "wrongpassword"})

    assert response.status_code == 401


def test_signup_and_signin_with_password_over_bcrypt_byte_limit(client: TestClient) -> None:
    long_password = "a" * 100

    signup = client.post("/api/auth/signup", json={"email": "a@example.com", "password": long_password})
    assert signup.status_code == 201

    signin = client.post("/api/auth/signin", json={"email": "a@example.com", "password": long_password})
    assert signin.status_code == 200


def test_signin_with_unknown_email_is_rejected(client: TestClient) -> None:
    response = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "password123"})

    assert response.status_code == 401


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_returns_current_user_with_valid_token(client: TestClient) -> None:
    signup = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})
    token = signup.json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "a@example.com"


def test_health_check(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
