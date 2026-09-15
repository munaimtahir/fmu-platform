package pk.vexel.medsims.feature.staff

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import javax.inject.Inject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import pk.vexel.medsims.HiltTestActivity
import pk.vexel.medsims.core.network.FakeStaffApi
import pk.vexel.medsims.core.ui.MedSimsTheme
import retrofit2.Response

@HiltAndroidTest
class StaffScreensTest {
    @get:Rule(order=0) val hiltRule=HiltAndroidRule(this)
    @get:Rule(order=1) val composeRule=createAndroidComposeRule<HiltTestActivity>()
    @Inject lateinit var api:FakeStaffApi

    @Before fun setUp(){hiltRule.inject()}

    @Test fun staff_home_exposes_role_modules(){
        composeRule.setContent{MedSimsTheme(false){StaffHomeScreen("Registrar",StaffCatalog.registrar,{})}}
        composeRule.onNodeWithText("Registrar workspace").assertExists()
        composeRule.onNodeWithText("Students").assertExists()
    }

    @Test fun sensitive_result_action_requires_typed_confirmation(){
        api.jsonResponse=Response.success(buildJsonArray{add(buildJsonObject{put("id",44);put("student_name","Demo Student");put("status","PUBLISHED")})})
        val module=StaffCatalog.exam.first{it.key=="results"}
        composeRule.setContent{MedSimsTheme(false){StaffModuleScreen(module)}}
        composeRule.waitUntil(5_000){composeRule.onAllNodesWithText("Freeze").fetchSemanticsNodes().isNotEmpty()}
        composeRule.onNodeWithText("Freeze").performClick()
        composeRule.onNodeWithText("This operation can affect authoritative records. Type CONFIRM to continue.").assertExists()
        composeRule.onNodeWithText("Confirmation").assertExists()
    }
}
