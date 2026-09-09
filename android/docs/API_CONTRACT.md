# API Contract

Schema source: current backend schema generated from `/api/schema/`; saved as `../api/openapi-current.yaml`.

Authentication uses `POST api/auth/login/` with `identifier` and `password`, returning `user` and access/refresh tokens. `POST api/auth/refresh/` accepts a refresh token and can rotate it. `GET api/auth/me/` is the primary identity endpoint; `POST api/auth/logout/` invalidates the refresh token.

The server uses page-number pagination (default page size 50), filtering and ordering where enabled. It has mixed error shapes (`error.code/message`, `detail`, and field errors), so the client maps status and safe user messages rather than exposing raw bodies. Upload and asynchronous import/transcript APIs remain deferred parity work.
