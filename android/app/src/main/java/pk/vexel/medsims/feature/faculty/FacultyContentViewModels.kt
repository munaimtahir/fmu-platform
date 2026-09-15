package pk.vexel.medsims.feature.faculty

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.faculty.FacultyDataSource
import pk.vexel.medsims.core.network.*

data class FacultyGradebookState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val results: List<FacultyResultDto> = emptyList(),
    val exams: List<FacultyExamDto> = emptyList(),
    val students: List<FacultyStudentDto> = emptyList(),
    val sections: List<FacultySectionDto> = emptyList(),
    val resultNextPage: Int? = null,
    val examNextPage: Int? = null,
    val studentNextPage: Int? = null,
    val search: String = "",
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel
class FacultyGradebookViewModel @Inject constructor(private val repository: FacultyDataSource) : ViewModel() {
    private val _state = MutableStateFlow(FacultyGradebookState())
    val state = _state.asStateFlow()

    fun load(search: String = _state.value.search) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, search = search, error = null, message = null)
        val results = repository.gradebook(search)
        val exams = repository.exams()
        val students = repository.students()
        val sections = repository.sections()
        val failure = listOf(results, exams, students, sections).filterIsInstance<NetworkResult.Failure>().firstOrNull()
        if (failure != null) {
            _state.value = _state.value.copy(loading = false, error = failure.message)
            return@launch
        }
        val resultPage = (results as NetworkResult.Success<PaginatedResponse<FacultyResultDto>>).value
        val examPage = (exams as NetworkResult.Success<PaginatedResponse<FacultyExamDto>>).value
        val studentPage = (students as NetworkResult.Success<PaginatedResponse<FacultyStudentDto>>).value
        val sectionPage = (sections as NetworkResult.Success<PaginatedResponse<FacultySectionDto>>).value
        _state.value = _state.value.copy(
            loading = false,
            results = resultPage.results,
            exams = examPage.results,
            students = studentPage.results,
            sections = sectionPage.results,
            resultNextPage = nextPage(resultPage.next),
            examNextPage = nextPage(examPage.next),
            studentNextPage = nextPage(studentPage.next),
        )
    }

    fun search(value: String) { load(value.trim()) }

    fun loadMoreResults() = viewModelScope.launch {
        val page = _state.value.resultNextPage ?: return@launch
        when (val response = repository.gradebook(_state.value.search, page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                results = (_state.value.results + response.value.results).distinctBy { it.id },
                resultNextPage = nextPage(response.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }

    fun loadMoreExams() = viewModelScope.launch {
        val page = _state.value.examNextPage ?: return@launch
        when (val response = repository.exams(page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                exams = (_state.value.exams + response.value.results).distinctBy { it.id },
                examNextPage = nextPage(response.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }

    fun loadMoreStudents() = viewModelScope.launch {
        val page = _state.value.studentNextPage ?: return@launch
        when (val response = repository.students(page = page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                students = (_state.value.students + response.value.results).distinctBy { it.id },
                studentNextPage = nextPage(response.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }

    fun save(
        existing: FacultyResultDto?,
        examId: Long,
        studentId: Long,
        totalObtained: String,
        totalMax: String,
        marks: Map<Long, String>,
    ) = viewModelScope.launch {
        val validation = validateMarks(examId, totalObtained, totalMax, marks)
        if (validation != null) {
            _state.value = _state.value.copy(error = validation)
            return@launch
        }
        if (existing != null && existing.status != "DRAFT") {
            _state.value = _state.value.copy(error = "Only draft results can be edited.")
            return@launch
        }
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        val header = if (existing == null) {
            repository.createResult(FacultyResultWriteRequest(examId, studentId, totalObtained, totalMax))
        } else {
            repository.updateResult(existing.id, FacultyResultUpdateRequest(totalObtained, totalMax))
        }
        if (header is NetworkResult.Failure) {
            _state.value = _state.value.copy(busy = false, error = header.message)
            return@launch
        }
        val saved = (header as NetworkResult.Success).value
        val prior = existing?.component_entries.orEmpty().associateBy { it.exam_component }
        for ((componentId, value) in marks.filterValues { it.isNotBlank() }) {
            val response = prior[componentId]?.let {
                repository.updateComponent(it.id, FacultyComponentWriteRequest(marks_obtained = value))
            } ?: repository.createComponent(FacultyComponentWriteRequest(saved.id, componentId, value))
            if (response is NetworkResult.Failure) {
                _state.value = _state.value.copy(
                    busy = false,
                    error = "The result header was saved, but one component failed: ${response.message}",
                )
                return@launch
            }
        }
        _state.value = _state.value.copy(busy = false, message = "Draft gradebook entry saved.")
        refreshKeepingMessage()
    }

    private fun validateMarks(examId: Long, obtained: String, maximum: String, marks: Map<Long, String>): String? {
        val obtainedNumber = obtained.toBigDecimalOrNull() ?: return "Enter a valid total obtained mark."
        val maximumNumber = maximum.toBigDecimalOrNull() ?: return "Enter a valid total maximum mark."
        if (obtainedNumber < java.math.BigDecimal.ZERO || maximumNumber <= java.math.BigDecimal.ZERO || obtainedNumber > maximumNumber) {
            return "Total obtained must be between zero and the total maximum."
        }
        val components = _state.value.exams.firstOrNull { it.id == examId }?.components.orEmpty().associateBy { it.id }
        for ((id, value) in marks.filterValues { it.isNotBlank() }) {
            val number = value.toBigDecimalOrNull() ?: return "Enter valid component marks."
            val max = components[id]?.max_marks?.toBigDecimalOrNull()
            if (number < java.math.BigDecimal.ZERO || (max != null && number > max)) return "Component marks must be within their maximum."
        }
        return null
    }

    private suspend fun refreshKeepingMessage() {
        val message = _state.value.message
        when (val response = repository.gradebook(_state.value.search)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                results = response.value.results,
                resultNextPage = nextPage(response.value.next),
                message = message,
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }
}

data class FacultyMaterialsState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val materials: List<LearningMaterialDto> = emptyList(),
    val sections: List<FacultySectionDto> = emptyList(),
    val materialNextPage: Int? = null,
    val sectionNextPage: Int? = null,
    val search: String = "",
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel
class FacultyMaterialsViewModel @Inject constructor(private val repository: FacultyDataSource) : ViewModel() {
    private val _state = MutableStateFlow(FacultyMaterialsState())
    val state = _state.asStateFlow()

    fun load(search: String = _state.value.search) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, search = search, error = null, message = null)
        val materials = repository.materials(search)
        val sections = repository.sections()
        if (materials is NetworkResult.Failure || sections is NetworkResult.Failure) {
            val failure = (materials as? NetworkResult.Failure) ?: sections as NetworkResult.Failure
            _state.value = _state.value.copy(loading = false, error = failure.message)
            return@launch
        }
        val materialPage = (materials as NetworkResult.Success<PaginatedResponse<LearningMaterialDto>>).value
        val sectionPage = (sections as NetworkResult.Success<PaginatedResponse<FacultySectionDto>>).value
        _state.value = _state.value.copy(
            loading = false,
            materials = materialPage.results,
            sections = sectionPage.results,
            materialNextPage = nextPage(materialPage.next),
            sectionNextPage = nextPage(sectionPage.next),
        )
    }

    fun search(value: String) { load(value.trim()) }

    fun loadMoreMaterials() = viewModelScope.launch {
        val page = _state.value.materialNextPage ?: return@launch
        when (val response = repository.materials(_state.value.search, page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                materials = (_state.value.materials + response.value.results).distinctBy { it.id },
                materialNextPage = nextPage(response.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }

    fun loadMoreSections() = viewModelScope.launch {
        val page = _state.value.sectionNextPage ?: return@launch
        when (val response = repository.sections(page)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                sections = (_state.value.sections + response.value.results).distinctBy { it.id },
                sectionNextPage = nextPage(response.value.next),
            )
            is NetworkResult.Failure -> _state.value = _state.value.copy(error = response.message)
        }
    }

    fun create(
        title: String,
        description: String,
        url: String,
        document: PickedDocument?,
        sectionId: Long?,
        availableFrom: String,
        availableUntil: String,
    ) = viewModelScope.launch {
        if (title.isBlank()) return@launch fail("Title is required.")
        if (sectionId == null) return@launch fail("Choose one of your teaching sections.")
        if (document == null && !isHttpUrl(url)) return@launch fail("Enter a valid http or https link, or choose a file.")
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        val material = if (document != null) {
            repository.createFileMaterial(document, title.trim(), description.trim(), availableFrom.clean(), availableUntil.clean())
        } else {
            repository.createLinkMaterial(
                FacultyMaterialLinkRequest(title.trim(), description.trim(), url = url.trim(), available_from = availableFrom.clean(), available_until = availableUntil.clean())
            )
        }
        if (material is NetworkResult.Failure) return@launch finishFailure(material.message)
        val created = (material as NetworkResult.Success).value
        when (val audience = repository.addAudience(created.id, sectionId)) {
            is NetworkResult.Failure -> finishFailure("Draft created, but its audience was not saved: ${audience.message}")
            is NetworkResult.Success -> refresh("Draft material and section audience saved.")
        }
    }

    fun update(material: LearningMaterialDto, title: String, description: String, url: String, from: String, until: String) = viewModelScope.launch {
        if (material.status != "DRAFT") return@launch fail("Only draft materials can be edited.")
        if (title.isBlank()) return@launch fail("Title is required.")
        if (material.kind == "LINK" && !isHttpUrl(url)) return@launch fail("Enter a valid http or https link.")
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        val request = FacultyMaterialUpdateRequest(title.trim(), description.trim(), url.takeIf { material.kind == "LINK" }?.trim(), from.clean(), until.clean())
        when (val response = repository.updateMaterial(material.id, request)) {
            is NetworkResult.Failure -> finishFailure(response.message)
            is NetworkResult.Success -> refresh("Draft material updated.")
        }
    }

    fun publish(material: LearningMaterialDto) = action(material, "published") { repository.publishMaterial(material.id) }
    fun archive(material: LearningMaterialDto) = action(material, "archived") { repository.archiveMaterial(material.id) }

    fun delete(material: LearningMaterialDto) = viewModelScope.launch {
        if (material.status != "DRAFT") return@launch fail("Only draft materials can be deleted.")
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        when (val response = repository.deleteMaterial(material.id)) {
            is NetworkResult.Failure -> finishFailure(response.message)
            is NetworkResult.Success -> refresh("Draft material deleted.")
        }
    }

    fun addAudience(materialId: Long, sectionId: Long?) = viewModelScope.launch {
        if (sectionId == null) return@launch fail("Choose one of your teaching sections.")
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        when (val response = repository.addAudience(materialId, sectionId)) {
            is NetworkResult.Failure -> finishFailure(response.message)
            is NetworkResult.Success -> refresh("Section audience added.")
        }
    }

    fun deleteAudience(id: Long) = viewModelScope.launch {
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        when (val response = repository.deleteAudience(id)) {
            is NetworkResult.Failure -> finishFailure(response.message)
            is NetworkResult.Success -> refresh("Section audience removed.")
        }
    }

    private fun action(material: LearningMaterialDto, verb: String, call: suspend () -> NetworkResult<LearningMaterialDto>) = viewModelScope.launch {
        if (verb == "published" && material.audiences.isEmpty()) return@launch fail("Add a section audience before publishing.")
        _state.value = _state.value.copy(busy = true, error = null, message = null)
        when (val response = call()) {
            is NetworkResult.Failure -> finishFailure(response.message)
            is NetworkResult.Success -> refresh("Material $verb.")
        }
    }

    private suspend fun refresh(message: String) {
        when (val response = repository.materials(_state.value.search)) {
            is NetworkResult.Success -> _state.value = _state.value.copy(
                busy = false,
                materials = response.value.results,
                materialNextPage = nextPage(response.value.next),
                message = message,
            )
            is NetworkResult.Failure -> finishFailure(response.message)
        }
    }

    private fun fail(message: String) { _state.value = _state.value.copy(error = message) }
    private fun finishFailure(message: String) { _state.value = _state.value.copy(busy = false, error = message) }
    private fun String.clean() = trim().takeIf { it.isNotEmpty() }
    private fun isHttpUrl(value: String) = value.trim().let { it.startsWith("https://") || it.startsWith("http://") }
}

private fun nextPage(next: String?): Int? = next?.substringAfter("page=", "")?.substringBefore('&')?.toIntOrNull()
