"""Attendance utility functions for calculating attendance percentage and eligibility."""

from typing import Any

from sims_backend.attendance.models import Attendance


def calculate_attendance_percentage(student_id: int, section_id: int) -> float:
    """
    Calculate attendance percentage for a student in a section.

    Args:
        student_id: ID of the student
        section_id: ID of the section

    Returns:
        Attendance percentage (0-100)
    """
    from sims_backend.timetable.models import Session
    
    # Get all sessions for this section
    sessions = Session.objects.filter(group__students__id=student_id)
    # Get all attendance records for this student in these sessions
    attendance_records = Attendance.objects.filter(
        student_id=student_id,
        session__in=sessions
    )

    total_days = attendance_records.count()
    if total_days == 0:
        return 0.0

    # Count present days (PRESENT or LATE status)
    present_days = attendance_records.filter(
        status__in=[Attendance.STATUS_PRESENT, Attendance.STATUS_LATE]
    ).count()

    return (present_days / total_days) * 100.0


def check_eligibility(
    student_id: int, section_id: int, threshold: float = 75.0
) -> dict[str, Any]:
    """
    Check if a student is eligible based on attendance threshold.

    Per RULES.md, default threshold is 75%.

    Args:
        student_id: ID of the student
        section_id: ID of the section
        threshold: Minimum attendance percentage required (default 75%)

    Returns:
        Dictionary with eligibility status and percentage
    """
    percentage = calculate_attendance_percentage(student_id, section_id)

    return {
        "eligible": percentage >= threshold,
        "attendance_percentage": percentage,
        "threshold": threshold,
        "student_id": student_id,
        "section_id": section_id,
    }


def get_section_attendance_summary(section_id: int) -> dict[str, Any]:
    """
    Get attendance summary for a section.

    Args:
        section_id: ID of the section

    Returns:
        Dictionary with attendance statistics
    """
    from sims_backend.timetable.models import Session
    
    # Get sessions for this section
    sessions = Session.objects.filter(group__sections__id=section_id)
    attendance_records = Attendance.objects.filter(session__in=sessions)

    total_records = attendance_records.count()
    present_count = attendance_records.filter(
        status__in=[Attendance.STATUS_PRESENT, Attendance.STATUS_LATE]
    ).count()
    absent_count = attendance_records.filter(status=Attendance.STATUS_ABSENT).count()

    return {
        "section_id": section_id,
        "total_records": total_records,
        "present_count": present_count,
        "absent_count": absent_count,
        "overall_percentage": (
            (present_count / total_records * 100.0) if total_records > 0 else 0.0
        ),
    }
