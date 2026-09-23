import pytest


@pytest.fixture(autouse=True)
def isolated_uploaded_files(settings, tmp_path):
    """Uploaded fixtures must not write into the application's media volumes."""
    settings.MEDIA_ROOT = str(tmp_path / "media")
    settings.PRIVATE_MEDIA_ROOT = str(tmp_path / "private_media")
