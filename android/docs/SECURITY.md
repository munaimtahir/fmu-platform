# Security

The release app disallows cleartext traffic and uses normal Android TLS hostname/certificate validation. It has no trust-all code or certificate pinning. The access token is memory-only; the refresh token is encrypted in `EncryptedSharedPreferences` using an Android Keystore-backed `MasterKey`, and application backup is disabled. Passwords and tokens are never logged; debug HTTP logging records only BASIC request metadata.
