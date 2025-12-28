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


def calculate_final_grade(student_id: int, section_id: int) -> dict:
    """
    Calculate final grade for a student in a section based on assessment scores.

    Args:
        student_id: Student ID
        section_id: Section ID

    Returns:
        Dict with percentage, grade, and component scores
    """
    from sims_backend.assessments.models import Assessment, AssessmentScore

    assessments = Assessment.objects.filter(section_id=section_id)
    total_score = 0.0
    total_weight = 0.0
    components = []

    for assessment in assessments:
        try:
            score_record = AssessmentScore.objects.get(
                assessment=assessment, student_id=student_id
            )
            # Calculate percentage for this assessment
            score_percentage = (
                (score_record.score / score_record.max_score) * 100
                if score_record.max_score > 0
                else 0
            )
            # Weight the score
            weighted_score = (score_percentage * assessment.weight) / 100
            total_score += weighted_score
            total_weight += assessment.weight

            components.append(
                {
                    "type": assessment.type,
                    "score": score_record.score,
                    "max_score": score_record.max_score,
                    "weight": assessment.weight,
                    "weighted_contribution": weighted_score,
                }
            )
        except AssessmentScore.DoesNotExist:
            # If no score recorded, treat as 0
            components.append(
                {
                    "type": assessment.type,
                    "score": 0,
                    "max_score": 100,
                    "weight": assessment.weight,
                    "weighted_contribution": 0,
                }
            )

    # Calculate final percentage (normalize if total weight < 100)
    if total_weight > 0:
        final_percentage = total_score
    else:
        final_percentage = 0.0

    return {
        "percentage": round(final_percentage, 2),
        "grade": calculate_grade(final_percentage),
        "components": components,
        "total_weight_assessed": total_weight,
    }
