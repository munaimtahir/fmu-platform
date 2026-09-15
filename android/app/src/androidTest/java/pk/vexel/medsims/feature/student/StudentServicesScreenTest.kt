package pk.vexel.medsims.feature.student

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
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
class StudentServicesScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()
    @Inject lateinit var api: FakeStudentApi

    @Before fun setUp() {
        hiltRule.inject()
        api.financeResponse = Response.success(StudentFinanceSummaryDto(1, "1250", "2000", "750"))
        api.materialsResponse = Response.success(listOf(LearningMaterialDto(2, "Cardiology notes", kind = "file", file = "https://sims.vexel.pk/media/notes.pdf")))
        api.complianceResponse = Response.success(PaginatedResponse(1, results = listOf(RequirementDto(3, "Vaccination record", definition_type = "DOCUMENT", status = "PENDING", is_locked = false))))
        api.notificationsResponse = Response.success(PaginatedResponse(1, results = listOf(NotificationInboxDto(4, NotificationDto(5, "Exam notice", "Monday", "exam", "normal", "2026-09-15"), "2026-09-15"))))
    }

    @Test fun renders_all_student_services() {
        render()
        composeRule.onNodeWithText("Outstanding: 1250").assertExists()
        composeRule.onNodeWithText("Cardiology notes").assertExists()
        composeRule.onNodeWithText("Vaccination record").assertExists()
        composeRule.onNodeWithText("Exam notice").assertExists()
        composeRule.onNodeWithText("Download statement PDF").assertExists()
    }

    @Test fun confirms_text_compliance_submission() {
        render()
        composeRule.onNodeWithText("Submission details").performTextInput("Dose 2 complete")
        composeRule.onNodeWithText("Submit").performClick()
        composeRule.onNodeWithText("Confirm submission").assertExists()
        composeRule.onNodeWithText("Send").performClick()
        composeRule.waitUntil(5_000) { api.submitCount == 1 }
    }

    private fun render() = composeRule.setContent { MedSimsTheme(dark = false) { StudentServicesScreen(UserDto(1, "jane", role = "Student", student_id = 1)) } }
}
