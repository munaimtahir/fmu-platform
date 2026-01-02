from django.urls import include, path
from rest_framework.routers import DefaultRouter

from sims_backend.finance.views import (
    AdjustmentViewSet,
    FeePlanViewSet,
    FeeTypeViewSet,
    FinancePolicyViewSet,
    FinanceReportViewSet,
    LedgerEntryViewSet,
    PaymentViewSet,
    StudentFinanceSummaryViewSet,
    VoucherViewSet,
)

router = DefaultRouter()
router.register(r"finance/fee-types", FeeTypeViewSet, basename="fee-type")
router.register(r"finance/fee-plans", FeePlanViewSet, basename="fee-plan")
router.register(r"finance/vouchers", VoucherViewSet, basename="voucher")
router.register(r"finance/payments", PaymentViewSet, basename="payment")
router.register(r"finance/ledger", LedgerEntryViewSet, basename="ledger")
router.register(r"finance/adjustments", AdjustmentViewSet, basename="adjustment")
router.register(r"finance/policies", FinancePolicyViewSet, basename="finance-policy")
router.register(r"finance/students", StudentFinanceSummaryViewSet, basename="finance-student")
router.register(r"finance/reports", FinanceReportViewSet, basename="finance-reports")

urlpatterns = [path("api/", include(router.urls))]
