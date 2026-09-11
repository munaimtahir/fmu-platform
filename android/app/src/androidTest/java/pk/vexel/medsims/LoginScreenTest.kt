package pk.vexel.medsims

import androidx.activity.compose.setContent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import pk.vexel.medsims.core.network.FakeAuthApi
import pk.vexel.medsims.core.network.UserDto
import pk.vexel.medsims.core.ui.MedSimsTheme
import pk.vexel.medsims.feature.auth.LoginScreen
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import javax.inject.Inject

@HiltAndroidTest
class LoginScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<HiltTestActivity>()

    @Inject lateinit var fakeAuthApi: FakeAuthApi

    @Before fun setUp() { hiltRule.inject() }

    @Test fun login_screen_renders_identifier_and_password_fields() {
        composeRule.setContent { MedSimsTheme(dark = false) { LoginScreen(onAuthenticated = {}) } }
        composeRule.onNodeWithContentDescription("Identifier").assertExists()
        composeRule.onNodeWithContentDescription("Password").assertExists()
    }

    @Test fun successful_login_invokes_onAuthenticated_with_user() {
        var authenticated: UserDto? = null
        composeRule.setContent { MedSimsTheme(dark = false) { LoginScreen(onAuthenticated = { authenticated = it }) } }

        composeRule.onNodeWithContentDescription("Identifier").performTextInput("jane@example.edu")
        composeRule.onNodeWithContentDescription("Password").performTextInput("s3cret!")
        composeRule.onNodeWithText("Sign in").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) { authenticated != null }
        assertEquals(FakeAuthApi.defaultUser().username, authenticated?.username)
    }
}
