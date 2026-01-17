"""
Tests for Notification API
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.notifications.models import Notification


@pytest.fixture
def user(db):
    """Create a regular user"""
    return User.objects.create_user(
        username='testuser',
        email='test@test.com',
        password='testpass123'
    )


@pytest.fixture
def other_user(db):
    """Create another user"""
    return User.objects.create_user(
        username='otheruser',
        email='other@test.com',
        password='testpass123'
    )


@pytest.fixture
def api_client(user):
    """Create API client with user authentication"""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestNotificationAPI:
    """Tests for notification API endpoints"""

    def test_list_notifications_own_only(self, api_client, user, other_user):
        """User can only see their own notifications"""
        # Create notifications for both users
        Notification.objects.create(
            user=user,
            title="User Notification",
            message="This is for the test user"
        )
        Notification.objects.create(
            user=other_user,
            title="Other User Notification",
            message="This is for another user"
        )
        
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == "User Notification"

    def test_unread_count(self, api_client, user):
        """Unread count endpoint returns correct count"""
        # Create 3 notifications, mark 1 as read
        n1 = Notification.objects.create(user=user, title="N1", message="Msg1")
        n2 = Notification.objects.create(user=user, title="N2", message="Msg2")
        n3 = Notification.objects.create(user=user, title="N3", message="Msg3")
        n1.mark_as_read()
        
        response = api_client.get('/api/notifications/unread-count/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_mark_notification_as_read(self, api_client, user):
        """User can mark notification as read"""
        notification = Notification.objects.create(
            user=user,
            title="Test",
            message="Test message"
        )
        assert not notification.is_read
        
        response = api_client.post(f'/api/notifications/{notification.id}/mark-read/')
        assert response.status_code == status.HTTP_200_OK
        
        notification.refresh_from_db()
        assert notification.is_read
        assert notification.read_at is not None

    def test_mark_all_as_read(self, api_client, user):
        """User can mark all notifications as read"""
        Notification.objects.create(user=user, title="N1", message="Msg1")
        Notification.objects.create(user=user, title="N2", message="Msg2")
        Notification.objects.create(user=user, title="N3", message="Msg3")
        
        response = api_client.post('/api/notifications/mark-all-read/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_read'] == 3
        
        # Verify all are marked read
        assert Notification.objects.filter(user=user, is_read=False).count() == 0

    def test_filter_by_unread(self, api_client, user):
        """User can filter notifications by unread status"""
        n1 = Notification.objects.create(user=user, title="N1", message="Msg1")
        Notification.objects.create(user=user, title="N2", message="Msg2")
        n1.mark_as_read()
        
        response = api_client.get('/api/notifications/?is_read=false')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == "N2"
