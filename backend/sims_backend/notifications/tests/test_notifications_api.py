import pytest
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth.models import Group, User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import (
    AcademicPeriod,
    Batch,
    Course,
    Department,
    Group as AcademicGroup,
    Program,
    Section,
)
from sims_backend.notifications.jobs import expand_audience_and_create_inbox, send_notification_email_batch
from sims_backend.notifications.models import (
    Notification,
    NotificationAudience,
    NotificationDeliveryLog,
    NotificationInbox,
)
from sims_backend.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def setup_notification_data(db):
    admin_group, _ = Group.objects.get_or_create(name="ADMIN")
    student_group, _ = Group.objects.get_or_create(name="STUDENT")

    admin_user = User.objects.create_user(username="admin", password="password", email="admin@example.com")
    admin_user.groups.add(admin_group)

    student_user = User.objects.create_user(username="student", password="password", email="student@example.com")
    student_user.groups.add(student_group)

    student_user_two = User.objects.create_user(
        username="student2", password="password", email="student2@example.com"
    )
    student_user_two.groups.add(student_group)

    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(name="2024", program=program, start_year=2024)
    group = AcademicGroup.objects.create(name="A", batch=batch)

    student_one = Student.objects.create(
        user=student_user,
        reg_no="S1",
        name="Student One",
        program=program,
        batch=batch,
        group=group,
    )
    student_two = Student.objects.create(
        user=student_user_two,
        reg_no="S2",
        name="Student Two",
        program=program,
        batch=batch,
        group=group,
    )

    department = Department.objects.create(name="Science", code="SCI")
    academic_period = AcademicPeriod.objects.create(
        period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
        name="2024-2025",
    )
    course = Course.objects.create(code="SCI-101", name="Science", department=department)
    section = Section.objects.create(
        course=course,
        name="Section A",
        academic_period=academic_period,
        group=group,
    )

    return {
        "admin_user": admin_user,
        "student_user": student_user,
        "student_user_two": student_user_two,
        "student_one": student_one,
        "student_two": student_two,
        "program": program,
        "batch": batch,
        "group": group,
        "section": section,
    }


@pytest.mark.django_db
def test_admin_can_create_notification(api_client, setup_notification_data):
    api_client.force_authenticate(user=setup_notification_data["admin_user"])

    response = api_client.post(
        "/api/notifications/",
        {
            "title": "New Notice",
            "body": "Hello students",
            "category": "General",
            "priority": "NORMAL",
            "send_email": False,
            "audiences": [{"audience_type": NotificationAudience.AUDIENCE_ALL_STUDENTS}],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "New Notice"


@pytest.mark.django_db
def test_student_cannot_create_notification(api_client, setup_notification_data):
    api_client.force_authenticate(user=setup_notification_data["student_user"])

    response = api_client.post(
        "/api/notifications/",
        {
            "title": "Unauthorized",
            "body": "No",
            "category": "General",
            "priority": "NORMAL",
            "send_email": False,
            "audiences": [{"audience_type": NotificationAudience.AUDIENCE_ALL_STUDENTS}],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_can_list_notifications(api_client, setup_notification_data):
    Notification.objects.create(
        title="Admin Notice",
        body="Admin list",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
    )
    api_client.force_authenticate(user=setup_notification_data["admin_user"])
    response = api_client.get("/api/notifications/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1


@pytest.mark.django_db
def test_student_cannot_list_notifications(api_client, setup_notification_data):
    api_client.force_authenticate(user=setup_notification_data["student_user"])
    response = api_client.get("/api/notifications/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_audience_expansion_single_student(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Student Alert",
        body="Targeted",
        category="Alerts",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        status=Notification.STATUS_QUEUED,
    )
    NotificationAudience.objects.create(
        notification=notification,
        audience_type=NotificationAudience.AUDIENCE_STUDENT,
        student=setup_notification_data["student_one"],
    )

    expand_audience_and_create_inbox(notification.id)

    inbox_entries = NotificationInbox.objects.filter(notification=notification)
    assert inbox_entries.count() == 1
    assert inbox_entries.first().user == setup_notification_data["student_user"]


@pytest.mark.django_db
def test_audience_expansion_section(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Section Alert",
        body="For section",
        category="Alerts",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        status=Notification.STATUS_QUEUED,
    )
    NotificationAudience.objects.create(
        notification=notification,
        audience_type=NotificationAudience.AUDIENCE_SECTION,
        section=setup_notification_data["section"],
    )

    expand_audience_and_create_inbox(notification.id)

    inbox_entries = NotificationInbox.objects.filter(notification=notification)
    assert inbox_entries.count() == 2


@pytest.mark.django_db
def test_audience_expansion_all_students(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="All Students",
        body="Everyone",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        status=Notification.STATUS_QUEUED,
    )
    NotificationAudience.objects.create(
        notification=notification,
        audience_type=NotificationAudience.AUDIENCE_ALL_STUDENTS,
    )

    expand_audience_and_create_inbox(notification.id)

    inbox_entries = NotificationInbox.objects.filter(notification=notification)
    assert inbox_entries.count() == 2


@pytest.mark.django_db
def test_mark_read_only_affects_owner(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Read Me",
        body="Check",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
    )
    inbox_one = NotificationInbox.objects.create(
        notification=notification,
        user=setup_notification_data["student_user"],
        delivered_at=timezone.now(),
    )
    inbox_two = NotificationInbox.objects.create(
        notification=notification,
        user=setup_notification_data["student_user_two"],
        delivered_at=timezone.now(),
    )

    api_client.force_authenticate(user=setup_notification_data["student_user"])
    response = api_client.post(f"/api/my/notifications/{inbox_two.id}/read/")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    response = api_client.post(f"/api/my/notifications/{inbox_one.id}/read/")
    assert response.status_code == status.HTTP_200_OK
    inbox_one.refresh_from_db()
    inbox_two.refresh_from_db()
    assert inbox_one.read_at is not None
    assert inbox_two.read_at is None


@pytest.mark.django_db
def test_send_email_batch_uses_send_mail(setup_notification_data):
    notification = Notification.objects.create(
        title="Email Notice",
        body="Email body",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
    )

    with patch("sims_backend.notifications.jobs.send_mail") as send_mail:
        send_notification_email_batch(
            notification.id,
            [setup_notification_data["student_user"].id, setup_notification_data["student_user_two"].id],
        )

        assert send_mail.call_count == 2


@pytest.mark.django_db
def test_send_email_enqueues_batches(setup_notification_data):
    notification = Notification.objects.create(
        title="Email Queue",
        body="Queue this",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        send_email=True,
        status=Notification.STATUS_QUEUED,
    )
    NotificationAudience.objects.create(
        notification=notification,
        audience_type=NotificationAudience.AUDIENCE_ALL_STUDENTS,
    )

    with patch("sims_backend.notifications.jobs.django_rq.get_queue") as get_queue:
        mock_queue = get_queue.return_value
        mock_queue.enqueue.return_value.id = "job-1"
        expand_audience_and_create_inbox(notification.id)

        assert mock_queue.enqueue.called


@pytest.mark.django_db
def test_send_endpoint_rejects_double_send(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Double Send",
        body="Check",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
    )

    api_client.force_authenticate(user=setup_notification_data["admin_user"])

    with patch("sims_backend.notifications.views.django_rq.get_queue") as get_queue:
        mock_queue = get_queue.return_value
        mock_queue.enqueue.return_value.id = "job-1"
        response_first = api_client.post(f"/api/notifications/{notification.id}/send/")
        response_second = api_client.post(f"/api/notifications/{notification.id}/send/")

    assert response_first.status_code == status.HTTP_202_ACCEPTED
    assert response_second.status_code == status.HTTP_409_CONFLICT
    assert mock_queue.enqueue.call_count == 1


@pytest.mark.django_db
def test_send_endpoint_uses_select_for_update(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Lock Send",
        body="Check",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
    )
    api_client.force_authenticate(user=setup_notification_data["admin_user"])

    with patch("sims_backend.notifications.views.Notification.objects.select_for_update") as select_for_update:
        select_for_update.return_value.select_related.return_value.get.return_value = notification
        with patch("sims_backend.notifications.views.django_rq.get_queue") as get_queue:
            get_queue.return_value.enqueue.return_value.id = "job-1"
            response = api_client.post(f"/api/notifications/{notification.id}/send/")

    assert response.status_code == status.HTTP_202_ACCEPTED
    assert select_for_update.called


@pytest.mark.django_db
def test_audience_expansion_is_idempotent(setup_notification_data):
    notification = Notification.objects.create(
        title="Idempotent",
        body="Run twice",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        status=Notification.STATUS_QUEUED,
    )
    NotificationAudience.objects.create(
        notification=notification,
        audience_type=NotificationAudience.AUDIENCE_ALL_STUDENTS,
    )

    expand_audience_and_create_inbox(notification.id)
    expand_audience_and_create_inbox(notification.id)

    inbox_entries = NotificationInbox.objects.filter(notification=notification)
    assert inbox_entries.count() == 2
    delivery_log = NotificationDeliveryLog.objects.get(
        notification=notification, channel=NotificationDeliveryLog.CHANNEL_IN_APP
    )
    assert delivery_log.status == NotificationDeliveryLog.STATUS_SENT


@pytest.mark.django_db
def test_expired_notifications_excluded_from_inbox(api_client, setup_notification_data):
    notification = Notification.objects.create(
        title="Expired",
        body="Expired",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        publish_at=timezone.now(),
        expires_at=timezone.now() - timedelta(days=1),
        status=Notification.STATUS_SENT,
    )
    NotificationInbox.objects.create(
        notification=notification,
        user=setup_notification_data["student_user"],
        delivered_at=timezone.now(),
    )

    api_client.force_authenticate(user=setup_notification_data["student_user"])
    response = api_client.get("/api/my/notifications/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 0

    count_response = api_client.get("/api/my/notifications/unread-count/")
    assert count_response.status_code == status.HTTP_200_OK
    assert count_response.data["count"] == 0


@pytest.mark.django_db
def test_send_notification_email_batch_idempotent(setup_notification_data):
    notification = Notification.objects.create(
        title="Email Notice",
        body="Email body",
        category="General",
        priority=Notification.PRIORITY_NORMAL,
        created_by=setup_notification_data["admin_user"],
        send_email=True,
    )

    with patch("sims_backend.notifications.jobs.send_mail") as send_mail:
        send_notification_email_batch(
            notification.id,
            [setup_notification_data["student_user"].id, setup_notification_data["student_user_two"].id],
        )
        send_notification_email_batch(
            notification.id,
            [setup_notification_data["student_user"].id, setup_notification_data["student_user_two"].id],
        )

    assert send_mail.call_count == 2
