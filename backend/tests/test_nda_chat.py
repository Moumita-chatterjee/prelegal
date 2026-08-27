from unittest.mock import patch

from fastapi.testclient import TestClient

from app.schemas import NdaFieldsUpdate, PartyFieldsUpdate


def _authed_headers(client: TestClient) -> dict[str, str]:
    signup = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})
    token = signup.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_chat_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/nda/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 401


def test_chat_rejects_empty_messages(client: TestClient) -> None:
    headers = _authed_headers(client)

    response = client.post("/api/nda/chat", json={"messages": []}, headers=headers)

    assert response.status_code == 422


@patch("app.routers.nda.get_nda_chat_reply")
def test_chat_returns_reply_and_fields(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.return_value = (
        "Great, and what's the effective date?",
        NdaFieldsUpdate(purpose="Evaluate a partnership", partyOne=PartyFieldsUpdate(printName="Jane Doe")),
    )
    headers = _authed_headers(client)

    response = client.post(
        "/api/nda/chat",
        json={"messages": [{"role": "user", "content": "We want to discuss a partnership, I'm Jane Doe"}]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "Great, and what's the effective date?"
    assert body["fields"]["purpose"] == "Evaluate a partnership"
    assert body["fields"]["partyOne"]["printName"] == "Jane Doe"
    assert body["fields"]["effectiveDate"] is None


@patch("app.routers.nda.get_nda_chat_reply")
def test_chat_returns_502_when_llm_call_fails(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.side_effect = RuntimeError("boom")
    headers = _authed_headers(client)

    response = client.post(
        "/api/nda/chat",
        json={"messages": [{"role": "user", "content": "hi"}]},
        headers=headers,
    )

    assert response.status_code == 502
