import json
from pathlib import Path

import pytest

from app.documents.fields import build_field_instructions, build_response_schema
from app.documents.models import fields_model_for
from app.documents.registry import ALL_DOCUMENT_TYPES, CATALOG_NAME_TO_SLUG, REGISTRY

SLUGS = [doctype.slug for doctype in ALL_DOCUMENT_TYPES]


@pytest.mark.parametrize("slug", SLUGS)
def test_response_schema_is_strict_json_schema(slug: str) -> None:
    schema = build_response_schema(REGISTRY[slug])
    fields_schema = schema["properties"]["fields"]
    assert fields_schema["additionalProperties"] is False
    assert set(fields_schema["required"]) == set(fields_schema["properties"].keys())

    def check_object(node: dict) -> None:
        if node.get("type") == "object" or (isinstance(node.get("type"), list) and "object" in node["type"]):
            assert node["additionalProperties"] is False
            assert set(node["required"]) == set(node["properties"].keys())
            for child in node["properties"].values():
                check_object(child)
        elif "items" in node:
            check_object(node["items"])

    for field_schema in fields_schema["properties"].values():
        check_object(field_schema)

    # Must be JSON-serializable (round-trips through litellm/OpenRouter as-is).
    json.dumps(schema)


@pytest.mark.parametrize("slug", SLUGS)
def test_pydantic_model_accepts_fully_null_payload(slug: str) -> None:
    model = fields_model_for(slug)
    schema = build_response_schema(REGISTRY[slug])
    empty = {key: None for key in schema["properties"]["fields"]["properties"]}
    validated = model.model_validate(empty)
    assert validated.model_dump() == empty


@pytest.mark.parametrize("slug", SLUGS)
def test_prompt_field_instructions_nonempty(slug: str) -> None:
    doctype = REGISTRY[slug]
    instructions = build_field_instructions(doctype)
    assert instructions.strip()
    # Every ask_in_chat top-level field key should appear somewhere in the instructions.
    for f in doctype.fields:
        if f.ask_in_chat:
            assert f.key in instructions


def test_catalog_json_matches_registry() -> None:
    catalog_path = Path(__file__).resolve().parents[2] / "catalog.json"
    with open(catalog_path, encoding="utf-8") as f:
        catalog = json.load(f)

    catalog_names = {entry["name"] for entry in catalog}
    assert catalog_names == set(CATALOG_NAME_TO_SLUG.keys())

    registered_slugs = {doctype.slug for doctype in ALL_DOCUMENT_TYPES}
    assert set(CATALOG_NAME_TO_SLUG.values()) == registered_slugs
