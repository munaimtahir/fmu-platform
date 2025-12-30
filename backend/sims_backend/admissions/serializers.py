import re
from rest_framework import serializers

from .models import Student, StudentApplication


class StudentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    program_full_name = serializers.CharField(source="program.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "reg_no",
            "name",
            "program",
            "program_name",
            "program_full_name",
            "batch_year",
            "current_year",
            "status",
            "status_display",
            "email",
            "phone",
            "date_of_birth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_reg_no(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Registration number is required.")
        return value


class StudentApplicationSerializer(serializers.ModelSerializer):
    """Serializer for student applications submitted through public form"""

    program_name = serializers.CharField(source="program.name", read_only=True, allow_null=True)
    program_full_name = serializers.CharField(source="program.get_full_name", read_only=True, allow_null=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentApplication
        fields = [
            "id",
            # Personal Information
            "first_name",
            "last_name",
            "full_name",
            "father_name",
            "gender",
            "date_of_birth",
            "cnic",
            "email",
            "phone",
            # Address
            "address",
            "address_city",
            "address_district",
            "address_state",
            "address_country",
            # Mailing Address
            "mailing_address_same",
            "mailing_address",
            "mailing_city",
            "mailing_district",
            "mailing_state",
            "mailing_country",
            # Guardian Information
            "guardian_name",
            "guardian_relation",
            "guardian_phone",
            "guardian_email",
            "guardian_mailing_address",
            # Admission/Merit Details
            "mdcat_roll_number",
            "merit_number",
            "merit_percentage",
            # Qualifications
            "hssc_year",
            "hssc_board",
            "hssc_marks",
            "hssc_percentage",
            "ssc_year",
            "ssc_board",
            "ssc_marks",
            "ssc_percentage",
            # Academic Information
            "program",
            "program_name",
            "program_full_name",
            "batch_year",
            "previous_qualification",
            "previous_institution",
            # Application Status
            "status",
            "status_display",
            "notes",
            # Documents
            "documents",
            "father_id_card",
            "guardian_id_card",
            "domicile",
            "ssc_certificate",
            "hssc_certificate",
            "mdcat_result",
            # Admin tracking
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip() or obj.reviewed_by.username
        return None


class StudentApplicationPublicSerializer(serializers.ModelSerializer):
    """Public serializer for submitting student applications (no admin fields)"""

    class Meta:
        model = StudentApplication
        fields = [
            # Personal Information
            "first_name",
            "last_name",
            "father_name",
            "gender",
            "date_of_birth",
            "cnic",
            "email",
            "phone",
            # Address
            "address_city",
            "address_district",
            "address_state",
            "address_country",
            # Mailing Address
            "mailing_address_same",
            "mailing_address",
            "mailing_city",
            "mailing_district",
            "mailing_state",
            "mailing_country",
            # Guardian Information
            "guardian_name",
            "guardian_relation",
            "guardian_phone",
            "guardian_email",
            "guardian_mailing_address",
            # Admission/Merit Details
            "mdcat_roll_number",
            "merit_number",
            "merit_percentage",
            # Qualifications
            "hssc_year",
            "hssc_board",
            "hssc_marks",
            "hssc_percentage",
            "ssc_year",
            "ssc_board",
            "ssc_marks",
            "ssc_percentage",
            # Academic Information
            "program",
            "batch_year",
            # Documents
            "father_id_card",
            "guardian_id_card",
            "domicile",
            "ssc_certificate",
            "hssc_certificate",
            "mdcat_result",
            # Legacy fields (optional)
            "full_name",
            "address",
            "previous_qualification",
            "previous_institution",
            "documents",
        ]

    def validate_cnic(self, value):
        """Validate CNIC format: 12345-123456-1"""
        if not value:
            return value
        
        # Remove any spaces
        value = value.strip().replace(' ', '')
        
        # Validate format: 12345-123456-1 (5 digits, 7 digits, 1 digit)
        pattern = r'^\d{5}-\d{7}-\d{1}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "CNIC must be in format 12345-123456-1"
            )
        return value

    def validate_merit_percentage(self, value):
        """Validate merit percentage has up to 4 decimal places"""
        if value is None:
            return value
        
        # Check decimal places
        decimal_str = str(value)
        if '.' in decimal_str:
            decimal_places = len(decimal_str.split('.')[1])
            if decimal_places > 4:
                raise serializers.ValidationError(
                    "Merit percentage can have up to 4 decimal places"
                )
        
        if value < 0.0000 or value > 100.0000:
            raise serializers.ValidationError(
                "Merit percentage must be between 0.0000 and 100.0000"
            )
        return value

    def validate_guardian_id_card(self, value):
        """Guardian ID card is required if guardian is not father"""
        # This validation will be done in validate() method since we need guardian_relation
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Validate guardian ID card requirement
        guardian_relation = data.get('guardian_relation')
        guardian_id_card = data.get('guardian_id_card')
        
        if guardian_relation and guardian_relation != 'FATHER':
            if not guardian_id_card:
                raise serializers.ValidationError({
                    'guardian_id_card': 'Guardian ID card is required when guardian is not father'
                })
        
        # Validate mailing address
        mailing_address_same = data.get('mailing_address_same', True)
        if mailing_address_same:
            # Copy address fields to mailing address
            data['mailing_city'] = data.get('address_city', '')
            data['mailing_district'] = data.get('address_district', '')
            data['mailing_state'] = data.get('address_state', '')
            data['mailing_country'] = data.get('address_country', '')
            data['mailing_address'] = ''
        
        # Auto-generate full_name from first_name and last_name if not provided
        if not data.get('full_name'):
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            if first_name and last_name:
                data['full_name'] = f"{first_name} {last_name}".strip()
        
        return data

    def validate_batch_year(self, value):
        """Validate that batch year is reasonable"""
        from datetime import date
        current_year = date.today().year
        if value < current_year or value > current_year + 10:
            raise serializers.ValidationError(
                f"Batch year must be between {current_year} and {current_year + 10}"
            )
        return value
