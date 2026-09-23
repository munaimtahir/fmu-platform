from datetime import date

from django.db import transaction
from rest_framework import serializers

from sims_backend.people.models import Address, ContactInfo, EmergencyContact, Person
from sims_backend.students.models import LeavePeriod, Student
from sims_backend.students.onboarding import onboarding_status


class StudentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    program_name = serializers.CharField(source="program.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)
    person_name = serializers.CharField(source="person.full_name", read_only=True)
    onboarding = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="person.first_name", read_only=True)
    middle_name = serializers.CharField(source="person.middle_name", read_only=True)
    last_name = serializers.CharField(source="person.last_name", read_only=True)
    gender = serializers.CharField(source="person.gender", read_only=True)

    def get_name(self, obj) -> str:
        return obj.display_name

    def _contact(self, obj, contact_type):
        if not obj.person_id:
            return ""
        contact = next(
            iter(
                sorted(
                    (item for item in obj.person.contact_info.all() if item.type == contact_type),
                    key=lambda item: (not item.is_primary, item.id),
                )
            ),
            None,
        )
        return contact.value if contact else ""

    def get_email(self, obj) -> str:
        return self._contact(obj, ContactInfo.TYPE_EMAIL)

    def get_phone(self, obj) -> str:
        return self._contact(obj, ContactInfo.TYPE_PHONE)

    def get_date_of_birth(self, obj) -> date | None:
        return obj.person.date_of_birth if obj.person_id else None

    def get_onboarding(self, obj) -> dict | None:
        from core.permissions import has_permission_task

        request = self.context.get("request")
        if (
            request
            and request.user.pk != obj.user_id
            and not has_permission_task(request.user, "students.onboarding.view")
        ):
            return None
        return onboarding_status(obj, include_documents=False) if obj.person_id else None

    class Meta:
        model = Student
        fields = [
            "id",
            "reg_no",
            "name",
            "first_name",
            "middle_name",
            "last_name",
            "gender",
            "person",
            "person_name",
            "user",
            "program",
            "program_name",
            "batch",
            "batch_name",
            "group",
            "group_name",
            "status",
            "enrollment_year",
            "expected_graduation_year",
            "actual_graduation_year",
            "email",
            "phone",
            "date_of_birth",
            "onboarding",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["name", "email", "phone", "date_of_birth", "onboarding", "created_at", "updated_at"]


class StudentPlacementSerializer(serializers.Serializer):
    """Serializer for updating student placement (Program/Batch/Group)"""

    # Import here to avoid circular imports at module level
    def __init__(self, *args, **kwargs):
        from sims_backend.academics.models import Batch, Group, Program

        super().__init__(*args, **kwargs)
        self.fields["program"] = serializers.PrimaryKeyRelatedField(queryset=Program.objects.all())
        self.fields["batch"] = serializers.PrimaryKeyRelatedField(queryset=Batch.objects.all())
        self.fields["group"] = serializers.PrimaryKeyRelatedField(
            queryset=Group.objects.all(), allow_null=True, required=False
        )

    def validate(self, data):
        if not data["program"].is_active or not data["batch"].is_active:
            raise serializers.ValidationError("Program and Batch must be active")
        # Ensure batch belongs to program
        if data["batch"].program != data["program"]:
            raise serializers.ValidationError("Batch must belong to the specified program")
        # Ensure group belongs to batch
        if data.get("group") and data["group"].batch != data["batch"]:
            raise serializers.ValidationError("Group must belong to the specified batch")
        return data


class OnboardingProfileUpdateSerializer(serializers.Serializer):
    def to_internal_value(self, data):
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({field: "This field cannot be changed here" for field in unknown})
        return super().to_internal_value(data)

    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=Person.GENDER_CHOICES, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    mobile_number = serializers.CharField(required=False, allow_blank=True, max_length=20)
    residential_address = serializers.DictField(required=False, child=serializers.CharField(allow_blank=True))
    emergency_contact_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    emergency_contact_phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    emergency_contact_relationship = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_residential_address(self, value):
        allowed = {"street", "city", "state", "postal_code", "country"}
        unknown = set(value) - allowed
        if unknown:
            raise serializers.ValidationError(f"Unsupported address fields: {', '.join(sorted(unknown))}")
        for key, text in value.items():
            maximum = Address._meta.get_field(key).max_length
            if len(text) > maximum:
                raise serializers.ValidationError({key: f"Must be at most {maximum} characters"})
        return value

    @transaction.atomic
    def update_student(self, student: Student) -> Student:
        person = student.person
        for field in ("date_of_birth", "gender"):
            if field in self.validated_data:
                setattr(person, field, self.validated_data[field])
        person.save()

        for api_field, contact_type in (("email", ContactInfo.TYPE_EMAIL), ("mobile_number", ContactInfo.TYPE_PHONE)):
            if api_field not in self.validated_data:
                continue
            value = self.validated_data[api_field]
            contact = person.contact_info.filter(type=contact_type, is_primary=True).first()
            if value:
                if contact:
                    contact.value = value
                    contact.save(update_fields=["value", "updated_at"])
                else:
                    ContactInfo.objects.create(person=person, type=contact_type, value=value, is_primary=True)
            elif contact:
                contact.delete()

        if "email" in self.validated_data:
            student.user.email = self.validated_data["email"]
            student.user.save(update_fields=["email"])

        if "residential_address" in self.validated_data:
            values = self.validated_data["residential_address"]
            address = person.addresses.filter(is_primary=True).first()
            defaults = {"type": Address.TYPE_PERMANENT, "country": "Pakistan", **values}
            if address:
                for field, value in values.items():
                    setattr(address, field, value)
                address.save()
            elif values.get("street") or values.get("city"):
                Address.objects.create(person=person, is_primary=True, **defaults)

        emergency_fields = {
            "emergency_contact_name": "name",
            "emergency_contact_phone": "phone",
            "emergency_contact_relationship": "relationship",
        }
        if any(field in self.validated_data for field in emergency_fields):
            emergency, _ = EmergencyContact.objects.get_or_create(person=person, defaults={"name": "", "phone": ""})
            for api_field, model_field in emergency_fields.items():
                if api_field in self.validated_data:
                    setattr(emergency, model_field, self.validated_data[api_field])
            emergency.save()
        return student


class StaffStudentProfileUpdateSerializer(OnboardingProfileUpdateSerializer):
    first_name = serializers.CharField(required=False, max_length=100)
    middle_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    last_name = serializers.CharField(required=False, max_length=100)

    @transaction.atomic
    def update_student(self, student: Student) -> Student:
        person = student.person
        for field in ("first_name", "middle_name", "last_name"):
            if field in self.validated_data:
                setattr(person, field, self.validated_data[field].strip())
        if "first_name" in self.validated_data or "last_name" in self.validated_data:
            if not person.first_name.strip() or not person.last_name.strip():
                raise serializers.ValidationError("First and last name cannot be empty")
        person.save()
        student.user.first_name = person.first_name
        student.user.last_name = person.last_name
        student.user.email = self.validated_data.get("email", student.user.email)
        student.user.save(update_fields=["first_name", "last_name", "email"])
        return super().update_student(student)


class StudentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Student.STATUS_CHOICES)


class LeavePeriodSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.display_name", read_only=True)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = LeavePeriod
        fields = [
            "id",
            "student",
            "student_reg_no",
            "student_name",
            "type",
            "start_date",
            "end_date",
            "reason",
            "status",
            "approved_by",
            "approved_by_username",
            "counts_toward_graduation",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "counts_toward_graduation", "approved_by"]
