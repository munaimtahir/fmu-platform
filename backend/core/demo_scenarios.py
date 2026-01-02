"""
Helper module for creating demo scenario data for SIMS.
Provides functions to generate students in different workflow stages.
"""

import random
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.utils import timezone
from faker import Faker

from sims_backend.academics.models import (
    AcademicPeriod,
    Course,
    Department,
    Program,
    Section,
)
from sims_backend.admissions.models import Student
from sims_backend.assessments.models import Assessment, AssessmentScore
from sims_backend.attendance.models import Attendance
from sims_backend.enrollment.models import Enrollment
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.finance.models import Challan, Charge, StudentLedgerItem
from sims_backend.results.models import ResultComponentEntry, ResultHeader
from sims_backend.timetable.models import Session

User = get_user_model()
fake = Faker()


class DemoScenarioGenerator:
    """Generator for demo scenario data"""

    # Constants
    DEFAULT_GRADUATING_YEARS_AHEAD = 5  # For MBBS programs
    DEMO_PASSWORD_SUFFIX = "demo123"  # Consistent password for all demo users
    DEMO_FACULTY_PASSWORD = "faculty123"  # Password for demo faculty users

    def __init__(self, stdout=None):
        self.stdout = stdout
        self.demo_prefix = "DEMO_"

    def log(self, message):
        """Log a message if stdout is available"""
        if self.stdout:
            self.stdout.write(message)

    def get_or_create_program(self, program_name):
        """Get or create a program"""
        program, created = Program.objects.get_or_create(
            name=program_name,
            defaults={"is_active": True},
        )
        if created:
            self.log(f"  ✓ Created program: {program_name}")
        else:
            self.log(f"  ✓ Using existing program: {program_name}")
        return program

    def get_or_create_academic_period(self, period_name, period_type):
        """Get or create an academic period"""
        current_year = date.today().year

        if period_type == AcademicPeriod.PERIOD_TYPE_YEAR:
            start_date = date(current_year, 9, 1)
            end_date = date(current_year + 1, 6, 30)
        elif period_type == AcademicPeriod.PERIOD_TYPE_BLOCK:
            start_date = date(current_year, 9, 1)
            end_date = date(current_year, 12, 31)
        else:  # MODULE
            start_date = date(current_year, 9, 1)
            end_date = date(current_year, 10, 31)

        period, created = AcademicPeriod.objects.get_or_create(
            period_type=period_type,
            name=period_name,
            defaults={
                "start_date": start_date,
                "end_date": end_date,
            },
        )
        if created:
            self.log(f"  ✓ Created academic period: {period_name}")
        else:
            self.log(f"  ✓ Using existing academic period: {period_name}")
        return period

    def create_demo_courses(self, academic_period, num_courses=3):
        """Create demo courses"""
        courses = []
        departments = list(Department.objects.all()[:3])

        if not departments:
            # Create minimal departments if none exist
            for dept_data in [
                {"name": "Anatomy", "code": "ANAT"},
                {"name": "Physiology", "code": "PHYS"},
                {"name": "Biochemistry", "code": "BIOCHEM"},
            ]:
                dept, _ = Department.objects.get_or_create(
                    code=dept_data["code"], defaults=dept_data
                )
                departments.append(dept)

        course_names = [
            ("Anatomy", "Human Anatomy"),
            ("Physiology", "Medical Physiology"),
            ("Biochemistry", "Medical Biochemistry"),
        ]

        for i in range(min(num_courses, len(course_names))):
            code_prefix, name = course_names[i]
            course_code = f"{self.demo_prefix}{code_prefix[:4].upper()}-101"

            course, created = Course.objects.get_or_create(
                code=course_code,
                defaults={
                    "name": f"{self.demo_prefix}{name}",
                    "department": departments[i],
                    "academic_period": academic_period,
                    "credits": 3,
                },
            )
            courses.append(course)
            if created:
                self.log(f"  ✓ Created course: {course_code}")

        return courses

    def create_demo_sections(self, courses, academic_period, faculty_users, groups, num_sections=3):
        """Create demo sections for courses"""
        sections = []

        for i, course in enumerate(courses[:num_sections]):
            section_letter = chr(65 + i)  # A, B, C
            section_name = f"{self.demo_prefix}Section {section_letter}"

            faculty = faculty_users[i % len(faculty_users)]
            group = groups[i % len(groups)] if groups else None

            section, created = Section.objects.get_or_create(
                course=course,
                name=section_name,
                academic_period=academic_period,
                defaults={
                    "faculty": faculty,
                    "group": group,
                    "capacity": 50,
                },
            )

            # Update existing section if needed
            if not created:
                updated = False
                if section.faculty != faculty:
                    section.faculty = faculty
                    updated = True
                if section.group != group:
                    section.group = group
                    updated = True
                if section.capacity != 50:
                    section.capacity = 50
                    updated = True
                if updated:
                    section.save()
                    self.log(f"  ✓ Updated section: {section_name} for {course.code}")

            sections.append(section)
            if created:
                self.log(f"  ✓ Created section: {section_name} for {course.code}")

        return sections

    def create_demo_faculty(self, num_faculty=2):
        """Create demo faculty users"""
        faculty_users = []
        faculty_group, _ = AuthGroup.objects.get_or_create(name="Faculty")

        for i in range(1, num_faculty + 1):
            username = f"{self.demo_prefix.lower()}faculty{i}"
            email = f"{username}@sims.edu"

            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                self.log(f"  ✓ Using existing faculty: {username}")
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=self.DEMO_FACULTY_PASSWORD,
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                )
                user.groups.add(faculty_group)
                self.log(f"  ✓ Created faculty: {username}")

            faculty_users.append(user)

        return faculty_users

    def create_demo_students(self, program, batch, groups, num_students=20):
        """Create demo students with user accounts - creates both admissions and students records"""
        students = []
        student_logins = []
        student_group, _ = AuthGroup.objects.get_or_create(name="Student")

        current_year = date.today().year

        # Import both Student models
        from sims_backend.students.models import Student as StudentsStudent

        for i in range(num_students):
            reg_no = f"{self.demo_prefix}{current_year}-{program.name[:4].upper()}-{(i + 1):03d}"
            first_name = fake.first_name()
            last_name = fake.last_name()
            name = f"{first_name} {last_name}"
            username = f"{self.demo_prefix.lower()}student{i + 1:03d}"
            email = f"{username}@sims.edu"
            password = self.DEMO_PASSWORD_SUFFIX

            # Assign to group (round-robin)
            group = groups[i % len(groups)] if groups else None

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

            dob = fake.date_of_birth(minimum_age=18, maximum_age=25)
            # Generate phone number in Pakistan format (13 chars: +92 + 10 digits)
            phone = fake.numerify(text='+92##########')

            # Create admissions student record
            admissions_student, _ = Student.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": name,
                    "program": program,
                    "batch_year": current_year + self.DEFAULT_GRADUATING_YEARS_AHEAD,
                    "current_year": 1,
                    "status": Student.STATUS_ACTIVE,
                    "email": email,
                    "phone": phone,
                    "date_of_birth": dob,
                },
            )

            # Create students student record (for attendance/results)
            students_student, _ = StudentsStudent.objects.get_or_create(
                reg_no=reg_no,
                defaults={
                    "name": name,
                    "program": program,
                    "batch": batch,
                    "group": group,
                    "status": StudentsStudent.STATUS_ACTIVE,
                    "email": email,
                    "phone": phone,
                    "date_of_birth": dob,
                },
            )

            # Return students.Student instances for use in attendance/results
            students.append(students_student)
            student_logins.append(
                {
                    "reg_no": reg_no,
                    "name": name,
                    "username": username,
                    "email": email,
                    "password": password,
                }
            )

        self.log(f"  ✓ Created {len(students)} demo students")
        return students, student_logins

    def enroll_students_in_sections(self, students, sections, term_name):
        """Enroll students in sections"""
        enrollments = []

        # Import admissions.Student for enrollment
        from sims_backend.admissions.models import Student as AdmissionsStudent

        for i, student in enumerate(students):
            # Find matching admissions student
            admissions_student = AdmissionsStudent.objects.filter(
                reg_no=student.reg_no
            ).first()

            if not admissions_student:
                # Create admissions student if doesn't exist
                current_year = date.today().year
                admissions_student = AdmissionsStudent.objects.create(
                    reg_no=student.reg_no,
                    name=student.name,
                    program=student.program,
                    batch_year=getattr(student.batch, 'start_year', current_year + 5),
                    current_year=1,
                    status=AdmissionsStudent.STATUS_ACTIVE,
                    email=student.email,
                    phone=getattr(student, 'phone', ''),
                    date_of_birth=getattr(student, 'date_of_birth', None),
                )

            # Enroll in 1-2 sections
            num_sections = 1 if i % 3 == 0 else 2
            selected_sections = random.sample(sections, min(num_sections, len(sections)))

            for section in selected_sections:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=admissions_student,
                    section=section,
                    defaults={
                        "term": term_name,
                        "status": "enrolled",
                    },
                )
                if created:
                    enrollments.append(enrollment)

        self.log(f"  ✓ Created {len(enrollments)} enrollments")
        return enrollments

    def create_attendance_records(self, students, sessions, attendance_percentage):
        """Create attendance records for students"""
        attendance_records = []

        for student in students:
            for session in sessions:
                # Determine status based on desired percentage
                is_present = random.random() < (attendance_percentage / 100.0)
                status = Attendance.STATUS_PRESENT if is_present else Attendance.STATUS_ABSENT

                attendance, created = Attendance.objects.get_or_create(
                    session=session,
                    student=student,
                    defaults={
                        "status": status,
                        "marked_by": session.faculty,
                    },
                )
                if created:
                    attendance_records.append(attendance)

        return attendance_records

    def create_assessment_scores(self, students, sections, score_range=(60, 95)):
        """Create assessment scores for students"""
        scores = []

        # Get student registration numbers for filtering
        student_reg_nos = [student.reg_no for student in students]

        for section in sections:
            # Create assessments for each section
            quiz, _ = Assessment.objects.get_or_create(
                section=section,
                type="Quiz",
                defaults={"weight": 10},
            )
            midterm, _ = Assessment.objects.get_or_create(
                section=section,
                type="Midterm",
                defaults={"weight": 30},
            )

            # Get all enrollments for this section with related students
            enrollments = Enrollment.objects.filter(
                section=section, student__reg_no__in=student_reg_nos
            ).select_related('student')

            # Create scores for enrolled students
            for enrollment in enrollments:
                # Quiz score
                score_val = random.uniform(*score_range)
                quiz_score, created = AssessmentScore.objects.get_or_create(
                    assessment=quiz,
                    student=enrollment.student,
                    defaults={"score": score_val, "max_score": 100},
                )
                if created:
                    scores.append(quiz_score)

        return scores

    def create_exam_and_results(self, students, academic_period, department, status):
        """Create exam and result headers for students"""
        results = []

        # Create exam
        exam, _ = Exam.objects.get_or_create(
            academic_period=academic_period,
            department=department,
            title=f"{self.demo_prefix}Midterm Exam",
            defaults={
                "exam_type": "Midterm",
                "passing_mode": Exam.PASSING_MODE_TOTAL_ONLY,
                "pass_total_percent": Decimal("50.00"),
                "published": True,
            },
        )

        # Create exam components
        written, _ = ExamComponent.objects.get_or_create(
            exam=exam,
            name="Written",
            defaults={
                "sequence": 1,
                "max_marks": Decimal("100.00"),
                "pass_marks": Decimal("50.00"),
            },
        )

        # Create results for students
        for student in students:
            marks = random.uniform(50, 95)
            result, created = ResultHeader.objects.get_or_create(
                exam=exam,
                student=student,
                defaults={
                    "total_obtained": Decimal(str(marks)),
                    "total_max": Decimal("100.00"),
                    "final_outcome": (
                        ResultHeader.OUTCOME_PASS
                        if marks >= 50
                        else ResultHeader.OUTCOME_FAIL
                    ),
                    "status": status,
                },
            )
            if created:
                results.append(result)

                # Create component entry
                ResultComponentEntry.objects.get_or_create(
                    result_header=result,
                    exam_component=written,
                    defaults={
                        "marks_obtained": Decimal(str(marks)),
                        "component_outcome": (
                            ResultComponentEntry.OUTCOME_PASS
                            if marks >= 50
                            else ResultComponentEntry.OUTCOME_FAIL
                        ),
                    },
                )

        return results

    def create_fee_voucher(self, student, academic_period):
        """Create a fee voucher (challan) for a student"""
        # Create charge
        charge, _ = Charge.objects.get_or_create(
            title=f"{self.demo_prefix}Tuition Fee",
            due_date=date.today() + timedelta(days=30),
            academic_period=academic_period,
            defaults={"amount": Decimal("50000.00")},
        )

        # Create ledger item
        ledger_item, _ = StudentLedgerItem.objects.get_or_create(
            student=student,
            charge=charge,
            defaults={"status": StudentLedgerItem.STATUS_PENDING},
        )

        # Create challan
        challan_no = f"{self.demo_prefix}CH-{student.reg_no}-001"
        challan, created = Challan.objects.get_or_create(
            challan_no=challan_no,
            defaults={
                "student": student,
                "ledger_item": ledger_item,
                "amount_total": charge.amount,
                "status": Challan.STATUS_PENDING,
            },
        )

        return challan if created else None

    def create_sessions_for_period(self, academic_period, groups, faculty_users, departments, num_sessions=5):
        """Create timetable sessions"""
        sessions = []
        start_date = academic_period.start_date or date.today()

        for i in range(num_sessions):
            session_date = start_date + timedelta(days=i * 2)
            start_time = timezone.make_aware(datetime.combine(session_date, time(hour=9, minute=0)))
            end_time = timezone.make_aware(datetime.combine(session_date, time(hour=11, minute=0)))

            # Rotate through groups, faculty, and departments
            group = groups[i % len(groups)]
            faculty = faculty_users[i % len(faculty_users)]
            department = departments[i % len(departments)]

            session, created = Session.objects.get_or_create(
                academic_period=academic_period,
                group=group,
                faculty=faculty,
                department=department,
                starts_at=start_time,
                ends_at=end_time,
            )
            if created:
                sessions.append(session)

        return sessions

    def delete_demo_objects(self):
        """Delete all objects created by this demo generator

        Note: This method deletes objects in dependency order to avoid
        ProtectedError. If demo objects are referenced by non-demo objects,
        deletion will fail and an error will be logged.
        """
        self.log("Deleting demo objects...")

        from django.db.models.deletion import ProtectedError

        try:
            # Delete in reverse dependency order
            # First delete attendance which references students
            Attendance.objects.filter(student__reg_no__startswith=self.demo_prefix).delete()

            # Delete enrollment which references students and sections
            Enrollment.objects.filter(student__reg_no__startswith=self.demo_prefix).delete()

            # Delete results and exams
            ResultComponentEntry.objects.filter(
                result_header__exam__title__startswith=self.demo_prefix
            ).delete()
            ResultHeader.objects.filter(exam__title__startswith=self.demo_prefix).delete()
            ExamComponent.objects.filter(exam__title__startswith=self.demo_prefix).delete()
            Exam.objects.filter(title__startswith=self.demo_prefix).delete()

            # Delete finance records
            Challan.objects.filter(challan_no__startswith=self.demo_prefix).delete()
            StudentLedgerItem.objects.filter(student__reg_no__startswith=self.demo_prefix).delete()
            Charge.objects.filter(title__startswith=self.demo_prefix).delete()

            # Delete assessments
            AssessmentScore.objects.filter(student__reg_no__startswith=self.demo_prefix).delete()
            Assessment.objects.filter(section__name__startswith=self.demo_prefix).delete()

            # Delete sessions before faculty users (to avoid protected foreign key error)
            # Only delete sessions where faculty is a demo user
            demo_faculty_usernames = [
                f"{self.demo_prefix.lower()}faculty{i}" for i in range(1, 10)
            ]
            Session.objects.filter(faculty__username__in=demo_faculty_usernames).delete()

            # Delete sections and courses
            Section.objects.filter(name__startswith=self.demo_prefix).delete()
            Course.objects.filter(code__startswith=self.demo_prefix).delete()

            # Now safe to delete students (both models)
            from sims_backend.students.models import Student as StudentsStudent
            StudentsStudent.objects.filter(reg_no__startswith=self.demo_prefix).delete()
            Student.objects.filter(reg_no__startswith=self.demo_prefix).delete()

            # Finally delete users - only delete those with demo prefix
            User.objects.filter(username__in=demo_faculty_usernames).delete()
            demo_student_usernames = User.objects.filter(
                username__startswith=f"{self.demo_prefix.lower()}student"
            )
            demo_student_usernames.delete()

            self.log("  ✓ Demo objects deleted")

        except ProtectedError as e:
            self.log(
                f"  ⚠️  Warning: Some demo objects could not be deleted because "
                f"they are referenced by non-demo objects: {e}"
            )
            raise
        except Exception as e:
            self.log(f"  ❌ Error deleting demo objects: {e}")
            raise
