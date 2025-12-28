# Security Model

    - Strong secrets via env only; no secrets in repo.
    - Enforce role-based access at viewset level.
    - CSRF/CORS configured for FE origin only.
    - Regular dependency scanning (Dependabot + CI audit).
    - CodeQL for code scanning.
    - Account lockout on repeated failures (configurable).
