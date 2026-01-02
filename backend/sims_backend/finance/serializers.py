from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

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
from sims_backend.finance.services import (
    compute_student_balance,
    reconcile_voucher_status,
)


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = ["id", "code", "name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class FeePlanSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    fee_type_code = serializers.CharField(source="fee_type.code", read_only=True)

    class Meta:
        model = FeePlan
        fields = [
            "id",
            "program",
            "program_name",
            "term",
            "term_name",
            "fee_type",
            "fee_type_code",
            "amount",
            "is_mandatory",
            "frequency",
            "effective_from",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        # prevent duplicate active plan for same combination
        program = attrs.get("program") or getattr(self.instance, "program", None)
        term = attrs.get("term") or getattr(self.instance, "term", None)
        fee_type = attrs.get("fee_type") or getattr(self.instance, "fee_type", None)
        is_active = attrs.get("is_active", getattr(self.instance, "is_active", True))
        if program and term and fee_type and is_active:
            qs = FeePlan.objects.filter(program=program, term=term, fee_type=fee_type, is_active=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"non_field_errors": ["Active fee plan already exists for this program/term/fee type."]}
                )
        return attrs


class VoucherItemSerializer(serializers.ModelSerializer):
    fee_type_code = serializers.CharField(source="fee_type.code", read_only=True)

    class Meta:
        model = VoucherItem
        fields = ["id", "fee_type", "fee_type_code", "description", "amount", "metadata"]


class VoucherSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    items = VoucherItemSerializer(many=True)
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            "id",
            "voucher_no",
            "student",
            "student_reg_no",
            "student_name",
            "term",
            "term_name",
            "status",
            "issue_date",
            "due_date",
            "total_amount",
            "notes",
            "items",
            "balance",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["voucher_no", "status", "created_at", "updated_at"]

    def get_balance(self, obj: Voucher) -> dict:
        return compute_student_balance(obj.student, term=obj.term, voucher=obj)

    def validate(self, attrs):
        items = self.initial_data.get("items", [])
        if not items:
            raise serializers.ValidationError({"items": ["At least one voucher item is required."]})
        total = Decimal("0.00")
        for item in items:
            try:
                total += Decimal(str(item.get("amount", "0")))
            except Exception:
                raise serializers.ValidationError({"items": ["Invalid amount on line items."]})
        total_amount = attrs.get("total_amount", total)
        if total != Decimal(str(total_amount)):
            raise serializers.ValidationError(
                {"total_amount": ["Total must equal the sum of voucher item amounts."]}
            )
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        with transaction.atomic():
            voucher = Voucher.objects.create(**validated_data)
            VoucherItem.objects.bulk_create(
                [
                    VoucherItem(
                        voucher=voucher,
                        fee_type=item["fee_type"],
                        description=item.get("description", ""),
                        amount=item["amount"],
                        metadata=item.get("metadata"),
                    )
                    for item in items_data
                ]
            )
            LedgerEntry.objects.create(
                student=voucher.student,
                term=voucher.term,
                entry_type=LedgerEntry.ENTRY_DEBIT,
                amount=voucher.total_amount,
                reference_type=LedgerEntry.REF_VOUCHER,
                reference_id=str(voucher.id),
                description=f"Voucher {voucher.voucher_no}",
                voucher=voucher,
                created_by=self.context.get("request").user if self.context.get("request") else None,
            )
            reconcile_voucher_status(voucher)
        return voucher

    def update(self, instance, validated_data):
        raise serializers.ValidationError({"error": "Voucher updates are not supported. Create a new one instead."})


class PaymentSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "receipt_no",
            "student",
            "student_reg_no",
            "student_name",
            "term",
            "term_name",
            "voucher",
            "amount",
            "method",
            "reference_no",
            "received_by",
            "received_at",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["receipt_no", "received_at", "status", "created_at", "updated_at"]

    def create(self, validated_data):
        if "received_by" not in validated_data:
            validated_data["received_by"] = self.context["request"].user
        return super().create(validated_data)


class PaymentVerifySerializer(serializers.Serializer):
    approve = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class LedgerEntrySerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)

    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "student",
            "student_reg_no",
            "student_name",
            "term",
            "term_name",
            "entry_type",
            "amount",
            "currency",
            "reference_type",
            "reference_id",
            "description",
            "voucher",
            "created_by",
            "created_at",
            "voided_at",
            "void_reason",
        ]
        read_only_fields = ["created_at", "voided_at", "void_reason"]


class AdjustmentSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)

    class Meta:
        model = Adjustment
        fields = [
            "id",
            "student",
            "student_reg_no",
            "student_name",
            "term",
            "term_name",
            "kind",
            "amount",
            "reason",
            "requested_by",
            "approved_by",
            "approved_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["approved_at", "status", "created_at", "updated_at"]

    def create(self, validated_data):
        if "requested_by" not in validated_data:
            validated_data["requested_by"] = self.context["request"].user
        return super().create(validated_data)


class AdjustmentApproveSerializer(serializers.Serializer):
    approve = serializers.BooleanField(default=True)
    reason = serializers.CharField(required=False, allow_blank=True)


class FinancePolicySerializer(serializers.ModelSerializer):
    fee_type_code = serializers.CharField(source="fee_type.code", read_only=True)

    class Meta:
        model = FinancePolicy
        fields = [
            "id",
            "rule_key",
            "description",
            "threshold_amount",
            "fee_type",
            "fee_type_code",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StudentFinanceSummarySerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    term_id = serializers.IntegerField(allow_null=True)
    outstanding = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_debits = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_credits = serializers.DecimalField(max_digits=12, decimal_places=2)
    voucher_statuses = serializers.DictField(child=serializers.CharField())
    gating = serializers.DictField()


class VoucherGenerationRequestSerializer(serializers.Serializer):
    program_id = serializers.IntegerField(required=False)
    term_id = serializers.IntegerField()
    student_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    due_date = serializers.DateField()
    fee_type_ids = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)


class DefaultersReportSerializer(serializers.Serializer):
    program_id = serializers.IntegerField(required=False)
    term_id = serializers.IntegerField(required=True)
    min_outstanding = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
