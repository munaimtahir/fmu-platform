package pk.vexel.medsims.core.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionStore @Inject constructor(@ApplicationContext context: Context) {
    private val preferences = EncryptedSharedPreferences.create(context, "medsims_secure_session", MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(), EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
    @Volatile private var access: String? = null
    fun accessToken(): String? = access
    fun refreshToken(): String? = preferences.getString(REFRESH, null)
    fun save(accessToken: String, refreshToken: String) { access = accessToken; preferences.edit().putString(REFRESH, refreshToken).apply() }
    fun updateAccess(accessToken: String) { access = accessToken }
    fun clear() { access = null; preferences.edit().clear().apply() }
    private companion object { const val REFRESH = "refresh_token" }
}
