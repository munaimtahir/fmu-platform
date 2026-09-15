package pk.vexel.medsims.core.faculty

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.document.DocumentStore
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

interface FacultyDataSource {
    suspend fun dashboard(): NetworkResult<FacultyDashboardDto>
    suspend fun sessions(page: Int? = null): NetworkResult<PaginatedResponse<FacultySessionDto>>
    suspend fun roster(sessionId: Long): NetworkResult<LiveRosterDto>
    suspend fun submit(request: LiveAttendanceRequest): NetworkResult<LiveAttendanceResultDto>
    suspend fun students(search: String? = null, page: Int? = null): NetworkResult<PaginatedResponse<FacultyStudentDto>>
    suspend fun exams(page: Int? = null): NetworkResult<PaginatedResponse<FacultyExamDto>>
    suspend fun gradebook(search: String? = null, page: Int? = null): NetworkResult<PaginatedResponse<FacultyResultDto>>
    suspend fun createResult(request: FacultyResultWriteRequest): NetworkResult<FacultyResultDto>
    suspend fun updateResult(id: Long, request: FacultyResultUpdateRequest): NetworkResult<FacultyResultDto>
    suspend fun createComponent(request: FacultyComponentWriteRequest): NetworkResult<FacultyResultComponentDto>
    suspend fun updateComponent(id: Long, request: FacultyComponentWriteRequest): NetworkResult<FacultyResultComponentDto>
    suspend fun deleteComponent(id: Long): NetworkResult<Unit>
    suspend fun sections(page: Int? = null): NetworkResult<PaginatedResponse<FacultySectionDto>>
    suspend fun materials(search: String? = null, page: Int? = null): NetworkResult<PaginatedResponse<LearningMaterialDto>>
    suspend fun createLinkMaterial(request: FacultyMaterialLinkRequest): NetworkResult<LearningMaterialDto>
    suspend fun createFileMaterial(document: PickedDocument, title: String, description: String, availableFrom: String?, availableUntil: String?): NetworkResult<LearningMaterialDto>
    suspend fun updateMaterial(id: Long, request: FacultyMaterialUpdateRequest): NetworkResult<LearningMaterialDto>
    suspend fun deleteMaterial(id: Long): NetworkResult<Unit>
    suspend fun publishMaterial(id: Long): NetworkResult<LearningMaterialDto>
    suspend fun archiveMaterial(id: Long): NetworkResult<LearningMaterialDto>
    suspend fun addAudience(materialId: Long, sectionId: Long): NetworkResult<List<LearningMaterialAudienceDto>>
    suspend fun deleteAudience(id: Long): NetworkResult<Unit>
}

/** Faculty writes are sent immediately; failed attendance is never queued or replayed. */
@Singleton class FacultyRepository @Inject constructor(
    private val api: FacultyApi,
    private val refresher: TokenRefresher,
    private val expiry: SessionExpiryNotifier,
    private val documents: DocumentStore,
): FacultyDataSource {
    override suspend fun dashboard() = call { api.dashboard() }
    override suspend fun sessions(page: Int?) = call { api.sessions(page = page) }
    override suspend fun roster(sessionId: Long) = call { api.roster(sessionId) }
    override suspend fun submit(request: LiveAttendanceRequest) = call { api.submitAttendance(request) }
    override suspend fun students(search: String?, page: Int?) = call { api.students(search?.takeIf(String::isNotBlank), page) }
    override suspend fun exams(page: Int?) = call { api.exams(page) }
    override suspend fun gradebook(search: String?, page: Int?) = call { api.gradebook(search?.takeIf(String::isNotBlank), page) }
    override suspend fun createResult(request: FacultyResultWriteRequest) = call { api.createResult(request) }
    override suspend fun updateResult(id: Long, request: FacultyResultUpdateRequest) = call { api.updateResult(id, request) }
    override suspend fun createComponent(request: FacultyComponentWriteRequest) = call { api.createResultComponent(request) }
    override suspend fun updateComponent(id: Long, request: FacultyComponentWriteRequest) = call { api.updateResultComponent(id, request) }
    override suspend fun deleteComponent(id: Long) = call { api.deleteResultComponent(id) }
    override suspend fun sections(page: Int?) = call { api.sections(page) }
    override suspend fun materials(search: String?, page: Int?) = call { api.materials(search?.takeIf(String::isNotBlank), page) }
    override suspend fun createLinkMaterial(request: FacultyMaterialLinkRequest) = call { api.createLinkMaterial(request) }
    override suspend fun createFileMaterial(document: PickedDocument, title: String, description: String, availableFrom: String?, availableUntil: String?): NetworkResult<LearningMaterialDto> {
        val textType = "text/plain".toMediaType()
        val file = MultipartBody.Part.createFormData("file", document.displayName, documents.requestBody(document))
        return call {
            api.createFileMaterial(
                file,
                title.toRequestBody(textType),
                description.toRequestBody(textType),
                "FILE".toRequestBody(textType),
                availableFrom?.takeIf(String::isNotBlank)?.toRequestBody(textType),
                availableUntil?.takeIf(String::isNotBlank)?.toRequestBody(textType),
            )
        }
    }
    override suspend fun updateMaterial(id: Long, request: FacultyMaterialUpdateRequest) = call { api.updateMaterial(id, request) }
    override suspend fun deleteMaterial(id: Long) = call { api.deleteMaterial(id) }
    override suspend fun publishMaterial(id: Long) = call { api.publishMaterial(id) }
    override suspend fun archiveMaterial(id: Long) = call { api.archiveMaterial(id) }
    override suspend fun addAudience(materialId: Long, sectionId: Long) = call { api.addMaterialAudience(materialId, FacultyAudienceRequest(sectionId)) }
    override suspend fun deleteAudience(id: Long) = call { api.deleteMaterialAudience(id) }

    private suspend fun <T> call(request: suspend () -> Response<T>): NetworkResult<T> {
        val initial = safeCall(request)
        if (initial !is NetworkResult.Failure || initial.kind != ErrorKind.UNAUTHORIZED) return initial
        return when (refresher.refresh()) {
            is NetworkResult.Success -> safeCall(request)
            is NetworkResult.Failure -> { expiry.notifyExpired(); initial }
        }
    }
}
