package pk.vexel.medsims.core.staff

import kotlinx.serialization.json.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import pk.vexel.medsims.core.auth.SessionExpiryNotifier
import pk.vexel.medsims.core.auth.SessionStore
import pk.vexel.medsims.core.auth.ImpersonationState
import pk.vexel.medsims.core.auth.TokenRefresher
import pk.vexel.medsims.core.document.CachedDocument
import pk.vexel.medsims.core.document.DocumentStore
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.*
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

interface StaffDataSource {
    suspend fun get(path: String): NetworkResult<JsonElement>
    suspend fun post(path: String, body: JsonElement): NetworkResult<JsonElement>
    suspend fun patch(path: String, body: JsonElement): NetworkResult<JsonElement>
    suspend fun delete(path: String): NetworkResult<Unit>
    suspend fun download(path: String, name: String): NetworkResult<CachedDocument>
    suspend fun uploadStudentImport(document: PickedDocument, mode: String, autoCreate: Boolean): NetworkResult<JsonElement>
    suspend fun startImpersonation(targetId:String): NetworkResult<JsonElement>
    suspend fun stopImpersonation(): NetworkResult<JsonElement>
}

@Singleton class StaffRepository @Inject constructor(
    private val api: StaffApi,
    private val refresher: TokenRefresher,
    private val expiry: SessionExpiryNotifier,
    private val documents: DocumentStore,
    private val store: SessionStore,
): StaffDataSource {
    override suspend fun get(path: String) = call { api.get(path) }
    override suspend fun post(path: String, body: JsonElement) = call { api.post(path, body) }
    override suspend fun patch(path: String, body: JsonElement) = call { api.patch(path, body) }
    override suspend fun delete(path: String): NetworkResult<Unit> = tryDelete { api.delete(path) }
    override suspend fun download(path: String, name: String): NetworkResult<CachedDocument> =
        when (val result = call { api.download(path) }) {
            is NetworkResult.Success -> NetworkResult.Success(documents.cache(result.value, name))
            is NetworkResult.Failure -> result
        }
    override suspend fun uploadStudentImport(document: PickedDocument, mode: String, autoCreate: Boolean): NetworkResult<JsonElement> {
        val file = MultipartBody.Part.createFormData("file", document.displayName, documents.requestBody(document))
        return call {
            api.upload(
                "api/admin/students/import/preview/", file,
                mode.toRequestBody("text/plain".toMediaType()),
                autoCreate.toString().toRequestBody("text/plain".toMediaType()),
            )
        }
    }
    override suspend fun startImpersonation(targetId:String):NetworkResult<JsonElement> {
        if(store.isImpersonating()) return NetworkResult.Failure(ErrorKind.VALIDATION,"Stop the current impersonation first.")
        return when(val result=call { api.post("api/admin/impersonation/start/", kotlinx.serialization.json.buildJsonObject { put("target_user_id",targetId) }) }) {
            is NetworkResult.Failure -> result
            is NetworkResult.Success -> {
                val obj=result.value as? kotlinx.serialization.json.JsonObject
                val token=obj?.get("access")?.jsonPrimitive?.contentOrNull
                val target=obj?.get("target") as? kotlinx.serialization.json.JsonObject
                if(token.isNullOrBlank()||target==null) NetworkResult.Failure(ErrorKind.SERVER,"Invalid impersonation response.")
                else { store.beginImpersonation(token,ImpersonationState(targetId,target["full_name"]?.jsonPrimitive?.contentOrNull ?: target["username"]?.jsonPrimitive?.contentOrNull ?: targetId,target["role"]?.jsonPrimitive?.contentOrNull ?: "User")); result }
            }
        }
    }
    override suspend fun stopImpersonation():NetworkResult<JsonElement> {
        val state=store.impersonation.value ?: return NetworkResult.Failure(ErrorKind.VALIDATION,"No impersonation session is active.")
        store.restoreAdminAccess()
        return call { api.post("api/admin/impersonation/stop/",kotlinx.serialization.json.buildJsonObject { put("target_user_id",state.targetId) }) }
    }

    private suspend fun <T> call(request: suspend () -> Response<T>): NetworkResult<T> {
        val first = safeCall(request)
        if (first !is NetworkResult.Failure || first.kind != ErrorKind.UNAUTHORIZED) return first
        if (store.isImpersonating()) return first
        return when (refresher.refresh()) {
            is NetworkResult.Success -> safeCall(request)
            is NetworkResult.Failure -> { expiry.notifyExpired(); first }
        }
    }
    private suspend fun tryDelete(request: suspend () -> Response<Unit>): NetworkResult<Unit> {
        var response = try { request() } catch (e: Exception) { return NetworkResult.Failure(ErrorKind.OFFLINE, e.message ?: "Request failed") }
        if (response.code() == 401 && refresher.refresh() is NetworkResult.Success) response = request()
        if (response.isSuccessful) return NetworkResult.Success(Unit)
        val failed = failure(response)
        if (failed.kind == ErrorKind.UNAUTHORIZED) expiry.notifyExpired()
        return failed
    }
}
