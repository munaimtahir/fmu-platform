import pytest
from decimal import Decimal
from sims_backend.academics.models import AcademicPeriod
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.exams.logic import compute_passing_status

@pytest.fixture
def exam_setup(db):
    period = AcademicPeriod.objects.create(name="Test Period", period_type="YEAR")
    exam = Exam.objects.create(title="Logic Test Exam", academic_period=period)
    c1 = ExamComponent.objects.create(exam=exam, name="Theory", max_marks=100, sequence=1, is_mandatory_to_pass=True)
    c2 = ExamComponent.objects.create(exam=exam, name="Practical", max_marks=50, sequence=2, is_mandatory_to_pass=False)
    return {"exam": exam, "theory": c1, "practical": c2}

def test_passing_status_total_only_marks(exam_setup):
    exam = exam_setup["exam"]
    exam.passing_mode = Exam.PASSING_MODE_TOTAL_ONLY
    exam.pass_total_marks = 75
    
    # Pass
    res = compute_passing_status(exam, Decimal("80"), Decimal("150"), [])
    assert res["final_outcome"] == "PASS"
    
    # Fail
    res = compute_passing_status(exam, Decimal("70"), Decimal("150"), [])
    assert res["final_outcome"] == "FAIL"

def test_passing_status_total_only_percent(exam_setup):
    exam = exam_setup["exam"]
    exam.passing_mode = Exam.PASSING_MODE_TOTAL_ONLY
    exam.pass_total_percent = 50
    
    # Pass
    res = compute_passing_status(exam, Decimal("75"), Decimal("150"), [])
    assert res["final_outcome"] == "PASS"
    
    # Fail
    res = compute_passing_status(exam, Decimal("70"), Decimal("150"), [])
    assert res["final_outcome"] == "FAIL"

def test_passing_status_component_wise(exam_setup):
    exam = exam_setup["exam"]
    exam.passing_mode = Exam.PASSING_MODE_COMPONENT_WISE
    exam.fail_if_any_component_fail = False
    
    t_id = exam_setup["theory"].id
    p_id = exam_setup["practical"].id
    
    # Theory mandatory, pass theory (80/100, pass_marks=50)
    exam_setup["theory"].pass_marks = 50
    exam_setup["theory"].save()
    
    entries = [
        {"exam_component_id": t_id, "marks_obtained": 60, "max_marks": 100},
        {"exam_component_id": p_id, "marks_obtained": 10, "max_marks": 50}
    ]
    
    res = compute_passing_status(exam, Decimal("70"), Decimal("150"), entries)
    assert res["final_outcome"] == "PASS"
    assert res["component_outcomes"][t_id] == "PASS"
    assert res["component_outcomes"][p_id] == "PASS" # 10 > 0

def test_passing_status_component_wise_fail_any(exam_setup):
    exam = exam_setup["exam"]
    exam.passing_mode = Exam.PASSING_MODE_COMPONENT_WISE
    exam.fail_if_any_component_fail = True
    
    t_id = exam_setup["theory"].id
    p_id = exam_setup["practical"].id
    
    exam_setup["theory"].pass_marks = 50
    exam_setup["theory"].save()
    exam_setup["practical"].pass_marks = 25
    exam_setup["practical"].save()
    
    entries = [
        {"exam_component_id": t_id, "marks_obtained": 60, "max_marks": 100},
        {"exam_component_id": p_id, "marks_obtained": 10, "max_marks": 50} # Fails practical
    ]
    
    res = compute_passing_status(exam, Decimal("70"), Decimal("150"), entries)
    assert res["final_outcome"] == "FAIL"

def test_passing_status_hybrid(exam_setup):
    exam = exam_setup["exam"]
    exam.passing_mode = Exam.PASSING_MODE_HYBRID
    exam.pass_total_percent = 50
    
    t_id = exam_setup["theory"].id
    exam_setup["theory"].pass_marks = 50
    exam_setup["theory"].save()
    
    # Case 1: Total pass, component pass -> PASS
    entries = [{"exam_component_id": t_id, "marks_obtained": 60, "max_marks": 100}]
    res = compute_passing_status(exam, Decimal("80"), Decimal("150"), entries)
    assert res["final_outcome"] == "PASS"
    
    # Case 2: Total pass, component fail -> FAIL
    entries = [{"exam_component_id": t_id, "marks_obtained": 40, "max_marks": 100}]
    res = compute_passing_status(exam, Decimal("80"), Decimal("150"), entries)
    assert res["final_outcome"] == "FAIL"
    
    # Case 3: Total fail, component pass -> FAIL
    entries = [{"exam_component_id": t_id, "marks_obtained": 60, "max_marks": 100}]
    res = compute_passing_status(exam, Decimal("40"), Decimal("150"), entries)
    assert res["final_outcome"] == "FAIL"

def test_passing_status_component_not_found(exam_setup):
    exam = exam_setup["exam"]
    res = compute_passing_status(exam, Decimal("0"), Decimal("0"), [{"exam_component_id": 999, "marks_obtained": 0, "max_marks": 0}])
    assert res["component_outcomes"][999] == "NA"
