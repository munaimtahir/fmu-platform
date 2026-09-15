package pk.vexel.medsims.feature.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*
import pk.vexel.medsims.core.document.CachedDocument
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.*
import pk.vexel.medsims.core.staff.StaffDataSource
import javax.inject.Inject

data class StaffAction(
    val label: String,
    val suffix: String,
    val dangerous: Boolean = false,
    val fields: List<StaffField> = emptyList(),
    val downloadName: String? = null,
)
enum class StaffFieldKind { TEXT, NUMBER, BOOLEAN }
data class StaffField(val name:String, val label:String, val kind:StaffFieldKind=StaffFieldKind.TEXT, val required:Boolean=true)
data class StaffModule(
    val key: String, val title: String, val path: String,
    val canCreate: Boolean = true, val canEdit: Boolean = true, val canDelete: Boolean = true,
    val actions: List<StaffAction> = emptyList(),
    val tool: String? = null,
) { val fields:List<StaffField> get() = StaffCatalog.fields[key].orEmpty() }

object StaffCatalog {
    private fun t(name:String,label:String=name.replace('_',' ').replaceFirstChar(Char::uppercase),required:Boolean=true)=StaffField(name,label,required=required)
    private fun n(name:String,label:String=name.replace('_',' ').replaceFirstChar(Char::uppercase),required:Boolean=true)=StaffField(name,label,StaffFieldKind.NUMBER,required)
    private fun b(name:String,label:String=name.replace('_',' ').replaceFirstChar(Char::uppercase))=StaffField(name,label,StaffFieldKind.BOOLEAN,false)
    val fields = mapOf(
        "students" to listOf(t("reg_no","Registration number"),t("name"),n("person",required=false),n("user",required=false),t("email",required=false),t("phone",required=false),t("date_of_birth",required=false),n("program"),n("batch"),n("group"),t("status"),n("enrollment_year"),n("expected_graduation_year",required=false),n("actual_graduation_year",required=false)),
        "people" to listOf(n("user",required=false),t("first_name"),t("middle_name",required=false),t("last_name"),t("date_of_birth",required=false),t("gender",required=false),t("national_id",required=false)),
        "contacts" to listOf(n("person"),t("type"),t("value"),t("label",required=false),b("is_primary"),b("is_verified")),
        "addresses" to listOf(n("person"),t("type"),t("street"),t("city"),t("state",required=false),t("postal_code",required=false),t("country"),b("is_primary")),
        "identities" to listOf(n("person"),t("type"),t("document_number"),t("issue_date",required=false),t("expiry_date",required=false),t("issuing_authority",required=false)),
        "programs" to listOf(t("name"),t("description",required=false),t("structure_type"),n("period_length_months"),n("total_periods"),b("is_active")),
        "batches" to listOf(t("name"),n("program"),n("start_year"),b("is_active")),
        "periods" to listOf(t("period_type"),t("name"),t("start_date"),t("end_date")),
        "groups" to listOf(t("name"),n("batch")), "departments" to listOf(t("name"),t("code"),t("description",required=false),n("parent",required=false)),
        "timetables" to listOf(n("batch"),n("academic_period"),t("week_start_date"),t("status",required=false)),
        "timetable-entries" to listOf(n("weekly_timetable"),n("section"),n("group",required=false),n("day_of_week"),t("start_time"),t("end_time"),t("room",required=false),t("status",required=false),t("notes",required=false)),
        "exams" to listOf(n("academic_period"),n("department"),t("title"),t("exam_type"),t("scheduled_at"),t("passing_mode"),n("pass_total_marks",required=false),n("pass_total_percent",required=false),b("fail_if_any_component_fail")),
        "exam-components" to listOf(n("exam"),t("name"),n("sequence"),n("department"),n("max_marks"),n("pass_marks",required=false),n("pass_percent",required=false),b("is_mandatory_to_pass")),
        "results" to listOf(n("exam"),n("student"),n("total_obtained"),n("total_max")), "result-components" to listOf(n("result_header"),n("exam_component"),n("marks_obtained")),
        "corrections" to listOf(n("result_header"),t("reason"),t("proposed_changes","Proposed changes (JSON)")),
        "fee-types" to listOf(t("code"),t("name"),b("is_active")), "fee-plans" to listOf(n("program"),n("term"),n("fee_type"),n("amount"),b("is_mandatory"),t("frequency"),t("effective_from"),b("is_active")),
        "vouchers" to listOf(n("student"),n("term"),t("issue_date"),t("due_date"),n("total_amount"),t("notes",required=false),t("items","Line items (JSON)")),
        "payments" to listOf(n("student"),n("term"),n("voucher",required=false),n("amount"),t("method"),t("reference_no",required=false),t("notes",required=false)),
        "adjustments" to listOf(n("student"),n("term"),t("kind"),n("amount"),t("reason")), "policies" to listOf(t("rule_key"),t("description"),n("threshold_amount",required=false),n("fee_type",required=false),b("is_active")),
        "users" to listOf(t("username"),t("email"),t("first_name",required=false),t("last_name",required=false),t("password",required=false),t("role",required=false),b("is_active")),
        "roles" to listOf(t("name"),t("description",required=false)), "role-tasks" to listOf(n("role_id"),n("task_id")), "user-tasks" to listOf(n("user_id"),n("task_id")),
        "settings" to listOf(t("key"),t("value_json","Value (JSON)"),t("value_type")), "syllabus" to listOf(n("program",required=false),n("period",required=false),n("learning_block",required=false),n("module",required=false),t("title"),t("code"),t("description",required=false),t("learning_objectives","Objectives (JSON)",false),n("order_no"),b("is_active")),
    )
    val registrar = listOf(
        StaffModule("students", "Students", "api/students/"),
        StaffModule("people", "People", "api/people/persons/"),
        StaffModule("contacts", "Contact information", "api/people/contact-info/"),
        StaffModule("addresses", "Addresses", "api/people/addresses/"),
        StaffModule("identities", "Identity documents", "api/people/identity-documents/"),
        StaffModule("programs", "Programs", "api/academics/programs/", actions=listOf(StaffAction("Finalize", "finalize/", true), StaffAction("Generate periods", "generate-periods/"))),
        StaffModule("batches", "Batches", "api/academics/batches/"),
        StaffModule("periods", "Academic periods", "api/academics/academic-periods/", actions=listOf(StaffAction("Open", "open/"), StaffAction("Close", "close/", true))),
        StaffModule("groups", "Groups", "api/academics/groups/"),
        StaffModule("departments", "Departments", "api/academics/departments/"),
        StaffModule("timetables", "Weekly timetables", "api/timetable/weekly-timetables/", actions=listOf(StaffAction("Publish", "publish/", true), StaffAction("Unpublish", "unpublish/"))),
        StaffModule("timetable-entries", "Timetable entries", "api/timetable/entries/"),
        StaffModule("timetable-generator", "Generate weekly timetables", "api/timetable/weekly-timetables/",false,false,false,tool="timetable_generate"),
    )
    val coordinator = listOf(
        StaffModule("placement", "Student placement", "api/students/", canCreate=false, canDelete=false, actions=listOf(StaffAction("Place", "placement/", true, listOf(n("program"),n("batch"),n("group"))))),
        StaffModule("imports", "Student imports", "api/admin/students/import/jobs/", canCreate=false, canEdit=false, canDelete=false, tool="import"),
        StaffModule("eligibility", "Attendance eligibility", "api/attendance/eligibility/", canCreate=false, canEdit=false, canDelete=false, tool="eligibility"),
    )
    val exam = listOf(
        StaffModule("exams", "Exams", "api/exams/", actions=listOf(StaffAction("Publish", "publish/", true))),
        StaffModule("exam-components", "Exam components", "api/exam-components/"),
        StaffModule("results", "Results", "api/results/", actions=listOf(StaffAction("Verify", "verify/"), StaffAction("Publish", "publish/", true), StaffAction("Freeze", "freeze/", true))),
        StaffModule("result-components", "Result components", "api/result-components/"),
        StaffModule("corrections", "Result corrections", "api/result-corrections/", canEdit=false, canDelete=false, actions=listOf(StaffAction("Review", "review/", true,listOf(t("decision","Decision: APPROVED or REJECTED"),t("review_note","Review note",false))), StaffAction("Apply", "apply/", true))),
        StaffModule("transcripts", "Internal transcripts", "api/students/", false,false,false, tool="transcript"),
    )
    val finance = listOf(
        StaffModule("fee-types", "Fee types", "api/finance/fee-types/"), StaffModule("fee-plans", "Fee plans", "api/finance/fee-plans/"),
        StaffModule("vouchers", "Vouchers", "api/finance/vouchers/", canEdit=false, actions=listOf(StaffAction("Reconcile", "reconcile/"),StaffAction("PDF", "pdf/", downloadName="voucher.pdf"))),
        StaffModule("voucher-generator", "Generate vouchers", "api/finance/vouchers/",false,false,false,tool="voucher_generate"),
        StaffModule("payments", "Payments", "api/finance/payments/", actions=listOf(StaffAction("Verify / reject", "verify/",true,listOf(b("approve","Approve"),t("notes","Notes",false))), StaffAction("Reverse", "reverse/", true,listOf(t("reason"))),StaffAction("Receipt", "pdf/",downloadName="payment-receipt.pdf"))),
        StaffModule("ledger", "Ledger", "api/finance/ledger/", false, false, false),
        StaffModule("adjustments", "Adjustments", "api/finance/adjustments/", actions=listOf(StaffAction("Approve / reject", "approve/", true,listOf(b("approve","Approve"))))),
        StaffModule("policies", "Finance policies", "api/finance/policies/"),
        StaffModule("finance-reports", "Finance reports", "api/finance/reports/aging/",false,false,false,tool="finance_reports"),
    )
    val admin = listOf(
        StaffModule("users", "Users", "api/admin/users/", actions=listOf(StaffAction("Activate", "activate/"), StaffAction("Deactivate", "deactivate/", true), StaffAction("Reset password", "reset-password/", true))),
        StaffModule("roles", "Roles", "api/core/roles/"), StaffModule("role-tasks", "Role permissions", "api/core/role-task-assignments/"),
        StaffModule("user-tasks", "User permissions", "api/core/user-task-assignments/"),
        StaffModule("dashboard", "Analytics dashboard", "api/admin/dashboard/", false,false,false),
        StaffModule("audit", "Audit log", "api/audit/", false, false, false), StaffModule("settings", "Settings", "api/admin/settings/", true, true, false),
        StaffModule("settings-allowed", "Allowed setting keys", "api/admin/settings/allowed_keys/",false,false,false),
        StaffModule("syllabus", "Syllabus", "api/admin/syllabus/"),
        StaffModule("syllabus-reorder", "Reorder syllabus", "api/admin/syllabus/",false,false,false,tool="syllabus_reorder"),
        StaffModule("impersonation", "Impersonation", "api/admin/users/",false,false,false,tool="impersonation"),
    )
}

data class StaffState(val loading:Boolean=false, val module:StaffModule?=null, val rows:List<JsonObject> = emptyList(), val error:String?=null, val message:String?=null, val next:String?=null, val readyDocument:CachedDocument?=null)

@HiltViewModel class StaffWorkspaceViewModel @Inject constructor(private val repository: StaffDataSource): ViewModel() {
    private val _state=MutableStateFlow(StaffState()); val state=_state.asStateFlow()
    fun load(module: StaffModule, query:String="") = viewModelScope.launch { loadNow(module,query) }
    private suspend fun loadNow(module:StaffModule,query:String="",message:String?=null){
        _state.value=StaffState(true,module,message=message)
        val path=if(query.isBlank()) module.path else module.path+(if(module.path.contains('?'))"&" else "?")+"search="+java.net.URLEncoder.encode(query,"UTF-8")
        when(val r=repository.get(path)) {
            is NetworkResult.Success -> _state.value=StaffState(module=module, rows=rows(r.value),next=next(r.value),message=message)
            is NetworkResult.Failure -> _state.value=StaffState(module=module,error=r.message,message=message)
        }
    }
    fun create(values:Map<String,String>)=mutate { module, body -> repository.post(module.path,body) }(values)
    fun update(id:String,values:Map<String,String>)=viewModelScope.launch { val m=_state.value.module?:return@launch; val body=payload(m,values)?:return@launch; when(val r=repository.patch("${m.path}$id/",body)){ is NetworkResult.Success->loadNow(m,message="Saved"); is NetworkResult.Failure->_state.value=_state.value.copy(error=r.message)} }
    fun delete(id:String)=viewModelScope.launch { val m=_state.value.module?:return@launch; when(val r=repository.delete("${m.path}$id/")){ is NetworkResult.Success->loadNow(m,message="Deleted"); is NetworkResult.Failure->_state.value=_state.value.copy(error=r.message)} }
    fun loadMore()=viewModelScope.launch { val current=_state.value; val next=current.next?:return@launch; _state.value=current.copy(loading=true); when(val r=repository.get(next)){is NetworkResult.Success->_state.value=current.copy(loading=false,rows=current.rows+rows(r.value),next=next(r.value));is NetworkResult.Failure->_state.value=current.copy(loading=false,error=r.message)} }
    fun action(id:String, action:StaffAction, values:Map<String,String> = emptyMap())=viewModelScope.launch { val m=_state.value.module?:return@launch; if(action.downloadName!=null){download("${m.path}$id/${action.suffix}",action.downloadName);return@launch}; val body=payload(action.fields,values)?:return@launch; when(val r=repository.post("${m.path}$id/${action.suffix}",body)){ is NetworkResult.Success->loadNow(m,message=resultMessage(action.label,r.value)); is NetworkResult.Failure->_state.value=_state.value.copy(error=r.message)} }
    fun download(path:String,name:String)=viewModelScope.launch { _state.value=_state.value.copy(loading=true); when(val r=repository.download(path,name)){is NetworkResult.Success->_state.value=_state.value.copy(loading=false,readyDocument=r.value,message="Download ready");is NetworkResult.Failure->_state.value=_state.value.copy(loading=false,error=r.message)} }
    fun documentOpened(){_state.value=_state.value.copy(readyDocument=null)}
    private fun mutate(call:suspend(StaffModule,JsonElement)->NetworkResult<JsonElement>):(Map<String,String>)->Unit = { values -> viewModelScope.launch { val m=_state.value.module?:return@launch; val body=payload(m,values)?:return@launch; when(val r=call(m,body)){ is NetworkResult.Success->loadNow(m,message="Saved"); is NetworkResult.Failure->_state.value=_state.value.copy(error=r.message)} } }
    private fun payload(module:StaffModule,values:Map<String,String>)=payload(module.fields,values)
    private fun payload(fields:List<StaffField>,values:Map<String,String>):JsonObject?=try { buildJsonObject { fields.forEach { f -> val v=values[f.name].orEmpty().trim(); if(v.isNotEmpty()) put(f.name,when { f.name.endsWith("_json")||f.name in setOf("items","proposed_changes","learning_objectives","value_json") -> Json.parseToJsonElement(v); f.kind==StaffFieldKind.NUMBER -> JsonPrimitive(v.toBigDecimal()); f.kind==StaffFieldKind.BOOLEAN -> JsonPrimitive(v.toBooleanStrict()); else -> JsonPrimitive(v) }) } } } catch(_:Exception){_state.value=_state.value.copy(error="Check number, boolean, and JSON fields.");null}
    private fun rows(value:JsonElement):List<JsonObject> = when(value){ is JsonArray->value.mapNotNull{it as? JsonObject}; is JsonObject->((value["results"] as? JsonArray)?.mapNotNull{it as? JsonObject} ?: listOf(value)); else->emptyList() }
    private fun next(value:JsonElement)=((value as? JsonObject)?.get("next") as? JsonPrimitive)?.contentOrNull
    private fun resultMessage(label:String,value:JsonElement):String { val password=(value as? JsonObject)?.get("temporary_password")?.jsonPrimitive?.contentOrNull; return if(password==null)"$label completed" else "Temporary password: $password" }
}
