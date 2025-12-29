from django.contrib import admin

from sims_backend.results.models import ResultHeader, ResultComponentEntry


class ResultComponentEntryInline(admin.TabularInline):
    model = ResultComponentEntry
    extra = 0
    fields = ['exam_component', 'marks_obtained', 'component_outcome']
    readonly_fields = ['component_outcome']


@admin.register(ResultHeader)
class ResultHeaderAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'total_obtained', 'total_max', 'final_outcome', 'status']
    list_filter = ['status', 'final_outcome', 'exam']
    search_fields = ['student__reg_no', 'student__name', 'exam__title']
    ordering = ['exam', 'student']
    inlines = [ResultComponentEntryInline]
    readonly_fields = ['final_outcome']


@admin.register(ResultComponentEntry)
class ResultComponentEntryAdmin(admin.ModelAdmin):
    list_display = ['result_header', 'exam_component', 'marks_obtained', 'component_outcome']
    list_filter = ['component_outcome']
    search_fields = ['result_header__student__reg_no', 'exam_component__name']
    ordering = ['result_header', 'exam_component__sequence']
    readonly_fields = ['component_outcome']

