import pytest

from sims_backend.admissions.serializers import StudentSerializer

pytestmark = pytest.mark.django_db


def test_student_serializer_valid():
    data = {
        "reg_no": "STU-100",
        "name": "Jane Doe",
        "program": "BSc CS",
        "status": "active",
    }
    serializer = StudentSerializer(data=data)
    assert serializer.is_valid(), serializer.errors


def test_student_serializer_requires_reg_no():
    serializer = StudentSerializer(
        data={
            "reg_no": "   ",
            "name": "Jane Doe",
            "program": "BSc CS",
            "status": "active",
        }
    )
    assert not serializer.is_valid()
    assert "reg_no" in serializer.errors
