from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SessionViewSet, WeeklyTimetableViewSet, TimetableCellViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")
router.register(r"weekly-timetables", WeeklyTimetableViewSet, basename="weekly-timetable")
router.register(r"timetable-cells", TimetableCellViewSet, basename="timetable-cell")

urlpatterns = [path("api/timetable/", include(router.urls))]

