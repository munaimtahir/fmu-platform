"""
Management command to generate a login credentials document from seeded data.
This creates a markdown file with all user login credentials for demonstration.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

from sims_backend.students.models import Student

User = get_user_model()


class Command(BaseCommand):
    """Generate login credentials document for demo users."""

    help = "Generate login credentials document from existing seeded data"

    def add_arguments(self, parser):
        """Add command-line arguments."""
        parser.add_argument(
            "--output",
            type=str,
            default="DEMO_LOGIN_CREDENTIALS.md",
            help="Output file path (default: DEMO_LOGIN_CREDENTIALS.md)",
        )

    def handle(self, *args, **options):
        """Generate the credentials document."""
        output_path = options["output"]

        credentials = []
        credentials.append("# SIMS Demo Login Credentials\n")
        credentials.append("**Generated:** {}\n".format(self.get_current_timestamp()))
        credentials.append("\n---\n")

        # Administrative users
        credentials.append("\n## 📋 Administrative Users\n")
        credentials.append("\n### Admin\n")
        admin = User.objects.filter(is_superuser=True).first()
        if admin:
            credentials.append(f"- **Username:** `{admin.username}`")
            credentials.append(f"- **Email:** `{admin.email}`")
            credentials.append(f"- **Password:** `admin123` (default)")
            credentials.append("\n")

        # Registrar
        credentials.append("\n### Registrar\n")
        try:
            registrar_group = Group.objects.get(name="Registrar")
            registrar_users = User.objects.filter(groups=registrar_group)
            for user in registrar_users[:1]:  # Show first registrar
                credentials.append(f"- **Username:** `{user.username}`")
                credentials.append(f"- **Email:** `{user.email}`")
                credentials.append(f"- **Password:** `registrar123` (default)")
                credentials.append("\n")
        except Group.DoesNotExist:
            pass

        # Faculty
        credentials.append("\n### Faculty\n")
        try:
            faculty_group = Group.objects.get(name="Faculty")
            faculty_users = User.objects.filter(groups=faculty_group)
            credentials.append(f"Total Faculty Users: {faculty_users.count()}\n")
            for i, user in enumerate(faculty_users[:5], 1):  # Show first 5
                credentials.append(f"\n#### Faculty {i}")
                credentials.append(f"- **Name:** {user.first_name} {user.last_name}")
                credentials.append(f"- **Username:** `{user.username}`")
                credentials.append(f"- **Email:** `{user.email}`")
                credentials.append(f"- **Password:** `faculty123` (default)")
        except Group.DoesNotExist:
            pass

        # Students
        credentials.append("\n\n---\n")
        credentials.append("\n## 👥 Student Users\n")

        try:
            student_group = Group.objects.get(name="Student")
            student_users = User.objects.filter(groups=student_group).order_by(
                "username"
            )
            students_with_records = []

            for user in student_users:
                # Try to find matching student record
                student_record = None
                try:
                    # Try to match by email
                    student_record = Student.objects.filter(email=user.email).first()
                except Exception:
                    pass

                students_with_records.append(
                    {
                        "user": user,
                        "student": student_record,
                    }
                )

            credentials.append(f"Total Student Users: {len(students_with_records)}\n")

            # Demo student
            demo_student = next(
                (
                    s
                    for s in students_with_records
                    if s["user"].username == "student"
                ),
                None,
            )
            if demo_student:
                credentials.append("\n### Demo Student Account\n")
                user = demo_student["user"]
                student = demo_student["student"]
                credentials.append(f"- **Name:** {user.first_name} {user.last_name}")
                if student:
                    credentials.append(f"- **Reg No:** {student.reg_no}")
                credentials.append(f"- **Username:** `{user.username}`")
                credentials.append(f"- **Email:** `{user.email}`")
                credentials.append(f"- **Password:** `student123` (default)")
                credentials.append("\n")

            # Sample students (first 20)
            credentials.append("\n### Sample Student Accounts\n")
            credentials.append(
                "*Note: Password format is `student{year}` where year is the batch year*\n"
            )
            credentials.append("\n| # | Reg No | Name | Username | Email | Password |\n")
            credentials.append("|:-:|:------:|:----:|:--------:|:-----:|:--------:|\n")

            sample_students = [
                s for s in students_with_records if s["user"].username != "student"
            ][:20]

            for i, item in enumerate(sample_students, 1):
                user = item["user"]
                student = item["student"]
                reg_no = student.reg_no if student else "-"
                name = f"{user.first_name} {user.last_name}"
                # Try to extract password from username or use default
                password = "student123"
                if student and student.reg_no:
                    # Extract year from reg_no (format: YYYY-XX-###)
                    parts = student.reg_no.split("-")
                    if len(parts) > 0:
                        try:
                            year = parts[0]
                            password = f"student{year}"
                        except Exception:
                            pass

                credentials.append(
                    f"| {i} | {reg_no} | {name} | `{user.username}` | `{user.email}` | `{password}` |\n"
                )

            if len(students_with_records) > 21:  # 1 demo + 20 samples
                credentials.append(
                    f"\n*... and {len(students_with_records) - 21} more student accounts*\n"
                )

        except Group.DoesNotExist:
            credentials.append("\nNo student users found.\n")

        credentials.append("\n---\n")
        credentials.append("\n## 📝 Notes\n")
        credentials.append("\n1. **Default Passwords:**")
        credentials.append("   - Admin: `admin123`")
        credentials.append("   - Registrar: `registrar123`")
        credentials.append("   - Faculty: `faculty123`")
        credentials.append("   - Students: Format is `student{year}` where year is the batch year")
        credentials.append("\n2. **Login:** Users can login with either username or email address")
        credentials.append("\n3. **Security:** Change all default passwords in production!")
        credentials.append("\n4. **Student Records:** Each student user should have a corresponding Student record")
        credentials.append("\n---\n")

        # Write to file
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("\n".join(credentials))
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Login credentials document generated: {output_path}"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"\n❌ Error writing file: {str(e)}")
            )

    def get_current_timestamp(self):
        """Get current timestamp as string."""
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
