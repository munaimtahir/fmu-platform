from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateMediaStorage(FileSystemStorage):
    """Filesystem storage with no public URL; files are served by authorized views."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("base_url", None)
        super().__init__(*args, **kwargs)

    @property
    def location(self):
        return str(settings.PRIVATE_MEDIA_ROOT)

    def url(self, name):
        raise ValueError("Private files do not have public URLs")
