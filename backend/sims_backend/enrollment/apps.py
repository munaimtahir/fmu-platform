from django.apps import AppConfig


class EnrollmentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sims_backend.enrollment"
    label = "enrollment"
    verbose_name = "Enrollment"
