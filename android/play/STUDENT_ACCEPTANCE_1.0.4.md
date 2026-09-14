# Sanitized Student acceptance script

Use a seeded Student account only; do not put credentials, names, registration numbers, or
screenshots containing personal data in this file.

1. Sign in as Student; confirm Home, Timetable, Attendance, Results, Services, and Profile load.
2. Open Services; confirm fee summary, learning feed, compliance state, notification unread count,
   mark-one-read, mark-all-read, and notification pagination.
3. Open an HTTPS learning link; reject any non-HTTP(S) link. Confirm the system browser/viewer owns
   the handoff.
4. Submit a harmless seeded compliance text value. Confirm the impact dialog, server refresh, and
   `submitted` state. Verify locked and rejected seeded requirements show their respective UI.
5. Disable networking. Confirm every read reports/reveals failure on refresh and profile/password,
   notification, and compliance writes fail without being queued. Restore networking and retry.
6. Change then restore the seeded profile email/password where the test fixture permits; verify
   server field errors are attached to the relevant form field.
7. Sign out, sign in as a second seeded Student, and confirm no previous Student data appears.
8. Expire the session or revoke refresh token; confirm return to sign-in and no Student screen is
   reachable from a staff account.

Record pass/fail, device/API level, build SHA, and sanitized evidence in the release ticket.
