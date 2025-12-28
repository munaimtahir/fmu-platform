from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sims_backend.audit"
    label = "audit"
    verbose_name = "Audit"
