"""Services for exam result computation."""

from decimal import Decimal
from typing import List, Dict

from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.results.models import ResultHeader, ResultComponentEntry
from sims_backend.exams.logic import compute_passing_status


def compute_result_passing_status(result_header: ResultHeader) -> None:
    """
    Compute and update passing status for a result header and its component entries.
    
    This function:
    1. Gathers all component entries for the result header
    2. Computes passing status based on exam passing mode
    3. Updates final_outcome and component_outcome fields
    
    Args:
        result_header: ResultHeader instance to compute status for
    """
    exam = result_header.exam
    
    # Gather component entries
    component_entries_data = []
    component_entries_objects = result_header.component_entries.select_related('exam_component').all()
    
    for entry in component_entries_objects:
        component_entries_data.append({
            'exam_component_id': entry.exam_component.id,
            'marks_obtained': entry.marks_obtained,
            'max_marks': entry.exam_component.max_marks,
        })
    
    # Compute passing status
    result = compute_passing_status(
        exam=exam,
        total_obtained=result_header.total_obtained,
        total_max=result_header.total_max,
        component_entries=component_entries_data,
    )
    
    # Update result header
    result_header.final_outcome = result['final_outcome']
    result_header.save(update_fields=['final_outcome', 'updated_at'])
    
    # Update component entries
    for entry in component_entries_objects:
        component_id = entry.exam_component.id
        if component_id in result['component_outcomes']:
            entry.component_outcome = result['component_outcomes'][component_id]
            entry.save(update_fields=['component_outcome', 'updated_at'])

