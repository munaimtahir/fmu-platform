"""Central platform and institution identity configuration."""

import os


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


PLATFORM_PROVIDER = _env("PLATFORM_PROVIDER", "Vexel")
PLATFORM_NAME = _env("PLATFORM_NAME", "Vexel MedSIMS")
INSTITUTION_NAME = _env("INSTITUTION_NAME", "Example Medical College")
INSTITUTION_SHORT_NAME = _env("INSTITUTION_SHORT_NAME", "Example Medical College")
INSTITUTION_LOGO = _env("INSTITUTION_LOGO")
INSTITUTION_ADDRESS = _env("INSTITUTION_ADDRESS")
INSTITUTION_EMAIL = _env("INSTITUTION_EMAIL", "registrar@examplemedical.edu")
INSTITUTION_EMAIL_DOMAIN = _env("INSTITUTION_EMAIL_DOMAIN", "examplemedical.edu")
INSTITUTION_PHONE = _env("INSTITUTION_PHONE")
INSTITUTION_WEBSITE = _env("INSTITUTION_WEBSITE")
INSTITUTION_PRIMARY_COLOR = _env("INSTITUTION_PRIMARY_COLOR", "#2563EB")
INSTITUTION_SECONDARY_COLOR = _env("INSTITUTION_SECONDARY_COLOR", "#0F172A")
REGULATORY_AUTHORITY = _env("REGULATORY_AUTHORITY")
INSTITUTION_TYPE = _env("INSTITUTION_TYPE", "Medical College")
PUBLIC_APP_DOMAIN = _env("PUBLIC_APP_DOMAIN", "localhost")


BRANDING = {
    "platform_provider": PLATFORM_PROVIDER,
    "platform_name": PLATFORM_NAME,
    "institution_name": INSTITUTION_NAME,
    "institution_short_name": INSTITUTION_SHORT_NAME,
    "institution_logo": INSTITUTION_LOGO,
    "institution_address": INSTITUTION_ADDRESS,
    "institution_email": INSTITUTION_EMAIL,
    "institution_email_domain": INSTITUTION_EMAIL_DOMAIN,
    "institution_phone": INSTITUTION_PHONE,
    "institution_website": INSTITUTION_WEBSITE,
    "institution_primary_color": INSTITUTION_PRIMARY_COLOR,
    "institution_secondary_color": INSTITUTION_SECONDARY_COLOR,
    "regulatory_authority": REGULATORY_AUTHORITY,
    "institution_type": INSTITUTION_TYPE,
    "public_app_domain": PUBLIC_APP_DOMAIN,
}
