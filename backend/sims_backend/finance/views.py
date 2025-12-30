from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsFinance, in_group
from sims_backend.finance.models import Challan, Charge, ChargeTemplate, PaymentLog, StudentLedgerItem
from sims_backend.finance.serializers import (
    ChallanSerializer,
    ChargeSerializer,
    ChargeTemplateSerializer,
    PaymentLogSerializer,
    StudentLedgerItemSerializer,
)
from sims_backend.finance.services import generate_challan_number, generate_ledger_items_from_charge
from sims_backend.students.models import Student


class FinancePermissionMixin:
    """Mixin to deny OFFICE_ASSISTANT access to finance module"""
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if in_group(request.user, 'OFFICE_ASSISTANT'):
            raise PermissionDenied("Office Assistant cannot access finance module")


class ChargeTemplateViewSet(FinancePermissionMixin, viewsets.ModelViewSet):
    queryset = ChargeTemplate.objects.all()
    serializer_class = ChargeTemplateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['frequency_unit', 'auto_generate_mode']
    search_fields = ['title_template']
    ordering_fields = ['title_template']
    ordering = ['title_template']

    def get_permissions(self):
        # Finance and Admin only - OFFICE_ASSISTANT denied via mixin
        return [IsAuthenticated(), IsFinance()]


class ChargeViewSet(FinancePermissionMixin, viewsets.ModelViewSet):
    queryset = Charge.objects.select_related('academic_period', 'template').all()
    serializer_class = ChargeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_period']
    search_fields = ['title']
    ordering_fields = ['due_date', 'title']
    ordering = ['-due_date']

    def get_permissions(self):
        # Finance and Admin only - OFFICE_ASSISTANT denied via mixin
        return [IsAuthenticated(), IsFinance()]

    @action(detail=True, methods=['post'], url_path='generate-ledger')
    def generate_ledger(self, request, pk=None):
        """Generate ledger items for students from this charge"""
        charge = self.get_object()
        student_ids = request.data.get('student_ids', [])

        if not student_ids:
            return Response({'error': 'student_ids required'}, status=status.HTTP_400_BAD_REQUEST)

        students = Student.objects.filter(id__in=student_ids)
        ledger_items = generate_ledger_items_from_charge(charge, list(students))

        serializer = StudentLedgerItemSerializer(ledger_items, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentLedgerItemViewSet(FinancePermissionMixin, viewsets.ReadOnlyModelViewSet):
    queryset = StudentLedgerItem.objects.select_related('student', 'charge').all()
    serializer_class = StudentLedgerItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'charge', 'status']
    search_fields = ['student__reg_no', 'student__name', 'charge__title']
    ordering_fields = ['charge__due_date']
    ordering = ['student', '-charge__due_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see their own ledger items
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            # TODO: Filter to student's own records
            pass

        return queryset


class ChallanViewSet(FinancePermissionMixin, viewsets.ModelViewSet):
    queryset = Challan.objects.select_related('student', 'ledger_item').prefetch_related('payment_logs').all()
    serializer_class = ChallanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'status']
    search_fields = ['challan_no', 'student__reg_no', 'student__name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        # OFFICE_ASSISTANT denied via mixin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsFinance()]  # Only Finance can create/edit
        # Finance and Student can view (Student only their own)
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Generate challan number
        challan_no = generate_challan_number()
        serializer.save(challan_no=challan_no)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see their own challans
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            # TODO: Filter to student's own records
            pass

        return queryset

    @action(detail=True, methods=['get', 'post'], url_path='payments')
    def payments(self, request, pk=None):
        """List or create payments for a challan"""
        challan = self.get_object()

        if request.method == 'GET':
            payments = challan.payment_logs.all()
            serializer = PaymentLogSerializer(payments, many=True)
            return Response(serializer.data)

        # POST - create payment
        if not in_group(request.user, 'FINANCE') and not (in_group(request.user, 'ADMIN') or in_group(request.user, 'COORDINATOR')):
            raise PermissionDenied("Only Finance can log payments")

        serializer = PaymentLogSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(challan=challan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentLogViewSet(FinancePermissionMixin, viewsets.ReadOnlyModelViewSet):
    queryset = PaymentLog.objects.select_related('challan', 'received_by').all()
    serializer_class = PaymentLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['challan', 'received']
    ordering_fields = ['received_at']
    ordering = ['-received_at']

    def get_permissions(self):
        # Finance and Admin only - OFFICE_ASSISTANT denied via mixin
        return [IsAuthenticated(), IsFinance()]

