from django.contrib import admin

from sims_backend.finance.models import Challan, Charge, ChargeTemplate, PaymentLog, StudentLedgerItem


@admin.register(ChargeTemplate)
class ChargeTemplateAdmin(admin.ModelAdmin):
    list_display = ['title_template', 'default_amount', 'frequency_unit', 'frequency_interval', 'auto_generate_mode']
    list_filter = ['frequency_unit', 'auto_generate_mode']
    search_fields = ['title_template']


@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'due_date', 'academic_period', 'template']
    list_filter = ['due_date', 'academic_period']
    search_fields = ['title']
    ordering = ['-due_date']


@admin.register(StudentLedgerItem)
class StudentLedgerItemAdmin(admin.ModelAdmin):
    list_display = ['student', 'charge', 'status', 'created_at']
    list_filter = ['status', 'charge', 'created_at']
    search_fields = ['student__reg_no', 'student__name', 'charge__title']
    ordering = ['student', '-charge__due_date']


class PaymentLogInline(admin.TabularInline):
    model = PaymentLog
    extra = 0
    fields = ['received', 'amount_received', 'received_at', 'received_by', 'remarks']
    readonly_fields = ['received_at']


@admin.register(Challan)
class ChallanAdmin(admin.ModelAdmin):
    list_display = ['challan_no', 'student', 'ledger_item', 'amount_total', 'status']
    list_filter = ['status', 'created_at']
    search_fields = ['challan_no', 'student__reg_no', 'student__name']
    ordering = ['-created_at']
    inlines = [PaymentLogInline]


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ['challan', 'received', 'amount_received', 'received_at', 'received_by']
    list_filter = ['received', 'received_at']
    search_fields = ['challan__challan_no', 'challan__student__reg_no']
    ordering = ['-received_at']

