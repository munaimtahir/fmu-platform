package pk.vexel.medsims.core.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ImpersonationState(val targetId: String, val targetName: String, val targetRole: String)

@Singleton
class SessionStore @Inject constructor(@ApplicationContext context: Context) {
    private val preferences = EncryptedSharedPreferences.create(context, "medsims_secure_session", MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(), EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
    @Volatile private var access: String? = null
    @Volatile private var originalAccess: String? = null
    private val _impersonation = MutableStateFlow<ImpersonationState?>(null)
    val impersonation = _impersonation.asStateFlow()
    fun accessToken(): String? = access
    fun refreshToken(): String? = preferences.getString(REFRESH, null)
    fun save(accessToken: String, refreshToken: String) { access = accessToken; preferences.edit().putString(REFRESH, refreshToken).apply() }
    fun updateAccess(accessToken: String) { access = accessToken }
    fun beginImpersonation(accessToken:String,state:ImpersonationState):Boolean { if(originalAccess!=null)return false; originalAccess=access; access=accessToken; _impersonation.value=state; return true }
    fun restoreAdminAccess():String? { val token=originalAccess?:return null; access=token; originalAccess=null; _impersonation.value=null; return token }
    fun isImpersonating()=originalAccess!=null
    fun clear() { access = null; originalAccess=null; _impersonation.value=null; preferences.edit().clear().apply() }
    private companion object { const val REFRESH = "refresh_token" }
}
