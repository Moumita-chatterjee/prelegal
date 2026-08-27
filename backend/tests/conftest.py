import os
import tempfile
from collections.abc import Iterator

import pytest

# A plain mkdtemp (rather than TemporaryDirectory) avoids an atexit cleanup
# race with SQLAlchemy's open sqlite file handle on Windows.
os.environ["DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
def client() -> Iterator[TestClient]:
    # Entering/exiting the TestClient context runs the app's lifespan, which
    # resets the database, giving each test a clean set of tables.
    with TestClient(app) as test_client:
        yield test_client
