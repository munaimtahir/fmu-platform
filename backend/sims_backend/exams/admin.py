from django.contrib import admin

from sims_backend.exams.models import Exam, ExamComponent


class ExamComponentInline(admin.TabularInline):
    model = ExamComponent
    extra = 0
    fields = ['name', 'sequence', 'department', 'max_marks', 'pass_marks', 'pass_percent', 'is_mandatory_to_pass']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'academic_period', 'department', 'exam_type', 'scheduled_at', 'published']
    list_filter = ['published', 'passing_mode', 'academic_period', 'department']
    search_fields = ['title', 'exam_type']
    ordering = ['-scheduled_at', 'title']
    inlines = [ExamComponentInline]


@admin.register(ExamComponent)
class ExamComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'exam', 'sequence', 'max_marks', 'is_mandatory_to_pass']
    list_filter = ['exam', 'is_mandatory_to_pass']
    search_fields = ['name', 'exam__title']
    ordering = ['exam', 'sequence']

