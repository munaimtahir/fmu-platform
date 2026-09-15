package pk.vexel.medsims.feature.staff

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.serialization.json.Json
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer

@Composable
fun OperationalToolScreen(module:StaffModule,viewModel:OperationalToolsViewModel=hiltViewModel()){
    val state by viewModel.state.collectAsState()
    val acting by viewModel.impersonation.collectAsState()
    val context=LocalContext.current
    LaunchedEffect(state.readyDocument){state.readyDocument?.let{document->try{
        context.startActivity(Intent(Intent.ACTION_VIEW).apply{setDataAndType(Uri.parse(document.uri),document.mimeType);addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)})
        viewModel.documentOpened()
    }catch(_:ActivityNotFoundException){}}}
    AdaptiveWidthContainer { LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
        item{Text(module.title,style=MaterialTheme.typography.headlineSmall)}
        if(state.loading)item{LinearProgressIndicator(Modifier.fillMaxWidth())}
        state.error?.let{item{Text(it,color=MaterialTheme.colorScheme.error)}}
        state.message?.let{item{Text(it,color=MaterialTheme.colorScheme.primary)}}
        item{when(module.tool){
            "eligibility"->EligibilityTool(viewModel)
            "transcript"->TranscriptTool(viewModel)
            "finance_reports"->FinanceReportsTool(viewModel)
            "timetable_generate"->TimetableGenerator(viewModel)
            "voucher_generate"->VoucherGenerator(viewModel)
            "syllabus_reorder"->SyllabusReorder(viewModel)
            "import"->ImportTool(state.importJobId,viewModel,context)
            "impersonation"->ImpersonationTool(acting,viewModel)
        }}
        state.result?.let{result->item{Card(Modifier.fillMaxWidth()){Text(Json{prettyPrint=true}.encodeToString(kotlinx.serialization.json.JsonElement.serializer(),result),Modifier.padding(16.dp))}}}
    }}
}

@Composable private fun EligibilityTool(vm:OperationalToolsViewModel){var student by remember{mutableStateOf("")};var section by remember{mutableStateOf("")};var threshold by remember{mutableStateOf("75")};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Field(student,{student=it},"Student ID");Field(section,{section=it},"Section ID");Field(threshold,{threshold=it},"Threshold %");Button({vm.eligibility(student,section,threshold)},enabled=student.isNotBlank()&&section.isNotBlank()){Text("Run eligibility report")}}}
@Composable private fun TranscriptTool(vm:OperationalToolsViewModel){var student by remember{mutableStateOf("")};var term by remember{mutableStateOf("")};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Field(student,{student=it},"Student ID");Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button({vm.transcript(student)},enabled=student.isNotBlank()){Text("Transcript PDF")};OutlinedButton({vm.statement(student,term)},enabled=student.isNotBlank()){Text("Fee statement PDF")}};Field(term,{term=it},"Optional term ID")}}
@Composable private fun FinanceReportsTool(vm:OperationalToolsViewModel){var type by remember{mutableStateOf("Collection")};var first by remember{mutableStateOf("")};var second by remember{mutableStateOf("")};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Row{listOf("Collection","Defaulters","Aging").forEach{FilterChip(selected=type==it,onClick={type=it},label={Text(it)});Spacer(Modifier.width(6.dp))}};Field(first,{first=it},if(type=="Collection")"Start date (YYYY-MM-DD)" else "Term ID");if(type!="Aging")Field(second,{second=it},if(type=="Collection")"End date (YYYY-MM-DD)" else "Minimum outstanding");Button({vm.financeReport(type,first,second)},enabled=type=="Aging"||first.isNotBlank()){Text("Run report")}}}
@Composable private fun ImportTool(jobId:String?,vm:OperationalToolsViewModel,context:Context){var selected by remember{mutableStateOf<PickedDocument?>(null)};var mode by remember{mutableStateOf("CREATE_ONLY")};var autoCreate by remember{mutableStateOf(false)};var commitConfirm by remember{mutableStateOf(false)};val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){uri->selected=uri?.let{describe(context,it)}};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Row{FilterChip(mode=="CREATE_ONLY",{mode="CREATE_ONLY"},{Text("Create only")});Spacer(Modifier.width(8.dp));FilterChip(mode=="UPSERT",{mode="UPSERT"},{Text("Upsert")})};Row{Text("Auto-create academic records");Switch(autoCreate,{autoCreate=it})};OutlinedButton({picker.launch(arrayOf("text/csv","text/comma-separated-values"))}){Text(selected?.displayName ?: "Choose CSV")};Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button({selected?.let{vm.upload(it,mode,autoCreate)}},enabled=selected!=null){Text("Preview")};OutlinedButton(vm::importTemplate){Text("Template")}};jobId?.let{Text("Preview job: $it");Row{Checkbox(commitConfirm,{commitConfirm=it});Text("I reviewed the preview and confirm this import")};Button({vm.commit(it,autoCreate)},enabled=commitConfirm){Text("Commit import")};TextButton({vm.importErrors(it)}){Text("Download error CSV")}}}}
@Composable private fun ImpersonationTool(state:pk.vexel.medsims.core.auth.ImpersonationState?,vm:OperationalToolsViewModel){var id by remember{mutableStateOf("")};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){if(state==null){Text("Enter a non-admin user ID. Nested impersonation is blocked.");Field(id,{id=it},"Target user ID");Button({vm.startImpersonation(id)},enabled=id.isNotBlank()){Text("Start impersonation")}}else{Text("Acting as ${state.targetName} (${state.targetRole})",color=MaterialTheme.colorScheme.error);Button(vm::stopImpersonation){Text("Stop and restore Admin")}}}}
@Composable private fun TimetableGenerator(vm:OperationalToolsViewModel){var batch by remember{mutableStateOf("")};var period by remember{mutableStateOf("")};var confirm by remember{mutableStateOf(false)};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Field(batch,{batch=it},"Batch ID");Field(period,{period=it},"Academic period ID");Row{Checkbox(confirm,{confirm=it});Text("Generate all weekly templates for this period")};Button({vm.generateTimetables(batch,period)},enabled=confirm&&batch.isNotBlank()&&period.isNotBlank()){Text("Generate templates")}}}
@Composable private fun VoucherGenerator(vm:OperationalToolsViewModel){var term by remember{mutableStateOf("")};var due by remember{mutableStateOf("")};var program by remember{mutableStateOf("")};var students by remember{mutableStateOf("")};var fees by remember{mutableStateOf("")};var confirm by remember{mutableStateOf(false)};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Field(term,{term=it},"Term ID");Field(due,{due=it},"Due date (YYYY-MM-DD)");Field(program,{program=it},"Program ID (optional)");Field(students,{students=it},"Student IDs, comma-separated (optional)");Field(fees,{fees=it},"Fee type IDs, comma-separated (optional)");Row{Checkbox(confirm,{confirm=it});Text("Confirm bulk voucher generation")};Button({vm.generateVouchers(term,due,program,students,fees)},enabled=confirm&&term.isNotBlank()&&due.isNotBlank()){Text("Generate vouchers")}}}
@Composable private fun SyllabusReorder(vm:OperationalToolsViewModel){var items by remember{mutableStateOf("[{\"id\":1,\"order_no\":1}]")};var confirm by remember{mutableStateOf(false)};Column(verticalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(items,{items=it},label={Text("Ordered items JSON")},modifier=Modifier.fillMaxWidth(),minLines=4);Row{Checkbox(confirm,{confirm=it});Text("Confirm syllabus reorder")};Button({vm.reorderSyllabus(items)},enabled=confirm){Text("Apply order")}}}
@Composable private fun Field(value:String,change:(String)->Unit,label:String)=OutlinedTextField(value,change,label={Text(label)},singleLine=true,modifier=Modifier.fillMaxWidth())
private fun describe(context:Context,uri:Uri):PickedDocument{var name="students.csv";context.contentResolver.query(uri,arrayOf(OpenableColumns.DISPLAY_NAME),null,null,null)?.use{if(it.moveToFirst())name=it.getString(0)};return PickedDocument(uri.toString(),name,context.contentResolver.getType(uri))}
