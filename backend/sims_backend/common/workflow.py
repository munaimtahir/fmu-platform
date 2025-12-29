"""Workflow state transition validation and enforcement."""

from rest_framework.exceptions import PermissionDenied

from sims_backend.common_permissions import can_transition_workflow_state, in_group


def validate_workflow_transition(user, entity, from_state: str, to_state: str) -> None:
    """
    Validate and enforce workflow state transition rules per role.
    
    Raises PermissionDenied if transition is not allowed.
    
    Args:
        user: The user attempting the transition
        entity: The entity being transitioned (for context in error messages)
        from_state: Current state
        to_state: Target state
    
    Raises:
        PermissionDenied: If transition is not allowed
    """
    if from_state == to_state:
        # No transition needed
        return
    
    if not can_transition_workflow_state(user, from_state, to_state):
        # Determine role for error message
        if user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR"):
            role_msg = "Admin/Coordinator"
        elif in_group(user, "OFFICE_ASSISTANT"):
            role_msg = "Office Assistant (can only keep records in DRAFT state)"
        else:
            role_msg = "your role"
        
        raise PermissionDenied(
            f"Invalid workflow state transition: {from_state} -> {to_state}. "
            f"Not allowed for {role_msg}."
        )

