package pk.vexel.medsims

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.assertExists
import org.junit.Rule
import org.junit.Test

class LoginScreenTest { @get:Rule val rule = createAndroidComposeRule<ComponentActivity>(); @Test fun activity_launches() { rule.onNodeWithContentDescription("Identifier").assertExists() } }
