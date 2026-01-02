
import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient
from rest_framework import status
from sims_backend.finance.models import StudentLedgerItem, Challan, Charge
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch, Group as AcadGroup, AcademicPeriod
from django.utils import timezone
from datetime import timedelta

@pytest.fixture
def setup_data(db):
    # Create groups
    for name in ["ADMIN", "STUDENT", "FINANCE"]:
        Group.objects.get_or_create(name=name)

    # Create academic structure
    program = Program.objects.create(name="BS CS", is_active=True)
    batch = Batch.objects.create(name="2023", program=program, start_year=2023)
    acad_group = AcadGroup.objects.create(name="A", batch=batch)

    # Create students
    user1 = User.objects.create_user(username="student1", password="password")
    user1.groups.add(Group.objects.get(name="STUDENT"))
    student1 = Student.objects.create(
        user=user1, reg_no="REG-001", name="Student One",
        program=program, batch=batch, group=acad_group
    )

    user2 = User.objects.create_user(username="student2", password="password")
    user2.groups.add(Group.objects.get(name="STUDENT"))
    student2 = Student.objects.create(
        user=user2, reg_no="REG-002", name="Student Two",
        program=program, batch=batch, group=acad_group
    )

    user_admin = User.objects.create_user(username="admin", password="password")
    user_admin.groups.add(Group.objects.get(name="ADMIN"))

    # Create finance data
    period = AcademicPeriod.objects.create(name="Fall 2023", start_date="2023-09-01", end_date="2024-01-31", period_type="YEAR")
    charge = Charge.objects.create(title="Tuition Fee", amount=50000, due_date="2023-10-01", academic_period=period)

    # Ledger Items
    # StudentLedgerItem has student and charge fields. amount and due_date are on Charge.
    ledger1 = StudentLedgerItem.objects.create(student=student1, charge=charge)
    ledger2 = StudentLedgerItem.objects.create(student=student2, charge=charge)

    # Challans
    # Challan has amount_total field.
    challan1 = Challan.objects.create(student=student1, ledger_item=ledger1, amount_total=50000, challan_no="CH-001")
    challan2 = Challan.objects.create(student=student2, ledger_item=ledger2, amount_total=50000, challan_no="CH-002")

    return {
        "user1": user1, "student1": student1,
        "user2": user2, "student2": student2,
        "user_admin": user_admin,
        "ledger1": ledger1, "ledger2": ledger2,
        "challan1": challan1, "challan2": challan2
    }

@pytest.mark.django_db
class TestStudentLedgerAccess:
    def test_student_sees_own_ledger_items(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        # Default pagination is enabled, so results are in "results"
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["id"] == setup_data["ledger1"].id
        assert results[0]["student"] == setup_data["student1"].id

    def test_student_cannot_see_others_ledger_items(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get(f"/api/finance/ledger/{setup_data['ledger2'].id}/")
        # Should return 404 because it's filtered out of queryset
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_sees_all_ledger_items(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_admin"])

        response = client.get("/api/finance/ledger/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        assert len(results) >= 2
        ids = [item["id"] for item in results]
        assert setup_data["ledger1"].id in ids
        assert setup_data["ledger2"].id in ids

@pytest.mark.django_db
class TestChallanAccess:
    def test_student_sees_own_challans(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get("/api/finance/challans/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["id"] == setup_data["challan1"].id

    def test_student_cannot_see_others_challans(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user1"])

        response = client.get(f"/api/finance/challans/{setup_data['challan2'].id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_sees_all_challans(self, setup_data):
        client = APIClient()
        client.force_authenticate(user=setup_data["user_admin"])

        response = client.get("/api/finance/challans/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        results = data.get("results", data)
        assert len(results) >= 2
        ids = [item["id"] for item in results]
        assert setup_data["challan1"].id in ids
        assert setup_data["challan2"].id in ids
