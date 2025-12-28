from django.urls import path

from .views import enqueue_transcript_generation, get_transcript, verify_transcript

urlpatterns = [
    path("api/transcripts/<int:student_id>/", get_transcript, name="get-transcript"),
    path(
        "api/transcripts/verify/<str:token>/",
        verify_transcript,
        name="verify-transcript",
    ),
    path(
        "api/transcripts/enqueue/",
        enqueue_transcript_generation,
        name="enqueue-transcript",
    ),
]
