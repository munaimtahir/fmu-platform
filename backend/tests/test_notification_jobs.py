import pytest
from unittest.mock import patch, MagicMock
from sims_backend.notifications.models import Notification, NotificationAudience, NotificationInbox, NotificationDeliveryLog
from sims_backend.notifications.jobs import expand_audience_and_create_inbox, send_notification_email_batch
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch, Group as AcadGroup
from django.contrib.auth.models import User

@pytest.fixture
def notification_setup(db):
    admin = User.objects.create_superuser(username="admin_notif", password="pass")
    
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")
    
    student_user = User.objects.create_user(username="stu_notif", password="pass", email="stu@test.com")
    student = Student.objects.create(user=student_user, reg_no="N1", name="Stu", program=program, batch=batch, group=group)
    
    notification = Notification.objects.create(
        title="Test Notif", 
        body="Body", 
        created_by=admin,
        send_email=True
    )
    
    return {
        "admin": admin,
        "student_user": student_user,
        "student": student,
        "notification": notification,
        "program": program,
        "batch": batch,
        "group": group
    }

@pytest.mark.django_db
class TestNotificationJobs:
    
    @patch('django_rq.get_queue')
    def test_expand_audience_all_students(self, mock_get_queue, notification_setup):
        mock_queue = MagicMock()
        mock_job = MagicMock()
        mock_job.id = "test-job-id"
        mock_queue.enqueue.return_value = mock_job
        mock_get_queue.return_value = mock_queue
        
        notif = notification_setup["notification"]
        NotificationAudience.objects.create(
            notification=notif, 
            audience_type=NotificationAudience.AUDIENCE_ALL_STUDENTS
        )
        
        res = expand_audience_and_create_inbox(notif.id)
        assert res["target_count"] == 1
        assert NotificationInbox.objects.filter(notification=notif).count() == 1
        assert mock_queue.enqueue.called

    def test_expand_audience_specific_student(self, notification_setup):
        notif = notification_setup["notification"]
        notif.send_email = False # skip RQ
        notif.save()
        
        NotificationAudience.objects.create(
            notification=notif, 
            audience_type=NotificationAudience.AUDIENCE_STUDENT,
            student=notification_setup["student"]
        )
        
        res = expand_audience_and_create_inbox(notif.id)
        assert res["target_count"] == 1

    def test_expand_audience_program(self, notification_setup):
        notif = notification_setup["notification"]
        notif.send_email = False
        notif.save()
        
        NotificationAudience.objects.create(
            notification=notif, 
            audience_type=NotificationAudience.AUDIENCE_PROGRAM,
            program=notification_setup["program"]
        )
        
        res = expand_audience_and_create_inbox(notif.id)
        assert res["target_count"] == 1

    @patch('sims_backend.notifications.jobs.send_mail')
    def test_send_notification_email_batch_success(self, mock_send_mail, notification_setup):
        notif = notification_setup["notification"]
        user = notification_setup["student_user"]
        
        res = send_notification_email_batch(notif.id, [user.id])
        assert res["success_count"] == 1
        assert mock_send_mail.called
        
        log = NotificationDeliveryLog.objects.filter(notification=notif, channel="EMAIL").first()
        assert log.status == "SENT"

    @patch('sims_backend.notifications.jobs.send_mail')
    def test_send_notification_email_batch_failure(self, mock_send_mail, notification_setup):
        mock_send_mail.side_effect = Exception("SMTP Error")
        notif = notification_setup["notification"]
        user = notification_setup["student_user"]
        
        res = send_notification_email_batch(notif.id, [user.id])
        assert res["failure_count"] == 1
        
        log = NotificationDeliveryLog.objects.filter(notification=notif, channel="EMAIL").first()
        assert log.status == "FAILED"
        assert log.error_sample == "Exception"
