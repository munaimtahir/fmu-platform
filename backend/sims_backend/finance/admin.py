from django.contrib import admin

from sims_backend.finance.models import (
    Adjustment,
    FeePlan,
    FeeType,
    FinancePolicy,
    LedgerEntry,
    Payment,
    Voucher,
    VoucherItem,
)


@admin.register(FeeType)
class FeeTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("code", "name")


@admin.register(FeePlan)
class FeePlanAdmin(admin.ModelAdmin):
    list_display = ("program", "term", "fee_type", "amount", "is_mandatory", "is_active")
    list_filter = ("program", "term", "fee_type", "is_active")
    search_fields = ("program__name", "term__name", "fee_type__code")


class VoucherItemInline(admin.TabularInline):
    model = VoucherItem
    extra = 0


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ("voucher_no", "student", "term", "status", "total_amount", "due_date")
    list_filter = ("status", "term")
    search_fields = ("voucher_no", "student__reg_no", "student__name")
    inlines = [VoucherItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("receipt_no", "student", "term", "amount", "method", "status", "received_at")
    list_filter = ("method", "status", "term")
    search_fields = ("receipt_no", "student__reg_no")


@admin.register(Adjustment)
class AdjustmentAdmin(admin.ModelAdmin):
    list_display = ("student", "term", "kind", "amount", "status", "approved_at")
    list_filter = ("kind", "status", "term")
    search_fields = ("student__reg_no", "student__name")


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("student", "term", "entry_type", "amount", "reference_type", "reference_id", "created_at")
    list_filter = ("entry_type", "reference_type", "term")
    search_fields = ("student__reg_no", "reference_id")


@admin.register(FinancePolicy)
class FinancePolicyAdmin(admin.ModelAdmin):
    list_display = ("rule_key", "threshold_amount", "fee_type", "is_active")
    list_filter = ("is_active",)
    search_fields = ("rule_key",)
