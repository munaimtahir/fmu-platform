
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from sims_backend.students.models import Student
from sims_backend.finance.models import Challan, Charge, StudentLedgerItem
from sims_backend.academics.models import Program, Batch, Group as StudentGroup

User = get_user_model()

@pytest.mark.django_db
class TestChallanAccess:
    def setup_method(self):
        self.client = APIClient()

        # Setup groups
        self.student_group, _ = Group.objects.get_or_create(name='STUDENT')
        self.admin_group, _ = Group.objects.get_or_create(name='ADMIN')
        self.finance_group, _ = Group.objects.get_or_create(name='FINANCE')

        # Setup academic structure (needed for Student)
        self.program = Program.objects.create(name='CS', description='Computer Science')
        self.batch = Batch.objects.create(name='2024', program=self.program, start_year=2024)
        self.student_group_obj = StudentGroup.objects.create(name='A', batch=self.batch)

        # Setup students
        self.student1_user = User.objects.create_user(username='student1', password='password')
        self.student1_user.groups.add(self.student_group)
        self.student1 = Student.objects.create(
            user=self.student1_user,
            reg_no='REG001',
            name='Student One',
            program=self.program,
            batch=self.batch,
            group=self.student_group_obj
        )

        self.student2_user = User.objects.create_user(username='student2', password='password')
        self.student2_user.groups.add(self.student_group)
        self.student2 = Student.objects.create(
            user=self.student2_user,
            reg_no='REG002',
            name='Student Two',
            program=self.program,
            batch=self.batch,
            group=self.student_group_obj
        )

        # Setup admin
        self.admin_user = User.objects.create_user(username='admin', password='password')
        self.admin_user.groups.add(self.admin_group)

        # Setup finance
        self.finance_user = User.objects.create_user(username='finance', password='password')
        self.finance_user.groups.add(self.finance_group)

        # Create a Charge
        self.charge = Charge.objects.create(
            title="Tuition Fee",
            amount=1000,
            due_date='2024-06-01'
        )

        # Create Ledger Items
        self.ledger1 = StudentLedgerItem.objects.create(
            student=self.student1,
            charge=self.charge,
            status='PENDING'
        )
        self.ledger2 = StudentLedgerItem.objects.create(
            student=self.student2,
            charge=self.charge,
            status='PENDING'
        )

        # Setup challans
        self.challan1 = Challan.objects.create(
            student=self.student1,
            amount_total=1000,
            status='PENDING',
            challan_no='CH001',
            ledger_item=self.ledger1
        )

        self.challan2 = Challan.objects.create(
            student=self.student2,
            amount_total=1000,
            status='PENDING',
            challan_no='CH002',
            ledger_item=self.ledger2
        )

    def test_student_can_see_own_challan(self):
        self.client.force_authenticate(user=self.student1_user)
        response = self.client.get('/api/finance/challans/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Should see challan1 only
        assert data['count'] == 1
        assert len(data['results']) == 1
        assert data['results'][0]['id'] == self.challan1.id

    def test_student_cannot_see_other_challan(self):
        self.client.force_authenticate(user=self.student1_user)
        response = self.client.get(f'/api/finance/challans/{self.challan2.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_finance_can_see_all_challans(self):
        self.client.force_authenticate(user=self.finance_user)
        response = self.client.get('/api/finance/challans/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 2

    def test_student_without_link_sees_nothing(self):
        # Create a user in student group but not linked to a student record
        unlinked_user = User.objects.create_user(username='unlinked', password='password')
        unlinked_user.groups.add(self.student_group)

        self.client.force_authenticate(user=unlinked_user)
        response = self.client.get('/api/finance/challans/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] == 0
