from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from sims_backend.learning.models import LearningMaterial, LearningMaterialAudience


@pytest.mark.django_db
def test_learning_material_file_requires_file(admin_user):
    material = LearningMaterial(
        title="Anatomy Notes",
        kind=LearningMaterial.KIND_FILE,
        created_by=admin_user,
    )
    with pytest.raises(ValidationError):
        material.full_clean()


@pytest.mark.django_db
def test_learning_material_link_requires_url(admin_user):
    material = LearningMaterial(
        title="Course Link",
        kind=LearningMaterial.KIND_LINK,
        created_by=admin_user,
    )
    with pytest.raises(ValidationError):
        material.full_clean()


@pytest.mark.django_db
def test_learning_material_file_disallows_url(admin_user):
    file_data = SimpleUploadedFile("notes.pdf", b"data")
    material = LearningMaterial(
        title="PDF",
        kind=LearningMaterial.KIND_FILE,
        file=file_data,
        url="https://example.com",
        created_by=admin_user,
    )
    with pytest.raises(ValidationError):
        material.full_clean()


@pytest.mark.django_db
def test_learning_material_availability_window_validation(admin_user):
    material = LearningMaterial(
        title="Window",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com",
        available_from=timezone.now(),
        available_until=timezone.now() - timedelta(days=1),
        created_by=admin_user,
    )
    with pytest.raises(ValidationError):
        material.full_clean()


@pytest.mark.django_db
def test_learning_material_audience_requires_scope(admin_user):
    material = LearningMaterial.objects.create(
        title="Material",
        kind=LearningMaterial.KIND_LINK,
        url="https://example.com",
        created_by=admin_user,
    )
    audience = LearningMaterialAudience(material=material)
    with pytest.raises(ValidationError):
        audience.full_clean()
