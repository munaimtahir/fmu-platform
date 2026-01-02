from decimal import Decimal

from django.db.models import Sum
from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.academics.models import Program
from sims_backend.common_permissions import IsFinance, in_group
from sims_backend.finance.models import (
    Adjustment,
    FeePlan,
    FeeType,
    FinancePolicy,
    LedgerEntry,
    Payment,
    Voucher,
)
from sims_backend.finance.pdf import payment_receipt_pdf, voucher_pdf
from sims_backend.finance.serializers import (
    AdjustmentApproveSerializer,
    AdjustmentSerializer,
    DefaultersReportSerializer,
    FeePlanSerializer,
    FeeTypeSerializer,
    FinancePolicySerializer,
    LedgerEntrySerializer,
    PaymentSerializer,
    PaymentVerifySerializer,
    StudentFinanceSummarySerializer,
    VoucherGenerationRequestSerializer,
    VoucherSerializer,
)
from sims_backend.finance.services import (
    approve_adjustment,
    create_voucher_from_feeplan,
    generate_voucher_number as create_voucher_number,
    defaulters,
    finance_gate_checks,
    post_payment,
    reconcile_voucher_status,
    reject_payment,
    verify_payment,
)
from sims_backend.students.models import Student


def _finance_only(user):
    return in_group(user, "FINANCE") or in_group(user, "ADMIN") or user.is_superuser


class FeeTypeViewSet(viewsets.ModelViewSet):
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    permission_classes = [IsAuthenticated, IsFinance]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["code", "name"]
    ordering = ["code"]


class FeePlanViewSet(viewsets.ModelViewSet):
    queryset = FeePlan.objects.select_related("program", "term", "fee_type").all()
    serializer_class = FeePlanSerializer
    permission_classes = [IsAuthenticated, IsFinance]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["program", "term", "fee_type", "is_active"]
    search_fields = ["program__name", "term__name", "fee_type__code"]
    ordering_fields = ["program", "term", "fee_type"]
    ordering = ["program", "term"]


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = (
        Voucher.objects.select_related("student", "term", "created_by")
        .prefetch_related("items__fee_type", "payments", "ledger_entries")
        .all()
    )
    serializer_class = VoucherSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "term", "status"]
    search_fields = ["voucher_no", "student__reg_no", "student__name"]
    ordering_fields = ["issue_date", "due_date", "total_amount"]
    ordering = ["-issue_date"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if in_group(user, "STUDENT") and not _finance_only(user):
            student = getattr(user, "student", None)
            if not student:
                return qs.none()
            qs = qs.filter(student=student)
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Skip balance calculation for list views to avoid N+1 queries
        if self.action == 'list':
            context['skip_balance'] = True
        return context

    def create(self, request, *args, **kwargs):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can create vouchers.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(voucher_no=create_voucher_number(), created_by=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can generate vouchers.")
        serializer = VoucherGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        term_id = data["term_id"]
        due_date = data["due_date"]
        fee_type_ids = data.get("fee_type_ids")
        student_ids = data.get("student_ids")
        program_id = data.get("program_id")

        students = Student.objects.all()
        if student_ids:
            students = students.filter(id__in=student_ids)
        elif program_id:
            students = students.filter(program_id=program_id)

        from sims_backend.academics.models import AcademicPeriod

        try:
            term = AcademicPeriod.objects.get(id=term_id)
        except AcademicPeriod.DoesNotExist:
            return Response({"error": {"code": "TERM_NOT_FOUND", "message": "Invalid term"}}, status=404)

        created = []
        skipped = []
        errors = []
        for student in students:
            try:
                result = create_voucher_from_feeplan(
                    student=student,
                    term=term,
                    created_by=request.user,
                    due_date=due_date,
                    selected_fee_types=fee_type_ids,
                )
                created.append(result.voucher.id)
            except Exception as exc:  # pragma: no cover - defensive path
                errors.append({"student_id": student.id, "error": str(exc)})
                skipped.append(student.id)

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "errors": errors,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        voucher = self.get_object()
        buffer = voucher_pdf(voucher)
        return FileResponse(buffer, as_attachment=True, filename=f"voucher_{voucher.voucher_no}.pdf")

    @action(detail=True, methods=["post"], url_path="reconcile")
    def reconcile(self, request, pk=None):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can reconcile vouchers.")
        voucher = self.get_object()
        reconcile_voucher_status(voucher)
        return Response(VoucherSerializer(voucher).data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("student", "term", "voucher", "received_by").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "term", "status", "method"]
    search_fields = ["receipt_no", "student__reg_no"]
    ordering_fields = ["received_at", "amount"]
    ordering = ["-received_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if in_group(user, "STUDENT") and not _finance_only(user):
            student = getattr(user, "student", None)
            if not student:
                return qs.none()
            qs = qs.filter(student=student)
        return qs

    def create(self, request, *args, **kwargs):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can log payments.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        method = serializer.validated_data["method"]
        student = serializer.validated_data["student"]
        term = serializer.validated_data["term"]
        voucher = serializer.validated_data.get("voucher")
        reference_no = serializer.validated_data.get("reference_no")
        payment = post_payment(
            student=student,
            term=term,
            amount=amount,
            method=method,
            voucher=voucher,
            received_by=request.user,
            reference_no=reference_no,
        )
        output = self.get_serializer(payment)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can verify payments.")
        payment = self.get_object()
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approve = serializer.validated_data.get("approve", True)
        if approve:
            verify_payment(payment, approved_by=request.user)
        else:
            reject_payment(payment, rejected_by=request.user, reason=serializer.validated_data.get("notes"))
        return Response(PaymentSerializer(payment).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        payment = self.get_object()
        buffer = payment_receipt_pdf(payment)
        return FileResponse(buffer, as_attachment=True, filename=f"receipt_{payment.receipt_no}.pdf")


class LedgerEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LedgerEntry.objects.select_related("student", "term", "voucher").all()
    serializer_class = LedgerEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "term", "entry_type", "reference_type"]
    search_fields = ["student__reg_no", "voucher__voucher_no", "reference_id"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if in_group(user, "STUDENT") and not _finance_only(user):
            student = getattr(user, "student", None)
            if not student:
                return qs.none()
            qs = qs.filter(student=student)
        return qs


class AdjustmentViewSet(viewsets.ModelViewSet):
    queryset = Adjustment.objects.select_related("student", "term", "requested_by", "approved_by").all()
    serializer_class = AdjustmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["student", "term", "kind", "status"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if in_group(user, "STUDENT") and not _finance_only(user):
            student = getattr(user, "student", None)
            if not student:
                return qs.none()
            qs = qs.filter(student=student)
        return qs

    def perform_create(self, serializer):
        if not _finance_only(self.request.user):
            raise PermissionDenied("Only finance/admin can request adjustments.")
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        if not _finance_only(request.user):
            raise PermissionDenied("Only finance/admin can approve adjustments.")
        adjustment = self.get_object()
        serializer = AdjustmentApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approve = serializer.validated_data.get("approve", True)
        if approve:
            approve_adjustment(adjustment, approver=request.user)
        else:
            adjustment.status = Adjustment.STATUS_REJECTED
            adjustment.approved_at = None
            adjustment.approved_by = request.user
            adjustment.save(update_fields=["status", "approved_at", "approved_by", "updated_at"])
        return Response(AdjustmentSerializer(adjustment).data)


class FinancePolicyViewSet(viewsets.ModelViewSet):
    queryset = FinancePolicy.objects.select_related("fee_type").all()
    serializer_class = FinancePolicySerializer
    permission_classes = [IsAuthenticated, IsFinance]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "fee_type"]
    search_fields = ["rule_key", "description"]
    ordering_fields = ["rule_key"]


class StudentFinanceSummaryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return Response({"error": {"code": "STUDENT_NOT_FOUND", "message": "Student not found"}}, status=404)

        user = request.user
        if in_group(user, "STUDENT") and not _finance_only(user):
            if getattr(user, "student", None) != student:
                raise PermissionDenied("You can only view your own finance summary.")

        from sims_backend.academics.models import AcademicPeriod

        term_id = request.query_params.get("term")
        term = None
        if term_id:
            try:
                term = AcademicPeriod.objects.get(pk=term_id)
            except AcademicPeriod.DoesNotExist:
                return Response({"error": {"code": "TERM_NOT_FOUND", "message": "Invalid term"}}, status=404)

        # Determine the term for finance checks
        if not term:
            # Fall back to first fee plan term if available
            if student.program and student.program.fee_plans.exists():
                first_plan = student.program.fee_plans.first()
                if first_plan:
                    term = first_plan.term

        summary = finance_gate_checks(student, term)
        voucher_statuses = {}
        if term:
            voucher_statuses = {v.voucher_no: v.status for v in student.vouchers.filter(term=term)}
        payload = {
            "student_id": student.id,
            "term_id": term.id if term else None,
            "outstanding": summary["outstanding"],
            "total_debits": summary["total_debits"],
            "total_credits": summary["total_credits"],
            "voucher_statuses": voucher_statuses,
            "gating": summary.get("gating", {}),
        }
        serializer = StudentFinanceSummarySerializer(payload)
        return Response(serializer.data)


class FinanceReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsFinance]

    @action(detail=False, methods=["post"], url_path="defaulters")
    def defaulters(self, request):
        serializer = DefaultersReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        program_id = serializer.validated_data.get("program_id")
        term_id = serializer.validated_data["term_id"]
        min_outstanding = Decimal(serializer.validated_data.get("min_outstanding") or 0)
        program = Program.objects.filter(id=program_id).first() if program_id else None

        from sims_backend.academics.models import AcademicPeriod

        try:
            term = AcademicPeriod.objects.get(id=term_id)
        except AcademicPeriod.DoesNotExist:
            return Response({"error": {"code": "TERM_NOT_FOUND", "message": "Invalid term"}}, status=404)

        rows = defaulters(program, term, min_outstanding)
        return Response({"rows": rows})

    @action(detail=False, methods=["get"], url_path="collection")
    def collection(self, request):
        qs = Payment.objects.filter(status=Payment.STATUS_VERIFIED)
        start = request.query_params.get("start")
        end = request.query_params.get("end")
        if start:
            qs = qs.filter(received_at__date__gte=start)
        if end:
            qs = qs.filter(received_at__date__lte=end)
        total = qs.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        return Response({"total_collected": total, "count": qs.count()})
