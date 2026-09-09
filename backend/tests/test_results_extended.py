from unittest.mock import patch

import pytest
from django.contrib.auth.models import Group, User
from rest_framework import status

from core.models import PermissionTask, Role, RoleTaskAssignment
from sims_backend.academics.models import AcademicPeriod, Batch, Program
from sims_backend.academics.models import Group as AcadGroup
from sims_backend.audit.models import AuditLog
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.results.models import ResultComponentEntry, ResultCorrectionRequest, ResultHeader
from sims_backend.students.models import Student


@pytest.fixture
def student_profile(db, student_user):
    program = Program.objects.create(name="MBBS", is_active=True)
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")
    return Student.objects.create(
        user=student_user, reg_no="REG001", name="Test Student", program=program, batch=batch, group=group
    )


@pytest.mark.django_db
class TestResultsExtended:
    @patch("sims_backend.results.views.finance_gate_checks")
    def test_finance_gate_blocks_results(self, mock_gate, api_client, student_user, student_profile):
        """Test that finance gate can block results for students."""
        mock_gate.return_value = {
            "gating": {"can_view_results": False, "reasons": ["Outstanding dues"]},
            "outstanding": 5000.0,
        }

        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )

        api_client.force_authenticate(user=student_user)
        response = api_client.get("/api/results/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "FINANCE_BLOCKED"

    def test_verify_result_action(self, api_client, admin_user, student_profile):
        """Test VERIFY action (DRAFT -> VERIFIED)."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_DRAFT, total_obtained=80, total_max=100
        )

        task, _ = PermissionTask.objects.get_or_create(code="results.result_headers.verify", name="Verify")
        admin_role, _ = Role.objects.get_or_create(name="ADMIN", is_system_role=True)
        RoleTaskAssignment.objects.get_or_create(role=admin_role, task=task)
        admin_user.groups.add(Group.objects.get(name="ADMIN"))

        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f"/api/results/{result.id}/verify/")

        assert response.status_code == status.HTTP_200_OK
        result.refresh_from_db()
        assert result.status == ResultHeader.STATUS_VERIFIED

    def test_publish_result_action(self, api_client, admin_user, student_profile):
        """Test PUBLISH action."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_VERIFIED, total_obtained=80, total_max=100
        )

        task, _ = PermissionTask.objects.get_or_create(code="results.result_headers.publish", name="Publish")
        admin_role, _ = Role.objects.get_or_create(name="ADMIN", is_system_role=True)
        RoleTaskAssignment.objects.get_or_create(role=admin_role, task=task)
        admin_user.groups.add(Group.objects.get(name="ADMIN"))

        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f"/api/results/{result.id}/publish/")

        assert response.status_code == status.HTTP_200_OK
        result.refresh_from_db()
        assert result.status == ResultHeader.STATUS_PUBLISHED

    def test_publish_already_published_fails(self, api_client, admin_user, student_profile):
        """Test that publishing an already published result fails gracefully."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )

        task, _ = PermissionTask.objects.get_or_create(code="results.result_headers.publish", name="Publish")
        admin_role, _ = Role.objects.get_or_create(name="ADMIN", is_system_role=True)
        RoleTaskAssignment.objects.get_or_create(role=admin_role, task=task)
        admin_user.groups.add(Group.objects.get(name="ADMIN"))

        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f"/api/results/{result.id}/publish/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"]["code"] == "NOT_PUBLISHABLE"

    def test_freeze_result_action(self, api_client, admin_user, student_profile):
        """Test FREEZE action."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )

        task, _ = PermissionTask.objects.get_or_create(code="results.result_headers.freeze", name="Freeze")
        admin_role, _ = Role.objects.get_or_create(name="ADMIN", is_system_role=True)
        RoleTaskAssignment.objects.get_or_create(role=admin_role, task=task)
        admin_user.groups.add(Group.objects.get(name="ADMIN"))

        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f"/api/results/{result.id}/freeze/")

        assert response.status_code == status.HTTP_200_OK
        result.refresh_from_db()
        assert result.status == ResultHeader.STATUS_FROZEN

    def test_cannot_edit_frozen_result_component(self, api_client, admin_user, student_profile):
        """Test immutability of components in frozen results."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        comp = ExamComponent.objects.create(exam=exam, name="Theory", max_marks=100)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_FROZEN, total_obtained=80, total_max=100
        )
        entry = ResultComponentEntry.objects.create(result_header=result, exam_component=comp, marks_obtained=80)

        # Grant update task
        task, _ = PermissionTask.objects.get_or_create(code="results.result_components.update", name="Update Comp")
        admin_role, _ = Role.objects.get_or_create(name="ADMIN", is_system_role=True)
        RoleTaskAssignment.objects.get_or_create(role=admin_role, task=task)
        admin_user.groups.add(Group.objects.get(name="ADMIN"))

        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(f"/api/result-components/{entry.id}/", {"marks_obtained": 90})

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "IMMUTABLE_RESULT"

    def test_published_result_cannot_be_deleted_or_have_components_added(self, api_client, admin_user, student_profile):
        """All direct mutation paths honour result immutability, not just PATCH."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        component = ExamComponent.objects.create(exam=exam, name="Theory", max_marks=100)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )
        admin_user.groups.add(Group.objects.get(name="ADMIN"))
        api_client.force_authenticate(user=admin_user)

        create_component = api_client.post(
            "/api/result-components/", {"result_header": result.id, "exam_component": component.id, "marks_obtained": 80}
        )
        delete_result = api_client.delete(f"/api/results/{result.id}/")

        assert create_component.status_code == status.HTTP_403_FORBIDDEN
        assert create_component.data["code"] == "IMMUTABLE_RESULT"
        assert delete_result.status_code == status.HTTP_403_FORBIDDEN
        assert delete_result.data["code"] == "IMMUTABLE_RESULT"
        assert ResultHeader.objects.filter(pk=result.id).exists()

    def test_correction_request_is_scoped_reviewed_and_auditable(self, api_client, student_user, student_profile):
        """A frozen/published correction requires student scope then an ExamCell review and apply."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        component = ExamComponent.objects.create(exam=exam, name="Theory", max_marks=100)
        result = ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_FROZEN, total_obtained=80, total_max=100
        )
        entry = ResultComponentEntry.objects.create(result_header=result, exam_component=component, marks_obtained=80)

        api_client.force_authenticate(user=student_user)
        create = api_client.post(
            "/api/result-corrections/",
            {
                "result_header": result.id,
                "reason": "A verified transcription correction is required.",
                "proposed_changes": {"total_obtained": "82", "component_marks": {str(entry.id): "82"}},
            },
            format="json",
        )
        assert create.status_code == status.HTTP_201_CREATED
        correction = ResultCorrectionRequest.objects.get(pk=create.data["id"])
        assert correction.original_values["status"] == ResultHeader.STATUS_FROZEN

        exam_cell = User.objects.create_user(username="examcell", password="password")
        exam_cell_group, _ = Group.objects.get_or_create(name="EXAMCELL")
        exam_cell.groups.add(exam_cell_group)
        review_task, _ = PermissionTask.objects.get_or_create(code="results.result_corrections.review", defaults={"name": "Review correction", "module": "results"})
        exam_cell_role, _ = Role.objects.get_or_create(name="EXAMCELL", defaults={"is_system_role": True})
        RoleTaskAssignment.objects.get_or_create(role=exam_cell_role, task=review_task)
        api_client.force_authenticate(user=exam_cell)

        review = api_client.post(f"/api/result-corrections/{correction.id}/review/", {"decision": "APPROVED", "review_note": "Evidence checked."}, format="json")
        assert review.status_code == status.HTTP_200_OK
        apply = api_client.post(f"/api/result-corrections/{correction.id}/apply/", format="json")
        assert apply.status_code == status.HTTP_200_OK

        result.refresh_from_db()
        entry.refresh_from_db()
        correction.refresh_from_db()
        assert result.status == ResultHeader.STATUS_FROZEN
        assert str(result.total_obtained) == "82.00"
        assert str(entry.marks_obtained) == "82.00"
        assert correction.status == ResultCorrectionRequest.STATUS_APPLIED
        assert AuditLog.objects.filter(path=f"/api/result-corrections/{correction.id}/apply/", actor=exam_cell).exists()

    def test_student_cannot_request_correction_for_another_student(self, api_client, student_user, student_profile):
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        other_user = User.objects.create_user(username="other", password="password")
        other_user.groups.add(Group.objects.get(name="STUDENT"))
        other_student = Student.objects.create(user=other_user, reg_no="OTHER001", name="Other", program=student_profile.program, batch=student_profile.batch, group=student_profile.group)
        other_result = ResultHeader.objects.create(exam=exam, student=other_student, status=ResultHeader.STATUS_PUBLISHED, total_obtained=50, total_max=100)

        api_client.force_authenticate(user=student_user)
        response = api_client.post(
            "/api/result-corrections/",
            {"result_header": other_result.id, "reason": "Not mine", "proposed_changes": {"total_obtained": "51"}},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "RESULT_SCOPE_DENIED"

    def test_list_by_exam(self, api_client, admin_user, student_profile):
        """Test list_by_exam action."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_DRAFT, total_obtained=80, total_max=100
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f"/api/results/exams/{exam.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["exam"] == exam.id

    def test_student_me_results(self, api_client, student_user, student_profile):
        """Test /api/results/me/ endpoint."""
        period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
        exam = Exam.objects.create(title="Test Exam", academic_period=period)
        ResultHeader.objects.create(
            exam=exam, student=student_profile, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )

        api_client.force_authenticate(user=student_user)
        response = api_client.get("/api/results/me/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
