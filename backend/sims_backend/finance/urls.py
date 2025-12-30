from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChallanViewSet, ChargeTemplateViewSet, ChargeViewSet, PaymentLogViewSet, StudentLedgerItemViewSet

router = DefaultRouter()
router.register(r"charge-templates", ChargeTemplateViewSet, basename="charge-template")
router.register(r"charges", ChargeViewSet, basename="charge")
router.register(r"ledger", StudentLedgerItemViewSet, basename="student-ledger")
router.register(r"challans", ChallanViewSet, basename="challan")
router.register(r"payments", PaymentLogViewSet, basename="payment")

urlpatterns = [path("api/finance/", include(router.urls))]
