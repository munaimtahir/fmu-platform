from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="notificationinbox",
            index=models.Index(fields=["user", "delivered_at"], name="notificatio_user_del_2b4f06_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["created_at"], name="notificatio_created_532b33_idx"),
        ),
        migrations.AddConstraint(
            model_name="notificationdeliverylog",
            constraint=models.UniqueConstraint(
                fields=["notification", "channel"],
                name="notifications_delivery_log_notification_channel_unique",
            ),
        ),
    ]
