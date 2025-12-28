from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Student",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("reg_no", models.CharField(max_length=32, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("program", models.CharField(max_length=128)),
                ("status", models.CharField(max_length=32)),
            ],
            options={"ordering": ["reg_no"]},
        ),
    ]
