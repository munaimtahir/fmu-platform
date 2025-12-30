"""
Unit tests for workflow state transitions.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.exceptions import PermissionDenied

from sims_backend.common.workflow import validate_workflow_transition

User = get_user_model()


class WorkflowTransitionTest(TestCase):
    """Test workflow state transition validation."""

    def setUp(self):
        """Set up test users."""
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="testpass"
        )
        self.admin_user.groups.create(name="ADMIN")

        self.office_assistant = User.objects.create_user(
            username="office", email="office@test.com", password="testpass"
        )
        self.office_assistant.groups.create(name="OFFICE_ASSISTANT")

    def test_same_state_transition(self):
        """Test that transitioning to the same state is allowed."""
        # Should not raise for same state
        validate_workflow_transition(
            self.admin_user, None, "DRAFT", "DRAFT"
        )

    def test_admin_can_transition_forward(self):
        """Test that admin can transition forward through states."""
        # DRAFT -> VERIFIED
        validate_workflow_transition(
            self.admin_user, None, "DRAFT", "VERIFIED"
        )

        # VERIFIED -> PUBLISHED
        validate_workflow_transition(
            self.admin_user, None, "VERIFIED", "PUBLISHED"
        )

    def test_office_assistant_cannot_transition(self):
        """Test that office assistant cannot transition states."""
        # Should raise PermissionDenied for any transition
        with self.assertRaises(PermissionDenied):
            validate_workflow_transition(
                self.office_assistant, None, "DRAFT", "VERIFIED"
            )

        with self.assertRaises(PermissionDenied):
            validate_workflow_transition(
                self.office_assistant, None, "DRAFT", "PUBLISHED"
            )

