package pk.vexel.medsims.core.document

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okhttp3.ResponseBody
import okio.BufferedSink
import okio.source
import java.io.File
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class PickedDocument(val uri: String, val displayName: String, val mimeType: String?)
data class CachedDocument(val uri: String, val displayName: String, val mimeType: String)

/** Streams user-selected and downloaded documents without requesting broad storage permission. */
@Singleton
class DocumentStore @Inject constructor(@param:ApplicationContext private val context: Context) {
    init { clear() }

    fun describe(uri: Uri): PickedDocument {
        var name: String? = null
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) name = cursor.getString(0)
        }
        return PickedDocument(uri.toString(), sanitize(name ?: "document"), context.contentResolver.getType(uri))
    }

    fun requestBody(document: PickedDocument): RequestBody = object : RequestBody() {
        override fun contentType() = document.mimeType?.toMediaTypeOrNull()
        override fun contentLength(): Long = try {
            context.contentResolver.openAssetFileDescriptor(Uri.parse(document.uri), "r")?.use { it.length } ?: -1L
        } catch (_: Exception) { -1L }
        override fun writeTo(sink: BufferedSink) {
            val input = context.contentResolver.openInputStream(Uri.parse(document.uri))
                ?: throw IllegalArgumentException("The selected document is no longer available.")
            input.source().use { sink.writeAll(it) }
        }
    }

    suspend fun cache(body: ResponseBody, displayName: String): CachedDocument = withContext(Dispatchers.IO) {
        val directory = File(context.cacheDir, "shared-documents").apply { mkdirs() }
        val safeName = sanitize(displayName)
        val file = File(directory, "${UUID.randomUUID()}-$safeName")
        body.byteStream().use { input -> file.outputStream().use { output -> input.copyTo(output) } }
        val mime = body.contentType()?.toString() ?: mimeFromName(safeName)
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        CachedDocument(uri.toString(), safeName, mime)
    }

    fun clear() { File(context.cacheDir, "shared-documents").deleteRecursively() }

    private fun sanitize(value: String): String = value.substringAfterLast('/').replace(Regex("[^A-Za-z0-9._ -]"), "_").take(120).ifBlank { "document" }
    private fun mimeFromName(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
        "pdf" -> "application/pdf"
        "jpg", "jpeg" -> "image/jpeg"
        "png" -> "image/png"
        "doc" -> "application/msword"
        "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else -> "application/octet-stream"
    }
}
