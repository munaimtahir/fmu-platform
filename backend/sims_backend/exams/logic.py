"""Exam passing logic computation for different passing modes."""

from decimal import Decimal

from sims_backend.exams.models import Exam, ExamComponent


def compute_passing_status(exam: Exam, total_obtained: Decimal, total_max: Decimal, component_entries: list) -> dict:
    """
    Compute passing status based on exam passing mode and component entries.

    Args:
        exam: Exam instance
        total_obtained: Total marks obtained
        total_max: Total maximum marks
        component_entries: List of dicts with keys: exam_component_id, marks_obtained, max_marks

    Returns:
        dict with keys:
            - final_outcome: 'PASS', 'FAIL', or 'PENDING'
            - component_outcomes: dict mapping exam_component_id to 'PASS', 'FAIL', or 'NA'
    """
    component_outcomes = {}

    # First, compute component-level outcomes
    for entry in component_entries:
        component_id = entry['exam_component_id']
        marks_obtained = Decimal(str(entry['marks_obtained']))
        max_marks = Decimal(str(entry['max_marks']))

        # Find the component to get passing criteria
        try:
            component = exam.components.get(id=component_id)
        except ExamComponent.DoesNotExist:
            component_outcomes[component_id] = 'NA'
            continue

        # Determine if component passes
        component_passes = False
        if component.pass_marks is not None:
            component_passes = marks_obtained >= component.pass_marks
        elif component.pass_percent is not None:
            if max_marks > 0:
                component_percent = (marks_obtained / max_marks) * 100
                component_passes = component_percent >= component.pass_percent
            else:
                component_passes = False
        else:
            # No passing criteria defined, consider it passed if marks > 0
            component_passes = marks_obtained > 0

        component_outcomes[component_id] = 'PASS' if component_passes else 'FAIL'

    # Now compute final outcome based on passing mode
    final_outcome = 'PENDING'

    if exam.passing_mode == Exam.PASSING_MODE_TOTAL_ONLY:
        # Only check total marks/percent
        if exam.pass_total_marks is not None:
            final_outcome = 'PASS' if total_obtained >= exam.pass_total_marks else 'FAIL'
        elif exam.pass_total_percent is not None:
            if total_max > 0:
                total_percent = (total_obtained / total_max) * 100
                final_outcome = 'PASS' if total_percent >= exam.pass_total_percent else 'FAIL'
            else:
                final_outcome = 'FAIL'
        else:
            final_outcome = 'PENDING'  # No criteria defined

    elif exam.passing_mode == Exam.PASSING_MODE_COMPONENT_WISE:
        # Check if all mandatory components pass
        all_mandatory_pass = True
        for entry in component_entries:
            component_id = entry['exam_component_id']
            try:
                component = exam.components.get(id=component_id)
                if component.is_mandatory_to_pass:
                    if component_outcomes.get(component_id) != 'PASS':
                        all_mandatory_pass = False
                        break
            except ExamComponent.DoesNotExist:
                continue

        if exam.fail_if_any_component_fail:
            # Fail if any component fails (not just mandatory)
            any_fails = any(outcome == 'FAIL' for outcome in component_outcomes.values())
            final_outcome = 'FAIL' if any_fails else 'PASS'
        else:
            # Only check mandatory components
            final_outcome = 'PASS' if all_mandatory_pass else 'FAIL'

    elif exam.passing_mode == Exam.PASSING_MODE_HYBRID:
        # Both total and component criteria must be met
        # Check total first
        total_passes = False
        if exam.pass_total_marks is not None:
            total_passes = total_obtained >= exam.pass_total_marks
        elif exam.pass_total_percent is not None:
            if total_max > 0:
                total_percent = (total_obtained / total_max) * 100
                total_passes = total_percent >= exam.pass_total_percent
            else:
                total_passes = False

        # Check components
        all_mandatory_pass = True
        for entry in component_entries:
            component_id = entry['exam_component_id']
            try:
                component = exam.components.get(id=component_id)
                if component.is_mandatory_to_pass:
                    if component_outcomes.get(component_id) != 'PASS':
                        all_mandatory_pass = False
                        break
            except ExamComponent.DoesNotExist:
                continue

        if exam.fail_if_any_component_fail:
            any_fails = any(outcome == 'FAIL' for outcome in component_outcomes.values())
            component_passes = not any_fails
        else:
            component_passes = all_mandatory_pass

        # Both must pass
        final_outcome = 'PASS' if (total_passes and component_passes) else 'FAIL'

    return {
        'final_outcome': final_outcome,
        'component_outcomes': component_outcomes,
    }

