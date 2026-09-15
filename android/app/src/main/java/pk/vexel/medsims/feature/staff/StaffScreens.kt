package pk.vexel.medsims.feature.staff

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.serialization.json.*
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer

@Composable fun StaffHomeScreen(role:String, modules:List<StaffModule>, open:(StaffModule)->Unit) {
    AdaptiveWidthContainer { LazyColumn(Modifier.fillMaxSize(), contentPadding=PaddingValues(24.dp), verticalArrangement=Arrangement.spacedBy(12.dp)) {
        item { Text("$role workspace", style=MaterialTheme.typography.headlineSmall); Text("Production operations available to your account") }
        items(modules, key={it.key}) { module -> Card(onClick={open(module)}, modifier=Modifier.fillMaxWidth()) { Column(Modifier.padding(18.dp)){Text(module.title, style=MaterialTheme.typography.titleMedium);Text("Open ${module.title.lowercase()}") } } }
    } }
}

@Composable fun StaffModuleScreen(module:StaffModule, viewModel:StaffWorkspaceViewModel=hiltViewModel()) {
    if(module.tool!=null){OperationalToolScreen(module);return}
    val state by viewModel.state.collectAsState(); var editor by remember{mutableStateOf<Pair<String,JsonObject?>?>(null)}; var pending by remember{mutableStateOf<Pair<String,StaffAction>?>(null)};var query by remember{mutableStateOf("")}
    val context=LocalContext.current
    LaunchedEffect(module.key){viewModel.load(module)}
    LaunchedEffect(state.readyDocument){state.readyDocument?.let{doc->try{context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW).apply{setDataAndType(android.net.Uri.parse(doc.uri),doc.mimeType);addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)});viewModel.documentOpened()}catch(_:android.content.ActivityNotFoundException){}}}
    AdaptiveWidthContainer { LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(20.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        item { Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(module.title,style=MaterialTheme.typography.headlineSmall); if(module.canCreate) Button({editor="" to null}){Text("Create")}} }
        item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(query,{query=it},label={Text("Search")},singleLine=true,modifier=Modifier.weight(1f));Button({viewModel.load(module,query)}){Text("Search")}}}
        if(module.key=="audit")item{OutlinedButton({viewModel.download("api/audit/export/","audit-events.csv")}){Text("Export filtered audit CSV")}}
        state.error?.let{item{Text(it,color=MaterialTheme.colorScheme.error);OutlinedButton({viewModel.load(module)}){Text("Retry")}}}; state.message?.let{item{Text(it,color=MaterialTheme.colorScheme.primary)}}
        if(state.loading)item{LinearProgressIndicator(Modifier.fillMaxWidth())}
        if(!state.loading&&state.rows.isEmpty())item{Text("No records found.")}
        items(state.rows,key={it["id"]?.toString()?:it.hashCode()}) { row ->
            val id=row["id"]?.jsonPrimitive?.content.orEmpty(); Card(Modifier.fillMaxWidth()){Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
                Text(title(row),style=MaterialTheme.typography.titleMedium); summary(row).forEach{Text(it,style=MaterialTheme.typography.bodySmall)}
                Column{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(4.dp)){ if(module.canEdit) TextButton({editor=id to row}){Text("Edit")}; if(module.canDelete) TextButton({pending=id to StaffAction("Delete","",true)}){Text("Delete")}};module.actions.chunked(2).forEach{actions->Row{actions.forEach{a->TextButton({pending=id to a}){Text(a.label)}}}}}
            }}
        }
        state.next?.let{item{OutlinedButton(viewModel::loadMore,enabled=!state.loading){Text("Load more")}}}
    } }
    editor?.let{(id,row)->StaffForm(module,row,{editor=null}){value->editor=null;if(id.isBlank())viewModel.create(value) else viewModel.update(id,value)}}
    pending?.let{(id,a)->ActionDialog(a,{pending=null}){values->pending=null;if(a.label=="Delete")viewModel.delete(id)else viewModel.action(id,a,values)}}
}

private fun title(row:JsonObject):String = listOf("name","title","username","reg_no","code","voucher_no","receipt_no","key").firstNotNullOfOrNull{row[it]?.jsonPrimitive?.contentOrNull} ?: "Record ${row["id"]?.jsonPrimitive?.content.orEmpty()}"
private fun summary(row:JsonObject)=row.entries.filter{it.key !in setOf("id","name","title","username","reg_no","code") && it.value is JsonPrimitive}.take(4).map{"${it.key.replace('_',' ')}: ${(it.value as JsonPrimitive).content}"}

@Composable private fun StaffForm(module:StaffModule,row:JsonObject?,dismiss:()->Unit,save:(Map<String,String>)->Unit){
    val values=remember(module.key,row){mutableStateMapOf<String,String>().apply{module.fields.forEach{f->put(f.name,row?.get(f.name)?.let{if(it is JsonPrimitive)it.content else it.toString()}.orEmpty())}}}
    val valid=module.fields.filter{it.required}.all{!values[it.name].isNullOrBlank()}
    AlertDialog(onDismissRequest=dismiss,title={Text(if(row==null)"Create ${module.title}" else "Edit ${module.title}")},text={LazyColumn(Modifier.heightIn(max=520.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){items(module.fields,key={it.name}){f->when(f.kind){StaffFieldKind.BOOLEAN->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(f.label);Switch(values[f.name].toBoolean(),{values[f.name]=it.toString()})};else->OutlinedTextField(values[f.name].orEmpty(),{values[f.name]=it},label={Text(f.label+(if(f.required)" *" else ""))},singleLine=f.name !in setOf("items","proposed_changes","learning_objectives","value_json"),modifier=Modifier.fillMaxWidth())}}}},confirmButton={TextButton({save(values.toMap())},enabled=valid){Text("Save")}},dismissButton={TextButton(dismiss){Text("Cancel")}})
}
@Composable private fun ActionDialog(action:StaffAction,dismiss:()->Unit,confirm:(Map<String,String>)->Unit){var typed by remember{mutableStateOf("")};val values=remember(action.label){mutableStateMapOf<String,String>().apply{action.fields.filter{it.kind==StaffFieldKind.BOOLEAN}.forEach{put(it.name,"true")}}};val valid=action.fields.filter{it.required}.all{!values[it.name].isNullOrBlank()};AlertDialog(onDismissRequest=dismiss,title={Text("Confirm ${action.label}")},text={LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp)){item{Text(if(action.dangerous)"This operation can affect authoritative records. Type CONFIRM to continue." else "Continue with this operation?")};items(action.fields,key={it.name}){f->if(f.kind==StaffFieldKind.BOOLEAN)Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(f.label);Switch(values[f.name].toBoolean(),{values[f.name]=it.toString()})}else OutlinedTextField(values[f.name].orEmpty(),{values[f.name]=it},label={Text(f.label+(if(f.required)" *" else ""))},modifier=Modifier.fillMaxWidth())};if(action.dangerous)item{OutlinedTextField(typed,{typed=it},label={Text("Confirmation")})}}},confirmButton={TextButton({confirm(values.toMap())},enabled=valid&&(!action.dangerous||typed=="CONFIRM")){Text(action.label)}},dismissButton={TextButton(dismiss){Text("Cancel")}})}
