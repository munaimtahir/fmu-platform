# Configuration matrix

| Variable | Backend | Frontend build | Purpose |
|---|---:|---:|---|
| `PLATFORM_PROVIDER` / `VITE_PLATFORM_PROVIDER` | Yes | Yes | Vendor identity, default Vexel |
| `PLATFORM_NAME` / `VITE_PLATFORM_NAME` | Yes | Yes | Working platform name, default Vexel MedSIMS |
| `INSTITUTION_NAME` / `VITE_INSTITUTION_NAME` | Yes | Yes | Full college name |
| `INSTITUTION_SHORT_NAME` / `VITE_INSTITUTION_SHORT_NAME` | Yes | Yes | Operational display name |
| `INSTITUTION_LOGO` / `VITE_INSTITUTION_LOGO` | Yes | Yes | Optional logo URL/path |
| `INSTITUTION_EMAIL_DOMAIN` / `VITE_INSTITUTION_EMAIL_DOMAIN` | Yes | Yes | Generated/example email domain |
| `INSTITUTION_ADDRESS`, `PHONE`, `WEBSITE` | Yes | Yes | Institution contact details |
| `INSTITUTION_PRIMARY_COLOR`, `SECONDARY_COLOR` | Yes | Yes | Brand palette inputs |
| `REGULATORY_AUTHORITY`, `INSTITUTION_TYPE` | Yes | Yes | Medical-college context |
| `PUBLIC_APP_DOMAIN` | Yes | Yes | Hostname for same-origin deployment |

Secrets remain environment-only and are not part of this matrix.
