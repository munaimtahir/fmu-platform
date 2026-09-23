"""Create a deterministic, end-to-end demonstration baseline.

The command deliberately uses the student provisioning service.  It is safe to
run repeatedly; ``--reset --confirm-reset`` is the only supported way to clear
an environment before recreating the complete baseline.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.rbac_catalog import seed_rbac_catalog
from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group as AcademicGroup, Program, Section
from sims_backend.attendance.models import Attendance, AttendanceInputJob, BiometricDevice, BiometricPunch
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementScope, RequirementSubmission
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.finance.models import Adjustment, FeePlan, FeeType, FinancePolicy, LedgerEntry, Payment, Voucher, VoucherItem
from sims_backend.learning.models import LearningMaterial, LearningMaterialAudience, LearningMaterialReadReceipt
from sims_backend.notifications.models import Notification, NotificationAudience, NotificationDeliveryLog, NotificationInbox
from sims_backend.people.models import Address, EmergencyContact, Person
from sims_backend.results.models import ResultComponentEntry, ResultCorrectionRequest, ResultHeader
from sims_backend.students.imports.models import ImportJob
from sims_backend.students.models import Student
from sims_backend.students.onboarding import ProvisioningData, provision_student
from sims_backend.syllabus.models import SyllabusItem
from sims_backend.timetable.models import Session, TimetableEntry, WeeklyTimetable

User = get_user_model()
DEMO_PREFIX = "DEMO_"
ROLE_NAMES = ("ADMIN", "REGISTRAR", "EXAMCELL", "COORDINATOR", "FACULTY", "FINANCE", "STUDENT", "OFFICE_ASSISTANT")
ROLE_ACCOUNTS = {
    "ADMIN": ("admin", "admin123"),
    "REGISTRAR": ("registrar", "registrar123"),
    "EXAMCELL": ("examcell", "examcell123"),
    "COORDINATOR": ("coordinator", "coordinator123"),
    "FACULTY": ("faculty", "faculty123"),
    "FINANCE": ("finance", "finance123"),
    "OFFICE_ASSISTANT": ("office", "office123"),
}


class Command(BaseCommand):
    help = "Seed a deterministic end-to-end live demonstration baseline."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Flush the disposable database before seeding.")
        parser.add_argument("--confirm-reset", action="store_true", help="Required with --reset.")

    def handle(self, *args, **options):
        if options["confirm_reset"] and not options["reset"]:
            raise CommandError("--confirm-reset is only valid with --reset")
        if options["reset"]:
            if not options["confirm_reset"]:
                raise CommandError("Refusing to clear data without --confirm-reset")
            self.stdout.write(self.style.WARNING("Flushing disposable database data..."))
            call_command("flush", interactive=False, verbosity=options["verbosity"])

        with transaction.atomic():
            call_command("create_role_groups", verbosity=0)
            from django.apps import apps

            seed_rbac_catalog(apps)
            users = self._users()
            structure = self._academic_structure(users)
            requirements = self._requirements(structure)
            students = self._students(structure, users)
            self._complete_profiles(students)
            self._compliance(students, requirements)
            self._timetable_and_attendance(structure, users, students)
            self._learning(structure, users, students)
            self._results(structure, users, students)
            self._finance(structure, users, students)
            self._notifications(structure, users, students)
            self._syllabus(structure)

        self.stdout.write(self.style.SUCCESS("Live demo baseline is ready."))
        self.stdout.write("Seeded 20 students across four onboarding states and at least five records in each user-facing workflow.")
        self.stdout.write("Demo logins: admin/admin123, faculty/faculty123, student/student123, finance/finance123")

    def _users(self):
        users = {}
        for role, (username, password) in ROLE_ACCOUNTS.items():
            user, _ = User.objects.get_or_create(username=username, defaults={"email": f"{username}@demo.invalid"})
            user.email = f"{username}@demo.invalid"
            user.is_staff = role == "ADMIN"
            user.is_superuser = role == "ADMIN"
            user.set_password(password)
            user.save()
            user.groups.set([Group.objects.get(name=role)])
            users[role] = user
        return users

    def _academic_structure(self, users):
        today = timezone.localdate()
        programs, batches, groups, periods, departments, courses, sections = [], [], [], [], [], [], []
        names = [("DEMO_MBBS", "MBBS"), ("DEMO_BDS", "BDS"), ("DEMO_DPT", "Doctor of Physical Therapy"), ("DEMO_PHARMD", "Pharm.D"), ("DEMO_NURSING", "BS Nursing")]
        for index, (code, label) in enumerate(names, 1):
            program, _ = Program.objects.get_or_create(name=code, defaults={"description": f"Demonstration {label} program"})
            batch, _ = Batch.objects.get_or_create(program=program, name="DEMO 2026 Cohort", defaults={"start_year": 2031 + index})
            group, _ = AcademicGroup.objects.get_or_create(batch=batch, name="DEMO Group A")
            period, _ = AcademicPeriod.objects.get_or_create(
                name=f"DEMO {label} Block 1", period_type=AcademicPeriod.PERIOD_TYPE_BLOCK,
                defaults={"start_date": today - timedelta(days=21), "end_date": today + timedelta(days=90), "status": AcademicPeriod.STATUS_OPEN},
            )
            department, _ = Department.objects.get_or_create(name=f"DEMO {label} Sciences", parent=None, defaults={"code": f"D{index:02d}"})
            course, _ = Course.objects.get_or_create(
                code=f"DEMO-{index:02d}-101", defaults={"name": f"DEMO {label} Foundations", "department": department, "academic_period": period, "credits": 3}
            )
            section, _ = Section.objects.get_or_create(
                course=course, academic_period=period, name="DEMO Section A",
                defaults={"faculty": users["FACULTY"], "group": group, "capacity": 40},
            )
            programs.append(program); batches.append(batch); groups.append(group); periods.append(period); departments.append(department); courses.append(course); sections.append(section)
        return {"programs": programs, "batches": batches, "groups": groups, "periods": periods, "departments": departments, "courses": courses, "sections": sections}

    def _requirements(self, structure):
        definitions = []
        labels = ["Identity document", "Previous education certificate", "Immunization record", "Emergency contact verification", "Fee undertaking"]
        for index, label in enumerate(labels):
            definition, _ = RequirementDefinition.objects.get_or_create(title=f"DEMO {label}", defaults={"description": f"Synthetic {label.lower()} for live demonstration", "is_onboarding_required": True})
            if index == 0:
                RequirementScope.objects.get_or_create(definition=definition, scope_type=RequirementScope.SCOPE_GLOBAL)
            else:
                RequirementScope.objects.get_or_create(definition=definition, scope_type=RequirementScope.SCOPE_PROGRAM, program=structure["programs"][index])
            definitions.append(definition)
        return definitions

    def _students(self, structure, users):
        students = []
        states = ("PASSWORD_REQUIRED", "PROFILE_INCOMPLETE", "DOCUMENTS_PENDING", "COMPLETE")
        for state_index, state in enumerate(states):
            job, _ = ImportJob.objects.get_or_create(
                original_filename=f"demo-{state.lower()}.csv", created_by=users["REGISTRAR"],
                defaults={"file_hash": f"{state_index:064x}", "expires_at": timezone.now() + timedelta(days=30), "status": ImportJob.STATUS_COMMITTED, "total_rows": 5, "valid_rows": 5, "created_count": 5, "finished_at": timezone.now(), "summary": {"demo_state": state, "password_redacted": True}},
            )
            for number in range(1, 6):
                program = structure["programs"][(state_index + number - 1) % len(structure["programs"])]
                position = structure["programs"].index(program)
                reg_no = "STUDENT" if state == "COMPLETE" and number == 1 else f"DEMO-{state_index + 1}-{number:03d}"
                student = Student.objects.filter(reg_no=reg_no).select_related("person", "user").first()
                if not student:
                    student = provision_student(
                        ProvisioningData(registration_number=reg_no, first_name="Student" if reg_no == "STUDENT" else f"Demo{state_index + 1}", last_name="Demo" if reg_no == "STUDENT" else f"Student{number}", initial_password="DemoSeedPass!2026", program=program, batch=structure["batches"][position], group=structure["groups"][position], email=f"{reg_no.lower()}@demo.invalid", mobile_number=f"+9230000{state_index}{number:03d}"),
                        actor=users["REGISTRAR"], import_job_id=str(job.id),
                    )
                # The requested public demo credential intentionally bypasses
                # normal-password similarity validation only after canonical
                # provisioning has completed.  It is limited to this
                # disposable, tagged account and is reset on every seed run.
                if reg_no == "STUDENT":
                    student.user.set_password("student123")
                    student.user.save(update_fields=["password"])
                students.append((state, student))
        return students

    def _complete_profiles(self, students):
        for state, student in students:
            if state == "PASSWORD_REQUIRED":
                continue
            student.password_change_required = False
            student.save(update_fields=["password_change_required", "updated_at"])
            if state == "PROFILE_INCOMPLETE":
                continue
            person = student.person
            person.date_of_birth = date(2004, 1, min(student.id % 26 + 1, 28))
            person.gender = Person.GENDER_FEMALE if student.id % 2 else Person.GENDER_MALE
            person.save(update_fields=["date_of_birth", "gender", "updated_at"])
            Address.objects.get_or_create(person=person, type=Address.TYPE_PERMANENT, defaults={"street": "DEMO Medical Campus Road", "city": "Lahore", "country": "Pakistan", "is_primary": True})
            EmergencyContact.objects.get_or_create(person=person, defaults={"name": "Demo Guardian", "phone": "+923001234567", "relationship": "Parent"})

    def _compliance(self, students, definitions):
        for state, student in students:
            instances = list(student.compliance_requirements.select_related("definition"))
            if state == "COMPLETE":
                for instance in instances:
                    instance.status = RequirementInstance.STATUS_VERIFIED
                    instance.notes = "Verified demonstration document"
                    instance.save(update_fields=["status", "notes", "updated_at"])
                    RequirementSubmission.objects.get_or_create(instance=instance, submitted_by=student.user, defaults={"original_filename": "demo-verification.txt", "value": "Synthetic verification"})
            elif state == "DOCUMENTS_PENDING" and instances:
                instance = instances[0]
                instance.status = RequirementInstance.STATUS_SUBMITTED
                instance.save(update_fields=["status", "updated_at"])
                RequirementSubmission.objects.get_or_create(instance=instance, submitted_by=student.user, defaults={"original_filename": "demo-submission.txt", "value": "Synthetic submission"})

    def _timetable_and_attendance(self, structure, users, students):
        today = timezone.localdate(); monday = today - timedelta(days=today.weekday())
        student_rows = [student for _, student in students]
        for index in range(5):
            batch, period, section, group, department = (structure[key][index] for key in ("batches", "periods", "sections", "groups", "departments"))
            weekly, _ = WeeklyTimetable.objects.get_or_create(academic_period=period, batch=batch, week_start_date=monday - timedelta(weeks=index), defaults={"status": "published", "created_by": users["COORDINATOR"]})
            TimetableEntry.objects.get_or_create(weekly_timetable=weekly, section=section, day_of_week=index, start_time=time(9, 0), defaults={"end_time": time(10, 30), "group": group, "room": f"DEMO-{index + 1}", "status": TimetableEntry.STATUS_COMPLETED, "created_by": users["COORDINATOR"]})
            session, _ = Session.objects.get_or_create(academic_period=period, group=group, department=department, starts_at=timezone.make_aware(datetime.combine(monday - timedelta(days=index + 1), time(9, 0))), defaults={"ends_at": timezone.make_aware(datetime.combine(monday - timedelta(days=index + 1), time(10, 30))), "faculty": users["FACULTY"]})
            AttendanceInputJob.objects.get_or_create(session=session, input_type=AttendanceInputJob.TYPE_CSV if index % 2 else AttendanceInputJob.TYPE_SHEET, defaults={"date": session.starts_at.date(), "uploaded_by": users["OFFICE_ASSISTANT"], "status": AttendanceInputJob.STATUS_COMMITTED, "original_filename": f"demo-attendance-{index + 1}.csv", "summary": {"demo": True}})
            for student in student_rows[index * 4:(index + 1) * 4]:
                Attendance.objects.get_or_create(session=session, student=student, defaults={"status": [Attendance.STATUS_PRESENT, Attendance.STATUS_LATE, Attendance.STATUS_ABSENT, Attendance.STATUS_PRESENT][student.id % 4], "marked_by": users["FACULTY"]})
        device, _ = BiometricDevice.objects.get_or_create(name="DEMO Main Gate", defaults={"location": "Demonstration campus"})
        for student in student_rows[:5]:
            BiometricPunch.objects.get_or_create(device=device, student=student, raw_identifier=student.reg_no)

    def _learning(self, structure, users, students):
        for index in range(5):
            material, _ = LearningMaterial.objects.get_or_create(title=f"DEMO Learning Resource {index + 1}", defaults={"description": "Synthetic material for the live walkthrough", "kind": LearningMaterial.KIND_LINK, "url": f"https://example.invalid/demo-learning-{index + 1}", "status": LearningMaterial.STATUS_PUBLISHED, "published_at": timezone.now(), "created_by": users["FACULTY"]})
            LearningMaterialAudience.objects.get_or_create(material=material, program=structure["programs"][index])
            for _, student in students[index * 4:index * 4 + 2]:
                LearningMaterialReadReceipt.objects.get_or_create(material=material, student=student)

    def _results(self, structure, users, students):
        statuses = [ResultHeader.STATUS_DRAFT, ResultHeader.STATUS_VERIFIED, ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN, ResultHeader.STATUS_PUBLISHED]
        rows = [student for _, student in students]
        for index in range(5):
            exam, _ = Exam.objects.get_or_create(academic_period=structure["periods"][index], title=f"DEMO Assessment {index + 1}", defaults={"department": structure["departments"][index], "exam_type": "Block assessment", "scheduled_at": timezone.now() - timedelta(days=index + 1), "published": True, "pass_total_marks": 50})
            component, _ = ExamComponent.objects.get_or_create(exam=exam, sequence=1, defaults={"name": "Written", "department": structure["departments"][index], "max_marks": 100, "pass_marks": 50, "is_mandatory_to_pass": True})
            for student in rows[index * 4:index * 4 + 4]:
                status = statuses[index]
                result, _ = ResultHeader.objects.get_or_create(exam=exam, student=student, defaults={"total_obtained": Decimal("70.00"), "total_max": Decimal("100.00"), "final_outcome": ResultHeader.OUTCOME_PASS, "status": status, "published_at": timezone.now() if status in (ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN) else None, "published_by": users["EXAMCELL"] if status in (ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN) else None, "frozen_at": timezone.now() if status == ResultHeader.STATUS_FROZEN else None, "frozen_by": users["EXAMCELL"] if status == ResultHeader.STATUS_FROZEN else None})
                ResultComponentEntry.objects.get_or_create(result_header=result, exam_component=component, defaults={"marks_obtained": Decimal("70.00"), "component_outcome": ResultComponentEntry.OUTCOME_PASS})
                if index == 4:
                    ResultCorrectionRequest.objects.get_or_create(result_header=result, defaults={"requested_by": users["FACULTY"], "reason": "Demonstration correction request", "proposed_changes": {"total_obtained": "72.00"}, "original_values": {"total_obtained": "70.00"}})

    def _finance(self, structure, users, students):
        rows = [student for _, student in students]
        for index in range(5):
            fee_type, _ = FeeType.objects.get_or_create(code=f"DEMO_FEE_{index + 1}", defaults={"name": f"DEMO Fee Type {index + 1}"})
            plan, _ = FeePlan.objects.get_or_create(program=structure["programs"][index], term=structure["periods"][index], fee_type=fee_type, defaults={"amount": Decimal("25000.00") + index * 1000, "frequency": FeePlan.FREQ_PER_TERM})
            FinancePolicy.objects.get_or_create(rule_key=f"DEMO_FINANCE_POLICY_{index + 1}", defaults={"description": "Demonstration finance policy", "threshold_amount": Decimal("10000.00"), "fee_type": fee_type})
            student = rows[index]
            statuses = [Voucher.STATUS_GENERATED, Voucher.STATUS_PARTIAL, Voucher.STATUS_PAID, Voucher.STATUS_OVERDUE, Voucher.STATUS_CANCELLED]
            voucher, _ = Voucher.objects.get_or_create(voucher_no=f"DEMO-V-{index + 1:03d}", defaults={"student": student, "term": structure["periods"][index], "status": statuses[index], "due_date": timezone.localdate() + timedelta(days=index - 3), "total_amount": plan.amount, "created_by": users["FINANCE"], "notes": "Synthetic demonstration voucher"})
            VoucherItem.objects.get_or_create(voucher=voucher, fee_type=fee_type, defaults={"amount": plan.amount, "description": "DEMO fee item"})
            LedgerEntry.objects.get_or_create(student=student, term=structure["periods"][index], reference_type=LedgerEntry.REF_VOUCHER, reference_id=voucher.voucher_no, defaults={"entry_type": LedgerEntry.ENTRY_DEBIT, "amount": plan.amount, "voucher": voucher, "created_by": users["FINANCE"], "description": "DEMO voucher debit"})
            if index in (1, 2):
                payment, _ = Payment.objects.get_or_create(receipt_no=f"DEMO-R-{index + 1:03d}", defaults={"student": student, "term": structure["periods"][index], "voucher": voucher, "amount": Decimal("10000.00") if index == 1 else plan.amount, "method": Payment.METHOD_ONLINE, "received_by": users["FINANCE"], "status": Payment.STATUS_VERIFIED})
                LedgerEntry.objects.get_or_create(student=student, term=structure["periods"][index], reference_type=LedgerEntry.REF_PAYMENT, reference_id=payment.receipt_no, defaults={"entry_type": LedgerEntry.ENTRY_CREDIT, "amount": payment.amount, "created_by": users["FINANCE"], "description": "DEMO payment credit"})
            Adjustment.objects.get_or_create(student=student, term=structure["periods"][index], kind=Adjustment.KIND_SCHOLARSHIP if index % 2 else Adjustment.KIND_WAIVER, defaults={"amount": Decimal("1500.00"), "reason": "DEMO adjustment", "requested_by": users["FINANCE"], "approved_by": users["FINANCE"] if index % 2 else None, "status": Adjustment.STATUS_APPROVED if index % 2 else Adjustment.STATUS_PENDING})

    def _notifications(self, structure, users, students):
        rows = [student for _, student in students]
        for index in range(5):
            notification, _ = Notification.objects.get_or_create(title=f"DEMO Announcement {index + 1}", defaults={"body": "Synthetic announcement for the live walkthrough.", "category": "DEMO", "priority": Notification.PRIORITY_HIGH if index == 0 else Notification.PRIORITY_NORMAL, "created_by": users["COORDINATOR"], "status": Notification.STATUS_SENT, "publish_at": timezone.now()})
            NotificationAudience.objects.get_or_create(notification=notification, audience_type=NotificationAudience.AUDIENCE_PROGRAM, program=structure["programs"][index])
            NotificationDeliveryLog.objects.get_or_create(notification=notification, channel=NotificationDeliveryLog.CHANNEL_IN_APP, defaults={"status": NotificationDeliveryLog.STATUS_SENT, "target_count": 4, "success_count": 4, "job_id": f"DEMO-N-{index + 1}"})
            for student in rows[index * 4:index * 4 + 4]:
                NotificationInbox.objects.get_or_create(notification=notification, user=student.user, defaults={"read_at": timezone.now() if student.id % 2 else None})

    def _syllabus(self, structure):
        for index, program in enumerate(structure["programs"], 1):
            SyllabusItem.objects.get_or_create(program=program, title=f"DEMO Syllabus Item {index}", defaults={"code": f"DEMO-SYL-{index}", "description": "Synthetic syllabus content", "learning_objectives": "Demonstrate the syllabus workflow", "order_no": index})
