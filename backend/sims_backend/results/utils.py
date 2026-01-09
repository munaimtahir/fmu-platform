"""Utility functions for results and grading"""


def calculate_grade(percentage: float) -> str:
    """
    Calculate letter grade based on percentage.

    Args:
        percentage: Score percentage (0-100)

    Returns:
        Letter grade (A+, A, B+, B, C+, C, D, F)
    """
    if percentage >= 90:
        return "A+"
    elif percentage >= 85:
        return "A"
    elif percentage >= 80:
        return "B+"
    elif percentage >= 75:
        return "B"
    elif percentage >= 70:
        return "C+"
    elif percentage >= 65:
        return "C"
    elif percentage >= 60:
        return "D"
    else:
        return "F"


# Legacy calculate_final_grade function removed - use exams and results modules instead
# Final grades are calculated via ResultHeader and ResultComponentEntry in the results module
