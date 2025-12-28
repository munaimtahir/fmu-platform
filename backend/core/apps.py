from django.apps import AppConfig


class CoreConfig(AppConfig):
    """
    AppConfig for the 'core' Django app.

    This class provides the configuration for the 'core' app, which contains
    the core functionalities of the project, such as custom authentication,
    dashboard views, and base models.
    """
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
