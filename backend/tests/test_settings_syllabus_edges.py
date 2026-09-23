import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from sims_backend.academics.models import Period, Program
from sims_backend.settings_app.models import AppSetting
from sims_backend.settings_app.serializers import AppSettingSerializer
from sims_backend.syllabus.models import SyllabusItem
from sims_backend.syllabus.serializers import SyllabusItemSerializer


@pytest.mark.django_db
class TestAppSettingEdges:
    def test_get_default_and_set_update_paths(self, admin_user):
        assert AppSetting.get_value("missing", "fallback") == "fallback"
        assert AppSetting.get_value("missing") is None
        with pytest.raises(ValueError, match="allowlist"):
            AppSetting.set_value("missing", True)
        with pytest.raises(ValueError, match="Invalid"):
            AppSetting.set_value("attendance_lock_days", 366)
        setting = AppSetting.set_value("attendance_lock_days", 7)
        assert setting.value_json == 7 and setting.updated_by is None
        setting = AppSetting.set_value("attendance_lock_days", 14, admin_user)
        assert setting.value_json == 14 and setting.updated_by == admin_user
        setting.full_clean()
        assert str(setting).startswith("attendance_lock_days = 14")

    @pytest.mark.parametrize("key,value,value_type", [
        ("missing", True, "boolean"),
        ("enable_student_portal", "true", "boolean"),
        ("enable_student_portal", True, "string"),
        ("ui_banner_message", "x" * 501, "string"),
    ])
    def test_model_and_serializer_reject_invalid_values(self, key, value, value_type):
        setting = AppSetting(key=key, value_json=value, value_type=value_type)
        with pytest.raises(ValidationError):
            setting.full_clean()
        serializer = AppSettingSerializer(data={"key": key, "value_json": value, "value_type": value_type})
        assert not serializer.is_valid()

    def test_serializer_update_uses_instance_key_and_requires_key_on_create(self):
        existing = AppSetting(key="enable_student_portal", value_json=True, value_type="boolean")
        serializer = AppSettingSerializer(existing, data={"value_json": False}, partial=True)
        assert serializer.is_valid(), serializer.errors
        assert AppSettingSerializer(data={"value_json": True, "value_type": "boolean"}).is_valid() is False


@pytest.mark.django_db
class TestSyllabusEdges:
    def test_model_requires_anchor_and_positive_order(self):
        item = SyllabusItem(title="orphan", order_no=0)
        with pytest.raises(ValidationError):
            item.full_clean()
        program = Program.objects.create(name="Edge Program")
        item = SyllabusItem(program=program, title="item", order_no=1)
        item.full_clean()
        assert "item" in str(item)

    def test_serializer_order_and_anchor_validation(self):
        invalid = SyllabusItemSerializer(data={"title": "x", "order_no": 0})
        assert not invalid.is_valid()
        program = Program.objects.create(name="Serializer Program")
        valid = SyllabusItemSerializer(data={"program": program.id, "title": "x", "order_no": 1})
        assert valid.is_valid(), valid.errors

    def test_reorder_rejects_all_invalid_shapes(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        for payload, status in [
            ({"items": "bad"}, 400),
            ({"items": [{}]}, 400),
            ({"items": [{"id": 99999, "order_no": 1}]}, 404),
            ({"items": [{"id": 99999, "order_no": 0}]}, 400),
        ]:
            response = api_client.post("/api/admin/syllabus/reorder/", payload, format="json")
            assert response.status_code == status
