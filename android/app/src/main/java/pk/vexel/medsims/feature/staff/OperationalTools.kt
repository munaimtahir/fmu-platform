package pk.vexel.medsims.feature.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*
import pk.vexel.medsims.core.auth.ImpersonationState
import pk.vexel.medsims.core.auth.SessionStore
import pk.vexel.medsims.core.document.CachedDocument
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.NetworkResult
import pk.vexel.medsims.core.staff.StaffDataSource

data class ToolState(
    val loading:Boolean=false,
    val result:JsonElement?=null,
    val error:String?=null,
    val message:String?=null,
    val importJobId:String?=null,
    val readyDocument:CachedDocument?=null,
)

@HiltViewModel
class OperationalToolsViewModel @Inject constructor(
    private val repository:StaffDataSource,
    sessionStore:SessionStore,
):ViewModel(){
    private val _state=MutableStateFlow(ToolState())
    val state=_state.asStateFlow()
    val impersonation=sessionStore.impersonation

    fun eligibility(student:String,section:String,threshold:String)=get(
        "api/attendance/eligibility/?student_id=${enc(student)}&section_id=${enc(section)}&threshold=${enc(threshold.ifBlank { "75" })}"
    )
    fun transcript(student:String)=download("api/transcripts/${enc(student)}/","transcript-$student.pdf")
    fun statement(student:String,term:String){
        val query=term.takeIf{it.isNotBlank()}?.let{"?term=${enc(it)}"}.orEmpty()
        download("api/finance/students/${enc(student)}/statement/pdf/$query","statement-$student.pdf")
    }
    fun financeReport(type:String,first:String,second:String){
        when(type){
            "Collection"->get("api/finance/reports/collection/?start=${enc(first)}&end=${enc(second)}")
            "Aging"->get("api/finance/reports/aging/"+(if(first.isBlank())"" else "?term=${enc(first)}"))
            else->post("api/finance/reports/defaulters/",buildJsonObject{
                put("term_id",first.toLongOrNull() ?: 0)
                second.toBigDecimalOrNull()?.let{put("min_outstanding",it)}
            })
        }
    }
    fun generateTimetables(batch:String,period:String)=post("api/timetable/weekly-timetables/generate_weekly_templates/",buildJsonObject{put("batch",batch.toLongOrNull()?:0);put("academic_period",period.toLongOrNull()?:0)})
    fun generateVouchers(term:String,dueDate:String,program:String,studentIds:String,feeTypeIds:String)=post("api/finance/vouchers/generate/",buildJsonObject{
        put("term_id",term.toLongOrNull()?:0);put("due_date",dueDate)
        program.toLongOrNull()?.let{put("program_id",it)}
        parseIdArray(studentIds)?.let{put("student_ids",it)};parseIdArray(feeTypeIds)?.let{put("fee_type_ids",it)}
    })
    fun reorderSyllabus(items:String){val parsed=try{Json.parseToJsonElement(items)}catch(_:Exception){_state.value=_state.value.copy(error="Enter a valid JSON array.");return};post("api/admin/syllabus/reorder/",buildJsonObject{put("items",parsed)})}
    fun upload(document:PickedDocument,mode:String,autoCreate:Boolean)=execute({
        repository.uploadStudentImport(document,mode,autoCreate)
    }) { value ->
        val id=(value as? JsonObject)?.get("import_job_id")?.jsonPrimitive?.contentOrNull
        _state.value=ToolState(result=value,importJobId=id,message="Preview complete. Review the validation result before committing.")
    }
    fun commit(jobId:String,autoCreate:Boolean)=post("api/admin/students/import/commit/",buildJsonObject{put("import_job_id",jobId);put("confirm",true);put("auto_create",autoCreate)})
    fun importTemplate()=download("api/admin/students/import/template/","students-import-template.csv")
    fun importErrors(jobId:String)=download("api/admin/students/import/$jobId/errors.csv/","student-import-errors.csv")
    fun startImpersonation(targetId:String)=execute({ repository.startImpersonation(targetId) }) { _state.value=ToolState(result=it,message="Impersonation started. The banner remains visible until you stop.") }
    fun stopImpersonation()=execute({ repository.stopImpersonation() }) { _state.value=ToolState(result=it,message="Admin session restored.") }
    fun documentOpened(){_state.value=_state.value.copy(readyDocument=null)}

    private fun get(path:String)=execute({ repository.get(path) }) { _state.value=ToolState(result=it) }
    private fun post(path:String,body:JsonElement)=execute({ repository.post(path,body) }) { _state.value=ToolState(result=it,message="Operation completed.") }
    private fun download(path:String,name:String)=execute({ repository.download(path,name) }) { _state.value=ToolState(readyDocument=it,message="Download ready.") }
    private fun <T> execute(call:suspend()->NetworkResult<T>,success:(T)->Unit)=viewModelScope.launch{
        _state.value=_state.value.copy(loading=true,error=null,message=null)
        when(val result=call()){
            is NetworkResult.Success->success(result.value)
            is NetworkResult.Failure->_state.value=_state.value.copy(loading=false,error=result.message)
        }
        if(_state.value.loading)_state.value=_state.value.copy(loading=false)
    }
    private fun enc(value:String)=java.net.URLEncoder.encode(value.trim(),"UTF-8")
    private fun parseIdArray(value:String):JsonArray?{if(value.isBlank())return null;return JsonArray(value.split(',').mapNotNull{it.trim().toLongOrNull()?.let(::JsonPrimitive)})}
}
