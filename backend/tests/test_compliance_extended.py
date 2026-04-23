import pytest
from rest_framework import status
from django.contrib.auth.models import Group, User
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementSubmission
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch, Group as AcadGroup

@pytest.fixture
def compliance_setup(db):
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")
    
    student_user = User.objects.create_user(username="stu_comp", password="pass")
    student = Student.objects.create(user=student_user, reg_no="C1", name="Stu", program=program, batch=batch, group=group)
    
    admin_user = User.objects.create_superuser(username="admin_comp", password="pass")
    
    definition = RequirementDefinition.objects.create(
        title="B-Form", 
        requirement_type="document"
    )
    
    instance = RequirementInstance.objects.create(
        student=student,
        definition=definition,
        status=RequirementInstance.STATUS_PENDING
    )
    
    return {
        "student_user": student_user,
        "student": student,
        "admin_user": admin_user,
        "definition": definition,
        "instance": instance
    }

@pytest.mark.django_db
class TestStudentCompliance:
    def test_submit_requirement_value(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        instance = compliance_setup["instance"]
        url = f"/api/compliance/my-compliance/{instance.id}/submit/"
        data = {"value": "Submitted value"}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_SUBMITTED
        assert RequirementSubmission.objects.filter(instance=instance).exists()

    def test_submit_locked_fails(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        instance = compliance_setup["instance"]
        from django.utils import timezone
        from datetime import timedelta
        # set due date to 1 hour from now (locks if < 72h)
        instance.due_at = timezone.now() + timedelta(hours=1)
        instance.save()
        
        url = f"/api/compliance/my-compliance/{instance.id}/submit/"
        response = api_client.post(url, {"value": "x"}, format="json")
        assert response.status_code == 403

@pytest.mark.django_db
class TestAdminCompliance:
    def test_verify_requirement(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        instance = compliance_setup["instance"]
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()
        
        url = f"/api/compliance/admin-compliance/{instance.id}/verify/"
        response = api_client.post(url, {"notes": "All good"}, format="json")
        
        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_VERIFIED

    def test_reject_requirement(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        instance = compliance_setup["instance"]
        url = f"/api/compliance/admin-compliance/{instance.id}/reject/"
        response = api_client.post(url, {"notes": "Incorrect"}, format="json")
        
        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_REJECTED

    def test_assign_to_student(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        new_def = RequirementDefinition.objects.create(title="New Def")
        url = "/api/compliance/admin-compliance/assign_to_student/"
        data = {
            "student_id": compliance_setup["student"].id,
            "definition_id": new_def.id
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        assert RequirementInstance.objects.filter(student=compliance_setup["student"], definition=new_def).exists()
