"""
Management command to seed demo data for SIMS
Creates sample Programs, Courses, Terms, Sections, Students, Enrollment, Attendance, Assessments, and Results
"""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from sims_backend.academics.models import Batch, Course, Group, Program, Section, Term
from sims_backend.assessments.models import Assessment, AssessmentScore
from sims_backend.attendance.models import Attendance
from sims_backend.enrollment.models import Enrollment
from sims_backend.results.models import Result
from sims_backend.students.models import Student

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
        "Seed demo data for SIMS (Programs, Courses, Terms, Sections, Students, etc.)"
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
        courses = self._create_courses(programs)
        terms = self._create_terms()
        sections = self._create_sections(courses, terms, users)

        # Create students and enroll them
        students, student_logins = self._create_students(
            programs, batches, groups, num_students, users
        )
        enrollments = self._enroll_students(students, sections)

        # Create attendance records
        self._create_attendance(enrollments)

        # Create assessments and scores
        self._create_assessments(sections)

        # Create results
        self._create_results(enrollments)

        self.stdout.write(self.style.SUCCESS("\n✅ Demo data seeded successfully!"))
        self.stdout.write(f"  - Programs: {len(programs)}")
        self.stdout.write(f"  - Batches: {len(batches)}")
        self.stdout.write(f"  - Groups: {len(groups)}")
        self.stdout.write(f"  - Courses: {len(courses)}")
        self.stdout.write(f"  - Terms: {len(terms)}")
        self.stdout.write(f"  - Sections: {len(sections)}")
        self.stdout.write(f"  - Students: {len(students)}")
        self.stdout.write(f"  - Enrollments: {len(enrollments)}")
        
        # Write login credentials
        self._print_login_credentials(student_logins)

    def _clear_data(self):
        """
        Clears all existing demo data from the database.

        This method deletes all records from the models that are populated
        by this seeding script, ensuring a clean slate before new data is
        inserted.
        """
        Result.objects.all().delete()
        AssessmentScore.objects.all().delete()
        Assessment.objects.all().delete()
        Attendance.objects.all().delete()
        Enrollment.objects.all().delete()
        Student.objects.all().delete()
        Group.objects.all().delete()
        Batch.objects.all().delete()
        Section.objects.all().delete()
        Term.objects.all().delete()
        Course.objects.all().delete()
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
            "Bachelor of Science in Computer Science",
            "Bachelor of Science in Electrical Engineering",
            "Master of Business Administration",
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

    def _create_courses(self, programs):
        """
        Creates a set of courses for the given programs.

        Args:
            programs (list): A list of `Program` objects to which the courses
                             will be assigned.

        Returns:
            list: A list of the created `Course` objects.
        """
        courses_data = [
            {"code": "CS101", "title": "Introduction to Programming", "credits": 3},
            {"code": "CS201", "title": "Data Structures", "credits": 3},
            {"code": "CS301", "title": "Database Systems", "credits": 3},
            {"code": "CS401", "title": "Software Engineering", "credits": 3},
            {"code": "EE101", "title": "Circuit Analysis", "credits": 4},
            {"code": "EE201", "title": "Digital Logic Design", "credits": 4},
            {"code": "MBA501", "title": "Strategic Management", "credits": 3},
            {"code": "MBA601", "title": "Financial Management", "credits": 3},
        ]

        courses = []
        for data in courses_data:
            # Assign program based on course code
            if data["code"].startswith("CS"):
                program = next(p for p in programs if "Computer Science" in p.name)
            elif data["code"].startswith("EE"):
                program = next(
                    p for p in programs if "Electrical Engineering" in p.name
                )
            else:
                program = next(
                    p for p in programs if "Business Administration" in p.name
                )

            course, created = Course.objects.get_or_create(
                code=data["code"], defaults={**data, "program": program}
            )
            courses.append(course)

        self.stdout.write(f"  ✓ Created {len(courses)} courses")
        return courses

    def _create_terms(self):
        """
        Creates a set of academic terms.

        Returns:
            list: A list of the created `Term` objects.
        """
        current_year = date.today().year
        terms_data = [
            {
                "name": f"Fall {current_year}",
                "start_date": date(current_year, 9, 1),
                "end_date": date(current_year, 12, 31),
                "status": "open",
            },
            {
                "name": f"Spring {current_year + 1}",
                "start_date": date(current_year + 1, 1, 15),
                "end_date": date(current_year + 1, 5, 15),
                "status": "closed",
            },
        ]

        terms = []
        for data in terms_data:
            term, created = Term.objects.get_or_create(name=data["name"], defaults=data)
            terms.append(term)

        self.stdout.write(f"  ✓ Created {len(terms)} terms")
        return terms

    def _create_sections(self, courses, terms, users):
        """
        Creates sections for courses and assigns them to faculty members.

        Args:
            courses (list): A list of `Course` objects.
            terms (list): A list of `Term` objects.
            users (dict): A dictionary of user objects.

        Returns:
            list: A list of the created `Section` objects.
        """
        current_term = terms[0]  # Fall term
        sections = []

        # Get faculty users
        faculty_users = [
            users.get("faculty"),
            users.get("faculty1"),
            users.get("faculty2"),
            users.get("faculty3"),
        ]

        faculty_idx = 0

        for course in courses[:6]:  # Create sections for first 6 courses
            for section_num in range(1, 3):  # 2 sections per course
                # Assign faculty in round-robin fashion
                teacher = faculty_users[faculty_idx % len(faculty_users)]
                faculty_idx += 1

                section, created = Section.objects.get_or_create(
                    course=course,
                    term=current_term.name,
                    teacher=teacher,
                    defaults={"capacity": 30},
                )
                sections.append(section)

        self.stdout.write(
            f"  ✓ Created {len(sections)} sections with faculty assignments"
        )
        return sections

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

        # Get batches for CS program (use first program if CS not found)
        cs_program = next(
            (p for p in programs if "Computer Science" in p.name), programs[0]
        )
        cs_batches = [b for b in batches if b.program == cs_program]
        cs_groups = [g for g in groups if g.batch in cs_batches]

        if not cs_batches or not cs_groups:
            # Fallback: use first available batch and group
            cs_batches = [batches[0]] if batches else []
            cs_groups = [groups[0]] if groups else []

        # Create the demo student user's record first
        student_user = users.get("student")
        if student_user and cs_batches and cs_groups:
            reg_no = f"{cs_batches[0].start_year}-CS-001"
            first_name = student_user.first_name or "Jane"
            last_name = student_user.last_name or "Scholar"
            student, created = Student.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": f"{first_name} {last_name}",
                    "program": cs_program,
                    "batch": cs_batches[0],
                    "group": cs_groups[0],
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
            reg_no = f"{cs_batches[0].start_year}-CS-{(100 + i):03d}"
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
            batch = cs_batches[i % len(cs_batches)]
            group = [g for g in cs_groups if g.batch == batch][
                (i // len(cs_batches)) % 2
            ]

            student, created = Student.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": name,
                    "program": cs_program,
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

    def _enroll_students(self, students, sections):
        """
        Enrolls students in various sections.

        Args:
            students (list): A list of `Student` objects.
            sections (list): A list of `Section` objects.

        Returns:
            list: A list of the created `Enrollment` objects.
        """
        enrollments = []

        for student in students:
            # Enroll each student in 4-5 sections
            student_sections = sections[: (4 + (hash(student.reg_no) % 2))]

            for section in student_sections:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    section=section,
                    defaults={
                        "term": section.term,
                        "status": "enrolled",
                    },
                )
                enrollments.append(enrollment)

        self.stdout.write(f"  ✓ Created {len(enrollments)} enrollments")
        return enrollments

    def _create_attendance(self, enrollments):
        """
        Creates attendance records for students in their enrolled sections.

        Args:
            enrollments (list): A list of `Enrollment` objects.
        """
        attendance_count = 0

        for enrollment in enrollments:
            # Create 10 attendance records per enrollment
            # Get term start date from enrollment
            try:
                term = Term.objects.get(name=enrollment.term)
                start_date = term.start_date
            except Term.DoesNotExist:
                start_date = date.today() - timedelta(days=30)

            for day in range(0, 30, 3):  # Every 3 days for 10 records
                attendance_date = start_date + timedelta(days=day)
                # 80% attendance rate
                present = (hash(str(enrollment.id) + str(day)) % 10) < 8

                Attendance.objects.get_or_create(
                    section=enrollment.section,
                    student=enrollment.student,
                    date=attendance_date,
                    defaults={
                        "present": present,
                        "reason": "" if present else "Absent",
                    },
                )
                attendance_count += 1

        self.stdout.write(f"  ✓ Created {attendance_count} attendance records")

    def _create_assessments(self, sections):
        """
        Creates assessments and scores for students in the given sections.

        Args:
            sections (list): A list of `Section` objects.
        """
        for section in sections:
            # Create assessment scheme
            assessments_data = [
                {"type": "midterm", "weight": 30},
                {"type": "final", "weight": 50},
                {"type": "quiz", "weight": 10},
                {"type": "assignment", "weight": 10},
            ]

            for data in assessments_data:
                assessment, created = Assessment.objects.get_or_create(
                    section=section,
                    type=data["type"],
                    defaults={"weight": data["weight"]},
                )

                # Create scores for all enrolled students
                enrollments = Enrollment.objects.filter(section=section)
                for enrollment in enrollments:
                    # Random score between 60-95 out of 100
                    base_score = 60
                    variance = 35
                    score = (
                        base_score
                        + (hash(str(enrollment.id) + str(assessment.id)) % 100)
                        / 100
                        * variance
                    )

                    AssessmentScore.objects.get_or_create(
                        assessment=assessment,
                        student=enrollment.student,
                        defaults={"score": round(score, 2), "max_score": 100},
                    )

        self.stdout.write(
            f"  ✓ Created assessments with scores for {len(sections)} sections"
        )

    def _create_results(self, enrollments):
        """
        Creates final results for students based on their assessment scores.

        Args:
            enrollments (list): A list of `Enrollment` objects.
        """
        results_count = 0

        for enrollment in enrollments:
            # Calculate total score from assessment scores
            assessments = Assessment.objects.filter(section=enrollment.section)
            total_score = 0

            for assessment in assessments:
                try:
                    score = AssessmentScore.objects.get(
                        assessment=assessment, student=enrollment.student
                    )
                    # Weighted score
                    total_score += (score.score / score.max_score) * assessment.weight
                except AssessmentScore.DoesNotExist:
                    pass

            # Create result
            result, created = Result.objects.get_or_create(
                student=enrollment.student,
                section=enrollment.section,
                defaults={
                    "final_grade": self._calculate_grade(total_score),
                    "state": "draft",  # Start as draft
                },
            )
            results_count += 1

        self.stdout.write(f"  ✓ Created {results_count} results")

    def _calculate_grade(self, score):
        """
        Calculates the letter grade based on a numerical score.

        Args:
            score (float): The numerical score.

        Returns:
            str: The corresponding letter grade.
        """
        if score >= 90:
            return "A+"
        elif score >= 85:
            return "A"
        elif score >= 80:
            return "A-"
        elif score >= 75:
            return "B+"
        elif score >= 70:
            return "B"
        elif score >= 65:
            return "B-"
        elif score >= 60:
            return "C+"
        elif score >= 55:
            return "C"
        elif score >= 50:
            return "C-"
        else:
            return "F"
