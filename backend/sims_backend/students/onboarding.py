from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import CharField, Exists, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce, Trim

from sims_backend.audit.models import AuditLog
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementScope
from sims_backend.people.models import Address, ContactInfo, Person
from sims_backend.students.models import Student

User = get_user_model()
REGISTRATION_NUMBER_RE = re.compile(r"^[A-Z0-9][A-Z0-9._/-]{0,31}$")


def normalize_registration_number(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value or "").strip().upper()
    if not REGISTRATION_NUMBER_RE.fullmatch(normalized):
        raise ValidationError("Use 1-32 letters, numbers, dots, underscores, slashes, or hyphens")
    return normalized


def applicable_requirement_definitions(student: Student):
    scopes = RequirementScope.objects.filter(is_active=True).filter(
        Q(scope_type=RequirementScope.SCOPE_GLOBAL)
        | Q(scope_type=RequirementScope.SCOPE_PROGRAM, program=student.program)
        | Q(scope_type=RequirementScope.SCOPE_BATCH, batch=student.batch)
    )
    return RequirementDefinition.objects.filter(
        is_active=True,
        is_onboarding_required=True,
        requirement_type=RequirementDefinition.TYPE_DOCUMENT,
        scopes__in=scopes,
    ).distinct()


@transaction.atomic
def synchronize_requirements(student: Student) -> None:
    definitions = list(applicable_requirement_definitions(student))
    applicable_ids = {definition.id for definition in definitions}
    for definition in definitions:
        instance, _ = RequirementInstance.objects.get_or_create(
            student=student,
            definition=definition,
            defaults={"assignment_source": RequirementInstance.SOURCE_ONBOARDING},
        )
        if instance.assignment_source != RequirementInstance.SOURCE_ONBOARDING:
            # A manual assignment remains manual and is never retired by scope changes.
            continue
        if not instance.is_active:
            instance.is_active = True
            instance.save(update_fields=["is_active", "updated_at"])

    obsolete = student.compliance_requirements.filter(
        is_active=True,
        assignment_source=RequirementInstance.SOURCE_ONBOARDING,
    ).exclude(definition_id__in=applicable_ids)
    # Applicability is separate from history: keep every submission, but obsolete
    # requirements must not become onboarding blockers after a later rejection.
    obsolete.update(is_active=False)


@dataclass(frozen=True)
class ProvisioningData:
    registration_number: str
    first_name: str
    last_name: str
    initial_password: str
    program: object
    batch: object
    middle_name: str = ""
    group: object | None = None
    email: str = ""
    mobile_number: str = ""
    date_of_birth: object | None = None
    gender: str = ""


@transaction.atomic
def provision_student(data: ProvisioningData, *, actor=None, import_job_id: str = "") -> Student:
    reg_no = normalize_registration_number(data.registration_number)
    if data.batch.program_id != data.program.id:
        raise ValidationError("Batch does not belong to Program")
    if not data.program.is_active or not data.batch.is_active:
        raise ValidationError("Program and Batch must be active")
    if data.group is not None and data.group.batch_id != data.batch.id:
        raise ValidationError("Group does not belong to Batch")
    if User.objects.filter(username__iexact=reg_no).exists() or Student.objects.filter(reg_no__iexact=reg_no).exists():
        raise ValidationError("Registration number already exists")

    user = User(
        username=reg_no, first_name=data.first_name.strip(), last_name=data.last_name.strip(), email=data.email.strip()
    )
    if (
        not user.first_name
        or not user.last_name
        or any(len(value) > 100 for value in (user.first_name, data.middle_name.strip(), user.last_name))
    ):
        raise ValidationError("First and last name are required; each name must be at most 100 characters")
    validate_password(data.initial_password, user=user)
    user.set_password(data.initial_password)
    user.save()
    student_group = AuthGroup.objects.get(name="STUDENT")
    user.groups.add(student_group)

    person = Person.objects.create(
        user=user,
        first_name=data.first_name.strip(),
        middle_name=data.middle_name.strip(),
        last_name=data.last_name.strip(),
        date_of_birth=data.date_of_birth,
        gender=data.gender,
    )
    if data.email:
        ContactInfo.objects.create(
            person=person, type=ContactInfo.TYPE_EMAIL, value=data.email.strip(), is_primary=True
        )
    if data.mobile_number:
        ContactInfo.objects.create(
            person=person, type=ContactInfo.TYPE_PHONE, value=data.mobile_number.strip(), is_primary=True
        )

    student = Student.objects.create(
        user=user,
        person=person,
        reg_no=reg_no,
        program=data.program,
        batch=data.batch,
        group=data.group,
        status=Student.STATUS_ACTIVE,
        password_change_required=True,
        credential_version=1,
    )
    synchronize_requirements(student)
    AuditLog.objects.create(
        actor=actor,
        method="POST",
        path="/api/admin/students/import/commit/",
        status_code=201,
        entity="Student",
        entity_id=str(student.id),
        action=AuditLog.ACTION_CREATE,
        summary=f"Provisioned student {reg_no}",
        metadata={
            "registration_number": reg_no,
            "user_id": user.id,
            "person_id": person.id,
            "program_id": data.program.id,
            "batch_id": data.batch.id,
            "group_id": data.group.id if data.group else None,
            "import_job_id": import_job_id,
        },
    )
    return student


def _primary_contact(person: Person, contact_type: str) -> str:
    contact = next(
        iter(
            sorted(
                (item for item in person.contact_info.all() if item.type == contact_type),
                key=lambda item: (not item.is_primary, item.id),
            )
        ),
        None,
    )
    return contact.value.strip() if contact and contact.value else ""


def onboarding_status(student: Student, *, include_documents=True) -> dict:
    person = student.person
    emergency = getattr(person, "emergency_contact", None)
    address = next(iter(sorted(person.addresses.all(), key=lambda item: (not item.is_primary, item.id))), None)

    values = {
        "first_name": person.first_name.strip() if person else "",
        "last_name": person.last_name.strip() if person else "",
        "date_of_birth": person.date_of_birth if person else None,
        "gender": person.gender if person else "",
        "mobile_number": _primary_contact(person, ContactInfo.TYPE_PHONE) if person else "",
        "email": _primary_contact(person, ContactInfo.TYPE_EMAIL) if person else "",
        "residential_address": bool(
            address and address.street.strip() and address.city.strip() and address.country.strip()
        ),
        "emergency_contact_name": emergency.name.strip() if emergency else "",
        "emergency_contact_phone": emergency.phone.strip() if emergency else "",
    }
    missing_fields = [key for key, value in values.items() if not value]
    sections = {
        "personal_identity": {"first_name", "last_name", "date_of_birth", "gender"},
        "contact_information": {"mobile_number", "email"},
        "address": {"residential_address"},
        "emergency_contact": {"emergency_contact_name", "emergency_contact_phone"},
    }
    missing_sections = [name for name, fields in sections.items() if fields.intersection(missing_fields)]
    percentage = round(((len(values) - len(missing_fields)) / len(values)) * 100)

    def is_scoped(instance):
        return instance.assignment_source == RequirementInstance.SOURCE_ONBOARDING or any(
            scope.is_active
            and (
                scope.scope_type == RequirementScope.SCOPE_GLOBAL
                or scope.scope_type == RequirementScope.SCOPE_PROGRAM
                and scope.program_id == student.program_id
                or scope.scope_type == RequirementScope.SCOPE_BATCH
                and scope.batch_id == student.batch_id
            )
            for scope in instance.definition.scopes.all()
        )

    required_instances = [
        instance
        for instance in student.compliance_requirements.all()
        if instance.is_active
        and is_scoped(instance)
        and instance.definition.is_active
        and instance.definition.is_onboarding_required
        and instance.definition.requirement_type == RequirementDefinition.TYPE_DOCUMENT
    ]
    satisfied = {RequirementInstance.STATUS_SUBMITTED, RequirementInstance.STATUS_VERIFIED}
    documents = (
        [
            {
                "requirement_id": instance.id,
                "title": instance.definition.title,
                "description": instance.definition.description,
                "status": instance.status,
                "notes": instance.notes,
                "is_active": instance.is_active,
                "submissions": [
                    {
                        "id": submission.id,
                        "has_file": bool(submission.file),
                        "file_name": submission.original_filename
                        or (submission.file.name.rsplit("/", 1)[-1] if submission.file else ""),
                        "created_at": submission.created_at,
                    }
                    for submission in sorted(instance.submissions.all(), key=lambda item: item.created_at, reverse=True)
                ],
            }
            for instance in required_instances
        ]
        if include_documents
        else []
    )
    missing_documents = [
        {"requirement_id": instance.id, "title": instance.definition.title}
        for instance in required_instances
        if instance.status not in satisfied
    ]
    profile_status = "complete" if not missing_fields else "incomplete"
    documents_status = "complete" if not missing_documents else "pending"
    if student.password_change_required:
        primary_state = "password_change_required"
    elif profile_status == "incomplete":
        primary_state = "profile_incomplete"
    elif documents_status == "pending":
        primary_state = "documents_pending"
    else:
        primary_state = "complete"

    return {
        "password_change_required": student.password_change_required,
        "profile_status": profile_status,
        "documents_status": documents_status,
        "primary_state": primary_state,
        "profile_completion_percentage": percentage,
        "missing_fields": missing_fields,
        "missing_sections": missing_sections,
        "missing_documents": missing_documents,
        "documents": documents,
    }


def filter_onboarding_state(queryset, state):
    """Filter before pagination, using the same primary-contact/address selection as status."""
    from rest_framework.exceptions import ValidationError

    if state == "password_change_required":
        return queryset.filter(password_change_required=True)
    if state not in {"profile_incomplete", "profile_complete", "documents_pending", "complete"}:
        raise ValidationError({"onboarding_state": "Unknown onboarding state"})
    contacts = ContactInfo.objects.filter(person_id=OuterRef("person_id")).order_by("-is_primary", "id")
    addresses = Address.objects.filter(person_id=OuterRef("person_id")).order_by("-is_primary", "id")
    pending = (
        RequirementInstance.objects.filter(
            student_id=OuterRef("pk"),
            is_active=True,
            definition__is_active=True,
            definition__is_onboarding_required=True,
            definition__requirement_type="document",
        )
        .filter(
            Q(assignment_source=RequirementInstance.SOURCE_ONBOARDING)
            | Q(definition__scopes__is_active=True)
            & (
                Q(definition__scopes__scope_type="global")
                | Q(definition__scopes__scope_type="program", definition__scopes__program_id=OuterRef("program_id"))
                | Q(definition__scopes__scope_type="batch", definition__scopes__batch_id=OuterRef("batch_id"))
            )
        )
        .exclude(status__in=["submitted", "verified"])
    )
    values = {
        "first": "person__first_name",
        "last": "person__last_name",
        "gender": "person__gender",
        "emergency_name": "person__emergency_contact__name",
        "emergency_phone": "person__emergency_contact__phone",
    }
    annotations = {f"onb_{key}": Trim(Coalesce(field, Value(""))) for key, field in values.items()}
    for key, kind in (("email", "email"), ("phone", "phone")):
        annotations[f"onb_{key}"] = Trim(
            Coalesce(Subquery(contacts.filter(type=kind).values("value")[:1]), Value(""), output_field=CharField())
        )
    for key in ("street", "city", "country"):
        annotations[f"onb_{key}"] = Trim(
            Coalesce(Subquery(addresses.values(key)[:1]), Value(""), output_field=CharField())
        )
    queryset = queryset.annotate(**annotations, onb_documents_pending=Exists(pending))
    complete = Q(person__date_of_birth__isnull=False)
    for key in annotations:
        complete &= ~Q(**{key: ""})
    if state == "profile_complete":
        return queryset.filter(complete)
    if state == "profile_incomplete":
        return queryset.exclude(complete)
    if state == "documents_pending":
        return queryset.filter(onb_documents_pending=True)
    return queryset.filter(complete, password_change_required=False, onb_documents_pending=False)
