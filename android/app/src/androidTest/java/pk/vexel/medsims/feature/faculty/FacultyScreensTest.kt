package pk.vexel.medsims.feature.faculty

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsEnabled
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.*
import pk.vexel.medsims.core.ui.MedSimsTheme
import retrofit2.Response
import javax.inject.Inject

@HiltAndroidTest
class FacultyScreensTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()
    @Inject lateinit var api: FakeFacultyApi
    @Before fun setUp() { hiltRule.inject() }

    @Test fun dashboard_renders_role_stats() {
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyHomeScreen() } }
        composeRule.onNodeWithText("Faculty dashboard").assertExists()
        composeRule.onNodeWithText("My sessions").assertExists()
        composeRule.onNodeWithText("40").assertExists()
    }

    @Test fun roster_can_be_marked_and_confirmed() {
        api.sessionsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultySessionDto(9, 1, "Fall", 2, "A", 7, "Dr Khan", 3, "Medicine", "2026-09-15T09:00:00Z", "2026-09-15T10:00:00Z"))))
        api.rosterResponse = Response.success(LiveRosterDto(9, 2, "2026-09-15", students = listOf(LiveRosterStudentDto(1, "S1", "Jane"), LiveRosterStudentDto(2, "S2", "Ali"))))
        api.submitResponse = Response.success(LiveAttendanceResultDto(2, absent = 1))
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyAttendanceScreen() } }
        composeRule.onNodeWithText("Jane").performClick()
        composeRule.onNodeWithText("Submit attendance").performClick()
        composeRule.onNodeWithText("Submit 2 students: 1 present and 1 absent?").assertExists()
        composeRule.onNodeWithText("Submit").performClick()
        composeRule.waitUntil(5_000) { api.lastSubmit != null }
        assert(api.lastSubmit?.records?.single()?.student_id == 1L)
    }

    @Test fun gradebook_renders_drafts_and_opens_typed_editor() {
        api.examsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultyExamDto(4, 1, "Year 1", "Midterm", components = listOf(FacultyExamComponentDto(8, 4, "Written", 1, "100"))))))
        api.studentsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultyStudentDto(3, "S-003", "Amina", group = 3))))
        api.sectionsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultySectionDto(9, "Section A", 2, "MED-1", "Medicine", 1, "Year 1", 3, "A"))))
        api.gradebookResponse = Response.success(PaginatedResponse(1, results = listOf(FacultyResultDto(7, 4, "Midterm", 3, "S-003", "Amina", "70", "100", status = "DRAFT"))))
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyGradebookScreen() } }
        composeRule.onNodeWithText("Gradebook").assertExists()
        composeRule.onNodeWithText("Amina").assertExists()
        composeRule.onNodeWithText("Edit draft marks").performClick()
        composeRule.onNodeWithText("Save draft").assertExists().assertIsEnabled()
    }

    @Test fun materials_render_audience_and_guard_publish() {
        api.sectionsResponse = Response.success(PaginatedResponse(1, results = listOf(FacultySectionDto(9, "Section A", 2, "MED-1", "Medicine", 1, "Year 1", 3, "A"))))
        api.facultyMaterialsResponse = Response.success(PaginatedResponse(1, results = listOf(LearningMaterialDto(5, "Cardiology notes", kind = "LINK", url = "https://example.edu/cardio", status = "DRAFT", created_by = 1, audiences = listOf(LearningMaterialAudienceDto(6, 5, section = 9))))))
        composeRule.setContent { MedSimsTheme(dark = false) { FacultyMaterialsScreen(userId = 1) } }
        composeRule.onNodeWithText("Cardiology notes").assertExists()
        composeRule.onNodeWithText("MED-1 — Section A").assertExists()
        composeRule.onNodeWithText("Publish").performClick()
        composeRule.onNodeWithText("Confirm Publish").assertExists()
        composeRule.onNodeWithText("Confirm").performClick()
        composeRule.waitUntil(5_000) { api.lastPublishedMaterialId == 5L }
    }
}
