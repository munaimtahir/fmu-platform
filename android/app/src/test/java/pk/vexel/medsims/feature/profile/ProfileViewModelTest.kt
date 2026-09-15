package pk.vexel.medsims.feature.profile

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Test
import pk.vexel.medsims.core.auth.ProfileRepository
import pk.vexel.medsims.core.network.*

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {
    private val repository = FakeProfileRepository()
    @Before fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After fun tearDown() { Dispatchers.resetMain() }

    @Test fun rejects_invalid_email_without_calling_api() = runTest {
        val viewModel = ProfileViewModel(repository)
        viewModel.updateEmail("not-an-email") {}
        assertEquals("Enter a valid email address.", viewModel.form.value.emailError)
        assertFalse(repository.updateCalled)
    }

    @Test fun exposes_password_validation_and_server_errors() = runTest {
        val viewModel = ProfileViewModel(repository)
        viewModel.changePassword("old", "short", "short")
        assertEquals("New password must be at least 8 characters.", viewModel.form.value.passwordError)
        repository.passwordResult = NetworkResult.Failure(ErrorKind.VALIDATION, "Invalid", fieldErrors = mapOf("old_password" to "Incorrect password."))
        viewModel.changePassword("old", "long-enough", "long-enough")
        assertEquals("Incorrect password.", viewModel.form.value.passwordError)
    }

    @Test fun successful_email_update_returns_user() = runTest {
        val viewModel = ProfileViewModel(repository)
        var updated: UserDto? = null
        viewModel.updateEmail("new@example.edu") { updated = it }
        assertEquals("new@example.edu", updated?.email)
        assertEquals("Profile updated.", viewModel.form.value.message)
    }
}

private class FakeProfileRepository : ProfileRepository {
    var updateCalled = false
    var passwordResult: NetworkResult<MessageResponse> = NetworkResult.Success(MessageResponse("Password updated."))
    override suspend fun updateProfile(email: String): NetworkResult<UserDto> {
        updateCalled = true
        return NetworkResult.Success(UserDto(1, "jane", email, "Jane", "Student", 1))
    }
    override suspend fun changePassword(oldPassword: String, newPassword: String, confirmation: String) = passwordResult
}
