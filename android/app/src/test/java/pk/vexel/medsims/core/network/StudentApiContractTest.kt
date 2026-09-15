package pk.vexel.medsims.core.network

import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class StudentApiContractTest {
    private lateinit var server: MockWebServer
    private lateinit var api: StudentApi
    @Before fun setUp() {
        server = MockWebServer(); server.start()
        api = Retrofit.Builder().baseUrl(server.url("/")).addConverterFactory(Json { ignoreUnknownKeys = true }.asConverterFactory("application/json".toMediaType())).build().create(StudentApi::class.java)
    }
    @After fun tearDown() { server.shutdown() }

    @Test fun compliance_submission_is_multipart_with_file_and_value() = runBlocking {
        server.enqueue(MockResponse().setBody(REQUIREMENT))
        val file = MultipartBody.Part.createFormData("file", "proof.pdf", "pdf-data".toRequestBody("application/pdf".toMediaType()))
        api.submitCompliance(7, file, "Dose 2".toRequestBody()).body()
        val request = server.takeRequest()
        assertEquals("/api/compliance/my-compliance/7/submit/", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("name=\"file\"; filename=\"proof.pdf\""))
        assertTrue(body.contains("name=\"value\""))
        assertTrue(body.contains("Dose 2"))
    }

    @Test fun statement_pdf_uses_binary_endpoint() = runBlocking {
        server.enqueue(MockResponse().setHeader("Content-Type", "application/pdf").setBody("pdf"))
        assertEquals("pdf", api.statementPdf(12).body()?.string())
        assertEquals("/api/finance/students/12/statement/pdf/", server.takeRequest().path)
    }

    private companion object {
        const val REQUIREMENT = """{"id":7,"definition_title":"Proof","definition_type":"DOCUMENT","status":"SUBMITTED","is_locked":false,"submissions":[]}"""
    }
}
