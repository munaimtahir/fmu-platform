"""Explicit test scaffolding for the canonical Student/Person/User relationship.

Production creation uses provision_student. Existing-user fixtures use the same
final shape so permission tests can retain their authenticated user objects.
"""

from django.contrib.auth.models import Group

from sims_backend.people.models import ContactInfo, Person
from sims_backend.students.models import Student
from sims_backend.students.onboarding import ProvisioningData, normalize_registration_number, provision_student


def make_student(
    *,
    reg_no,
    program,
    batch,
    group=None,
    user=None,
    person=None,
    name="Test Student",
    email="",
    phone="",
    date_of_birth=None,
    **fields,
):
    first, _, last = name.partition(" ")
    reg_no = normalize_registration_number(reg_no)
    role, _ = Group.objects.get_or_create(name="STUDENT")
    if user is None and person is None:
        student = provision_student(
            ProvisioningData(
                registration_number=reg_no,
                first_name=first,
                last_name=last or "Student",
                initial_password="Test-Student-9482!",
                program=program,
                batch=batch,
                group=group,
                email=email,
                mobile_number=phone,
                date_of_birth=date_of_birth,
            )
        )
    else:
        user = user or person.user
        user.username = reg_no
        user.groups.add(role)
        user.save(update_fields=["username"])
        person = person or Person.objects.create(
            user=user, first_name=first, last_name=last or "Student", date_of_birth=date_of_birth
        )
        if email:
            ContactInfo.objects.create(person=person, type="email", value=email, is_primary=True)
        if phone:
            ContactInfo.objects.create(person=person, type="phone", value=phone, is_primary=True)
        student = Student.objects.create(
            user=user, person=person, reg_no=reg_no, program=program, batch=batch, group=group
        )
    student.password_change_required = fields.pop("password_change_required", False)
    for field, value in fields.items():
        setattr(student, field, value)
    student.save()
    return student
