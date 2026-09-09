# Architecture

The app follows UI → ViewModel → repository → Retrofit data-source flow. Composables do not make network calls. DTOs are kept at the network boundary; session/UI states are immutable StateFlow values. Hilt supplies the networking and session graph.

Foundation features are authentication, the application shell, home, profile and settings. Future parity features belong in feature packages and must retain backend-authoritative permissions.
