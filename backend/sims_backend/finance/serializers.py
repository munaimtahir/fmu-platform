from rest_framework import serializers

from sims_backend.finance.models import ChargeTemplate, Charge, StudentLedgerItem, Challan, PaymentLog


class ChargeTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeTemplate
        fields = [
            'id', 'title_template', 'default_amount', 'frequency_unit',
            'frequency_interval', 'auto_generate_mode', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ChargeSerializer(serializers.ModelSerializer):
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    template_title = serializers.CharField(source='template.title_template', read_only=True)

    class Meta:
        model = Charge
        fields = [
            'id', 'title', 'amount', 'due_date', 'academic_period', 'academic_period_name',
            'template', 'template_title', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StudentLedgerItemSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source='student.reg_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    charge_title = serializers.CharField(source='charge.title', read_only=True)
    charge_amount = serializers.DecimalField(source='charge.amount', read_only=True, max_digits=10, decimal_places=2)
    charge_due_date = serializers.DateField(source='charge.due_date', read_only=True)

    class Meta:
        model = StudentLedgerItem
        fields = [
            'id', 'student', 'student_reg_no', 'student_name', 'charge', 'charge_title',
            'charge_amount', 'charge_due_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PaymentLogSerializer(serializers.ModelSerializer):
    received_by_username = serializers.CharField(source='received_by.username', read_only=True)

    class Meta:
        model = PaymentLog
        fields = [
            'id', 'challan', 'received', 'received_at', 'amount_received',
            'received_by', 'received_by_username', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['received_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Set received_by to current user if not provided
        if 'received_by' not in validated_data:
            validated_data['received_by'] = self.context['request'].user
        return super().create(validated_data)


class ChallanSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source='student.reg_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    ledger_item_charge_title = serializers.CharField(source='ledger_item.charge.title', read_only=True)
    payment_logs = PaymentLogSerializer(many=True, read_only=True)

    class Meta:
        model = Challan
        fields = [
            'id', 'challan_no', 'student', 'student_reg_no', 'student_name',
            'ledger_item', 'ledger_item_charge_title', 'amount_total', 'status',
            'payment_logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['challan_no', 'created_at', 'updated_at']

