from fastapi.testclient import TestClient


def _authed_headers(client: TestClient, email: str = "a@example.com") -> dict[str, str]:
    signup = client.post("/api/auth/signup", json={"email": email, "password": "password123"})
    token = signup.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_document(client: TestClient, headers: dict[str, str], **overrides) -> dict:
    payload = {
        "documentType": "mutual_nda",
        "title": "Acme NDA",
        "messages": [{"role": "user", "content": "We want an NDA"}],
        "fields": {"purpose": "Evaluate a partnership"},
    }
    payload.update(overrides)
    response = client.post("/api/documents", json=payload, headers=headers)
    assert response.status_code == 201
    return response.json()


def test_create_document_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/documents", json={"documentType": "mutual_nda"})

    assert response.status_code == 401


def test_create_document_rejects_unknown_document_type(client: TestClient) -> None:
    headers = _authed_headers(client)

    response = client.post("/api/documents", json={"documentType": "not_a_real_document"}, headers=headers)

    assert response.status_code == 422


def test_create_and_get_document_round_trips_fields_and_messages(client: TestClient) -> None:
    headers = _authed_headers(client)

    created = _create_document(client, headers)
    response = client.get(f"/api/documents/{created['id']}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["documentType"] == "mutual_nda"
    assert body["title"] == "Acme NDA"
    assert body["messages"] == [{"role": "user", "content": "We want an NDA"}]
    assert body["fields"]["purpose"] == "Evaluate a partnership"


def test_list_documents_orders_by_most_recently_updated(client: TestClient) -> None:
    headers = _authed_headers(client)

    first = _create_document(client, headers, title="First")
    second = _create_document(client, headers, title="Second")

    response = client.get("/api/documents", headers=headers)

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert ids == [second["id"], first["id"]]


def test_update_document_persists_new_fields_and_messages(client: TestClient) -> None:
    headers = _authed_headers(client)
    created = _create_document(client, headers)

    response = client.put(
        f"/api/documents/{created['id']}",
        json={
            "documentType": "mutual_nda",
            "title": "Acme NDA",
            "messages": [
                {"role": "user", "content": "We want an NDA"},
                {"role": "assistant", "content": "What's the effective date?"},
            ],
            "fields": {"purpose": "Evaluate a partnership", "effectiveDate": "2026-09-01"},
        },
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["messages"]) == 2
    assert body["fields"]["effectiveDate"] == "2026-09-01"


def test_delete_document_removes_it(client: TestClient) -> None:
    headers = _authed_headers(client)
    created = _create_document(client, headers)

    delete_response = client.delete(f"/api/documents/{created['id']}", headers=headers)
    get_response = client.get(f"/api/documents/{created['id']}", headers=headers)

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_documents_are_scoped_to_the_owning_user(client: TestClient) -> None:
    owner_headers = _authed_headers(client, email="owner@example.com")
    other_headers = _authed_headers(client, email="other@example.com")
    created = _create_document(client, owner_headers)

    get_response = client.get(f"/api/documents/{created['id']}", headers=other_headers)
    list_response = client.get("/api/documents", headers=other_headers)
    update_response = client.put(
        f"/api/documents/{created['id']}",
        json={"documentType": "mutual_nda", "messages": [], "fields": {}},
        headers=other_headers,
    )
    delete_response = client.delete(f"/api/documents/{created['id']}", headers=other_headers)

    assert get_response.status_code == 404
    assert list_response.json() == []
    assert update_response.status_code == 404
    assert delete_response.status_code == 404


def test_get_nonexistent_document_returns_404(client: TestClient) -> None:
    headers = _authed_headers(client)

    response = client.get("/api/documents/999", headers=headers)

    assert response.status_code == 404
