from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionViewSet, TimetableEntryViewSet, WeeklyTimetableViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")
router.register(r"weekly-timetables", WeeklyTimetableViewSet, basename="weekly-timetable")
router.register(r"entries", TimetableEntryViewSet, basename="timetable-entry")

urlpatterns = [path("api/timetable/", include(router.urls))]
