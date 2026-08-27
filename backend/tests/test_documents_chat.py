from unittest.mock import patch

from fastapi.testclient import TestClient


def _authed_headers(client: TestClient) -> dict[str, str]:
    signup = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "password123"})
    token = signup.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_chat_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/documents/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert response.status_code == 401


def test_chat_rejects_empty_messages(client: TestClient) -> None:
    headers = _authed_headers(client)

    response = client.post("/api/documents/chat", json={"messages": []}, headers=headers)

    assert response.status_code == 422


def test_chat_rejects_unknown_document_type(client: TestClient) -> None:
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "hi"}], "documentType": "not_a_real_document"},
        headers=headers,
    )

    assert response.status_code == 422


@patch("app.routers.documents.get_document_chat_reply")
def test_chat_returns_reply_and_fields_for_known_document_type(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.return_value = (
        "Great, what's the effective date?",
        {"purpose": "Evaluate a partnership", "partyOne": {"printName": "Jane Doe"}},
    )
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={
            "messages": [{"role": "user", "content": "We want a partnership, I'm Jane Doe"}],
            "documentType": "mutual_nda",
        },
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "mutual_nda"
    assert body["reply"] == "Great, what's the effective date?"
    assert body["fields"]["purpose"] == "Evaluate a partnership"
    assert body["fields"]["partyOne"]["printName"] == "Jane Doe"
    mock_get_reply.assert_called_once_with("mutual_nda", mock_get_reply.call_args[0][1])


@patch("app.routers.documents.get_document_chat_reply")
def test_chat_round_trips_psa_multi_sow_fields(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.return_value = (
        "Got both SOWs.",
        {
            "sows": [
                {"sowId": "SOW 1", "fees": "$5,000"},
                {"sowId": "SOW 2", "fees": "$20,000"},
            ]
        },
    )
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "We have two SOWs"}], "documentType": "psa"},
        headers=headers,
    )

    assert response.status_code == 200
    sows = response.json()["fields"]["sows"]
    assert len(sows) == 2
    assert sows[1]["fees"] == "$20,000"


@patch("app.routers.documents.get_document_chat_reply")
def test_chat_round_trips_dpa_nested_annex_fields(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.return_value = (
        "Got it.",
        {
            "customerProcessingRole": "controller",
            "approvedSubprocessors": [{"name": "AWS", "country": "USA", "processingTasks": "Hosting"}],
        },
    )
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "We use AWS as a subprocessor"}], "documentType": "dpa"},
        headers=headers,
    )

    assert response.status_code == 200
    fields = response.json()["fields"]
    assert fields["customerProcessingRole"] == "controller"
    assert fields["approvedSubprocessors"][0]["name"] == "AWS"


@patch("app.routers.documents.get_document_chat_reply")
@patch("app.routers.documents.get_classification_reply")
def test_chat_resolves_document_type_and_chains_into_gathering(
    mock_classify, mock_get_reply, client: TestClient
) -> None:
    mock_classify.return_value = ("Great, let's set up your CSA.", "csa")
    mock_get_reply.return_value = ("What's the Subscription Period?", {"subscriptionPeriod": None})
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "I need a cloud SaaS agreement"}]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "csa"
    assert body["reply"] == "What's the Subscription Period?"
    assert body["fields"] is not None
    mock_classify.assert_called_once()
    mock_get_reply.assert_called_once()


@patch("app.routers.documents.get_classification_reply")
def test_chat_unsupported_document_offers_no_document_type(mock_classify, client: TestClient) -> None:
    mock_classify.return_value = (
        "I can't generate a last will and testament, but the closest thing I can help with is a "
        "Partnership Agreement. Would that work?",
        None,
    )
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "I need a will"}]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] is None
    assert body["fields"] is None
    assert "Partnership Agreement" in body["reply"]


@patch("app.routers.documents.get_document_chat_reply")
def test_chat_returns_502_when_llm_call_fails(mock_get_reply, client: TestClient) -> None:
    mock_get_reply.side_effect = RuntimeError("boom")
    headers = _authed_headers(client)

    response = client.post(
        "/api/documents/chat",
        json={"messages": [{"role": "user", "content": "hi"}], "documentType": "mutual_nda"},
        headers=headers,
    )

    assert response.status_code == 502
