"""
Management command to seed demo data for SIMS
Creates sample Programs, Batches, Groups, Departments, Academic Periods, Students, and Sessions
"""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group, Program
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    """
    A Django management command to seed the database with demo data.

    This command populates the database with a set of sample data, including
    users, programs, courses, students, and more, to facilitate testing and
    demonstration of the SIMS application.
    """
    help = (
        "Seed demo data for SIMS (Programs, Batches, Groups, Departments, Students, etc.)"
    )

    def add_arguments(self, parser):
        """
        Adds command-line arguments to the command.

        Args:
            parser: The argument parser instance.
        """
        parser.add_argument(
            "--students",
            type=int,
            default=20,
            help="Number of students to create (default: 20)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        """
        The main entry point for the command.

        Executes the data seeding process, including clearing existing data
        if requested, creating users, academic structures, students, and
        related records.

        Args:
            *args: Variable length argument list.
            **options: Keyword arguments, including command-line options.
        """
        num_students = options["students"]
        clear_data = options["clear"]

        if clear_data:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            self._clear_data()

        self.stdout.write(self.style.SUCCESS("Starting data seeding..."))

        # Create users for different roles
        users = self._create_users()

        # Create academic structure
        programs = self._create_programs()
        batches, groups = self._create_batches_and_groups(programs)
        departments = self._create_departments()
        academic_periods = self._create_academic_periods()

        # Create students with user accounts
        students, student_logins = self._create_students(
            programs, batches, groups, num_students, users
        )

        # Create timetable sessions
        sessions = self._create_sessions(academic_periods, groups, departments, users)

        self.stdout.write(self.style.SUCCESS("\n✅ Demo data seeded successfully!"))
        self.stdout.write(f"  - Programs: {len(programs)}")
        self.stdout.write(f"  - Batches: {len(batches)}")
        self.stdout.write(f"  - Groups: {len(groups)}")
        self.stdout.write(f"  - Departments: {len(departments)}")
        self.stdout.write(f"  - Academic Periods: {len(academic_periods)}")
        self.stdout.write(f"  - Students: {len(students)}")
        self.stdout.write(f"  - Sessions: {len(sessions)}")
        
        # Write login credentials
        self._print_login_credentials(student_logins)

    def _clear_data(self):
        """
        Clears all existing demo data from the database.

        This method deletes all records from the models that are populated
        by this seeding script, ensuring a clean slate before new data is
        inserted.
        """
        Session.objects.all().delete()
        Student.objects.all().delete()
        Group.objects.all().delete()
        Batch.objects.all().delete()
        AcademicPeriod.objects.all().delete()
        Department.objects.all().delete()
        Program.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS("  ✓ Existing data cleared"))

    def _create_users(self):
        """
        Creates a set of demo users with different roles.

        This method creates users for the roles of Admin, Registrar, Faculty,
        and Student, and assigns them to the appropriate user groups.

        Returns:
            dict: A dictionary of the created user objects.
        """
        from django.contrib.auth.models import Group

        users = {}

        # Ensure groups exist
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        faculty_group, _ = Group.objects.get_or_create(name="Faculty")
        student_group, _ = Group.objects.get_or_create(name="Student")
        registrar_group, _ = Group.objects.get_or_create(name="Registrar")

        # Create admin
        if not User.objects.filter(username="admin").exists():
            users["admin"] = User.objects.create_superuser(
                username="admin",
                email="admin@sims.edu",
                password="admin123",
                first_name="Admin",
                last_name="User",
            )
            users["admin"].groups.add(admin_group)
            self.stdout.write("  ✓ Created admin user")
        else:
            users["admin"] = User.objects.get(username="admin")

        # Create registrar user
        if not User.objects.filter(username="registrar").exists():
            users["registrar"] = User.objects.create_user(
                username="registrar",
                email="registrar@sims.edu",
                password="registrar123",
                first_name="Mary",
                last_name="Registrar",
            )
            users["registrar"].groups.add(registrar_group)
            self.stdout.write("  ✓ Created registrar user")
        else:
            users["registrar"] = User.objects.get(username="registrar")

        # Create faculty user
        if not User.objects.filter(username="faculty").exists():
            users["faculty"] = User.objects.create_user(
                username="faculty",
                email="faculty@sims.edu",
                password="faculty123",
                first_name="John",
                last_name="Professor",
            )
            users["faculty"].groups.add(faculty_group)
            self.stdout.write("  ✓ Created faculty user")
        else:
            users["faculty"] = User.objects.get(username="faculty")

        # Create additional faculty users
        for i in range(1, 4):
            username = f"faculty{i}"
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=f"faculty{i}@sims.edu",
                    password="faculty123",
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                )
                user.groups.add(faculty_group)
                users[username] = user
                self.stdout.write(f"  ✓ Created {username} user")
            else:
                users[username] = User.objects.get(username=username)

        # Create student user
        if not User.objects.filter(username="student").exists():
            users["student"] = User.objects.create_user(
                username="student",
                email="student@sims.edu",
                password="student123",
                first_name="Jane",
                last_name="Scholar",
            )
            users["student"].groups.add(student_group)
            self.stdout.write("  ✓ Created student user")
        else:
            users["student"] = User.objects.get(username="student")

        return users

    def _create_programs(self):
        """
        Creates a set of academic programs.

        Returns:
            list: A list of the created `Program` objects.
        """
        programs_data = [
            "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
            "BDS (Bachelor of Dental Surgery)",
            "Doctor of Pharmacy (Pharm.D)",
        ]

        programs = []
        for name in programs_data:
            program, created = Program.objects.get_or_create(name=name)
            programs.append(program)

        self.stdout.write(f"  ✓ Created {len(programs)} programs")
        return programs

    def _create_batches_and_groups(self, programs):
        """
        Creates batches and groups for each program.

        Args:
            programs (list): A list of `Program` objects.

        Returns:
            tuple: A tuple containing (batches, groups) lists.
        """
        from django.contrib.auth.models import Group as AuthGroup

        batches = []
        groups = []
        current_year = date.today().year

        for program in programs:
            # Create batches for the current and previous year
            for year_offset in [0, 1]:
                batch_year = current_year - year_offset
                batch_name = f"{batch_year} Batch"
                batch, created = Batch.objects.get_or_create(
                    program=program,
                    name=batch_name,
                    defaults={"start_year": batch_year},
                )
                batches.append(batch)

                # Create groups for each batch (Group A and Group B)
                for group_letter in ["A", "B"]:
                    group_name = f"Group {group_letter}"
                    group, created = Group.objects.get_or_create(
                        batch=batch,
                        name=group_name,
                    )
                    groups.append(group)

        self.stdout.write(
            f"  ✓ Created {len(batches)} batches and {len(groups)} groups"
        )
        return batches, groups

    def _create_departments(self):
        """
        Creates a set of departments.

        Returns:
            list: A list of the created `Department` objects.
        """
        departments_data = [
            {"name": "Anatomy", "code": "ANAT"},
            {"name": "Physiology", "code": "PHYS"},
            {"name": "Biochemistry", "code": "BIOCHEM"},
            {"name": "Medicine", "code": "MED"},
            {"name": "Surgery", "code": "SURG"},
            {"name": "Pediatrics", "code": "PED"},
        ]

        departments = []
        for data in departments_data:
            department, created = Department.objects.get_or_create(
                code=data["code"], defaults=data
            )
            departments.append(department)

        self.stdout.write(f"  ✓ Created {len(departments)} departments")
        return departments

    def _create_academic_periods(self):
        """
        Creates academic periods (years, blocks, modules).

        Returns:
            list: A list of the created `AcademicPeriod` objects.
        """
        current_year = date.today().year
        periods = []

        # Create Year 1
        year1, created = AcademicPeriod.objects.get_or_create(
            period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
            name="Year 1",
            defaults={
                "start_date": date(current_year, 9, 1),
                "end_date": date(current_year + 1, 6, 30),
            },
        )
        periods.append(year1)

        # Create Block 1 under Year 1
        block1, created = AcademicPeriod.objects.get_or_create(
            period_type=AcademicPeriod.PERIOD_TYPE_BLOCK,
            name="Block 1",
            defaults={
                "parent_period": year1,
                "start_date": date(current_year, 9, 1),
                "end_date": date(current_year, 12, 31),
            },
        )
        periods.append(block1)

        # Create Module A under Block 1
        module_a, created = AcademicPeriod.objects.get_or_create(
            period_type=AcademicPeriod.PERIOD_TYPE_MODULE,
            name="Module A",
            defaults={
                "parent_period": block1,
                "start_date": date(current_year, 9, 1),
                "end_date": date(current_year, 10, 31),
            },
        )
        periods.append(module_a)

        self.stdout.write(f"  ✓ Created {len(periods)} academic periods")
        return periods

    def _create_students(self, programs, batches, groups, num_students, users):
        """
        Creates a set of student records with user accounts.

        Args:
            programs (list): A list of `Program` objects.
            batches (list): A list of `Batch` objects.
            groups (list): A list of `Group` objects.
            num_students (int): The number of students to create.
            users (dict): A dictionary of user objects.

        Returns:
            tuple: A tuple containing (students, student_logins) lists.
        """
        from django.contrib.auth.models import Group as AuthGroup

        students = []
        student_logins = []
        student_group, _ = AuthGroup.objects.get_or_create(name="Student")

        # Get batches for MBBS program (use first program if MBBS not found)
        mbbs_program = next(
            (p for p in programs if "MBBS" in p.name), programs[0]
        )
        mbbs_batches = [b for b in batches if b.program == mbbs_program]
        mbbs_groups = [g for g in groups if g.batch in mbbs_batches]

        if not mbbs_batches or not mbbs_groups:
            # Fallback: use first available batch and group
            mbbs_batches = [batches[0]] if batches else []
            mbbs_groups = [groups[0]] if groups else []

        # Create the demo student user's record first
        student_user = users.get("student")
        if student_user and mbbs_batches and mbbs_groups:
            reg_no = f"{mbbs_batches[0].start_year}-MBBS-001"
            first_name = student_user.first_name or "Jane"
            last_name = student_user.last_name or "Scholar"
            student, created = Student.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": f"{first_name} {last_name}",
                    "program": mbbs_program,
                    "batch": mbbs_batches[0],
                    "group": mbbs_groups[0],
                    "status": Student.STATUS_ACTIVE,
                    "email": student_user.email,
                },
            )
            students.append(student)
            student_logins.append(
                {
                    "reg_no": reg_no,
                    "name": student.name,
                    "username": student_user.username,
                    "email": student_user.email,
                    "password": "student123",
                }
            )
            self.stdout.write(f"  ✓ Created student record for demo user: {reg_no}")

        # Create other students with user accounts
        for i in range(1, num_students):
            reg_no = f"{mbbs_batches[0].start_year}-MBBS-{(100 + i):03d}"
            first_name = fake.first_name()
            last_name = fake.last_name()
            name = f"{first_name} {last_name}"
            username = f"student{reg_no.replace('-', '').lower()}"
            email = f"{username}@sims.edu"
            password = f"student{reg_no.split('-')[0]}"

            # Create user account
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )
                user.groups.add(student_group)
            else:
                user = User.objects.get(username=username)

            # Assign to batch and group (round-robin)
            batch = mbbs_batches[i % len(mbbs_batches)]
            group = [g for g in mbbs_groups if g.batch == batch][
                (i // len(mbbs_batches)) % 2
            ]

            student, created = Student.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": name,
                    "program": mbbs_program,
                    "batch": batch,
                    "group": group,
                    "status": Student.STATUS_ACTIVE,
                    "email": email,
                    "phone": fake.phone_number()[:20],
                    "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=25),
                },
            )
            students.append(student)
            student_logins.append(
                {
                    "reg_no": reg_no,
                    "name": name,
                    "username": username,
                    "email": email,
                    "password": password,
                }
            )

        self.stdout.write(f"  ✓ Created {len(students)} students with user accounts")
        return students, student_logins

    def _print_login_credentials(self, student_logins):
        """
        Prints login credentials for all users.

        Args:
            student_logins (list): A list of student login dictionaries.
        """
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("🔑 LOGIN CREDENTIALS"))
        self.stdout.write("=" * 80)
        self.stdout.write("\n📋 ADMINISTRATIVE USERS:")
        self.stdout.write("  Admin:")
        self.stdout.write("    Username: admin")
        self.stdout.write("    Email: admin@sims.edu")
        self.stdout.write("    Password: admin123")
        self.stdout.write("\n  Registrar:")
        self.stdout.write("    Username: registrar")
        self.stdout.write("    Email: registrar@sims.edu")
        self.stdout.write("    Password: registrar123")
        self.stdout.write("\n  Faculty:")
        self.stdout.write("    Username: faculty / faculty1 / faculty2 / faculty3")
        self.stdout.write("    Email: faculty@sims.edu / faculty1@sims.edu / etc.")
        self.stdout.write("    Password: faculty123")
        self.stdout.write("\n" + "-" * 80)
        self.stdout.write("\n👥 STUDENT USERS:")
        self.stdout.write(f"  Total Students: {len(student_logins)}")
        self.stdout.write("\n  Demo Student:")
        demo_student = next(
            (s for s in student_logins if s["username"] == "student"), None
        )
        if demo_student:
            self.stdout.write(f"    Reg No: {demo_student['reg_no']}")
            self.stdout.write(f"    Name: {demo_student['name']}")
            self.stdout.write(f"    Username: {demo_student['username']}")
            self.stdout.write(f"    Email: {demo_student['email']}")
            self.stdout.write(f"    Password: {demo_student['password']}")

        # Show first 10 students
        self.stdout.write("\n  Sample Students (first 10):")
        for i, login in enumerate(student_logins[:10], 1):
            self.stdout.write(f"\n  {i}. {login['name']} ({login['reg_no']})")
            self.stdout.write(f"     Username: {login['username']}")
            self.stdout.write(f"     Email: {login['email']}")
            self.stdout.write(f"     Password: {login['password']}")

        if len(student_logins) > 10:
            self.stdout.write(
                f"\n  ... and {len(student_logins) - 10} more students"
            )

        self.stdout.write("\n" + "=" * 80)

    def _create_sessions(self, academic_periods, groups, departments, users):
        """
        Creates timetable sessions for groups with faculty assignments.

        Args:
            academic_periods (list): A list of `AcademicPeriod` objects.
            groups (list): A list of `Group` objects.
            departments (list): A list of `Department` objects.
            users (dict): A dictionary of user objects.

        Returns:
            list: A list of the created `Session` objects.
        """
        sessions = []

        # Get faculty users
        faculty_users = [
            users.get("faculty"),
            users.get("faculty1"),
            users.get("faculty2"),
            users.get("faculty3"),
        ]
        faculty_users = [f for f in faculty_users if f is not None]

        if not faculty_users or not academic_periods or not groups or not departments:
            self.stdout.write(self.style.WARNING("  ! Skipping sessions creation - missing required data"))
            return sessions

        # Create sessions for first academic period and first few groups
        period = academic_periods[0]  # Use first period (Year 1 or Module A)
        current_date = period.start_date or date.today()

        # Create 5 sessions per group
        for idx, group in enumerate(groups[:3]):  # First 3 groups
            for day_offset in range(0, 10, 2):  # 5 sessions over 10 days
                session_date = current_date + timedelta(days=day_offset)
                start_time = timezone.make_aware(datetime.combine(session_date, time(hour=9, minute=0)))
                end_time = timezone.make_aware(datetime.combine(session_date, time(hour=11, minute=0)))

                # Assign faculty and department in round-robin
                faculty = faculty_users[(idx + day_offset) % len(faculty_users)]
                department = departments[(idx + day_offset) % len(departments)]

                session, created = Session.objects.get_or_create(
                    academic_period=period,
                    group=group,
                    faculty=faculty,
                    department=department,
                    starts_at=start_time,
                    ends_at=end_time,
                )
                if created:
                    sessions.append(session)

        self.stdout.write(f"  ✓ Created {len(sessions)} timetable sessions")
        return sessions
