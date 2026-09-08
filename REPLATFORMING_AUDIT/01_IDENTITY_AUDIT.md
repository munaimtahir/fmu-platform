# Identity audit

| Area | Active references found | Action | Risk |
|---|---|---|---|
| Django settings | Fixed external hosts, origins, sender fallback | Replaced with `PUBLIC_APP_DOMAIN` and institution email settings | Medium |
| Django admin | FMU titles and logo | Uses central branding values; logo is optional | Low |
| Email/import services | PMC/FMU domains and sender | Uses `INSTITUTION_EMAIL_DOMAIN` and `DEFAULT_FROM_EMAIL` | Medium |
| React shell | FMU logo, title and login text | Uses reusable `branding` config | Low |
| Application form | FMU/MBBS-specific sentence | Uses medical-college programme-neutral wording | Low |
| Deployment | Legacy production URLs | Same-origin configurable `/api` build default | Medium |
| Fixtures/templates | Institutional email examples | Replaced with reserved examplemedical.edu values | Low |
| Documentation | Active product description and setup text | Updated product-facing docs; historical reports retained | Low |
| Historical/archive | Prior project reports and git history | Retained as historical evidence | None |

The full raw search is recorded in `07_REMAINING_REFERENCES.md`; file paths containing `archive`, migration history, and git metadata are intentionally excluded from runtime cleanup.
