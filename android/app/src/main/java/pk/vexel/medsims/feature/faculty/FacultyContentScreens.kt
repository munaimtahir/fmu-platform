package pk.vexel.medsims.feature.faculty

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import pk.vexel.medsims.core.document.PickedDocument
import pk.vexel.medsims.core.network.*
import pk.vexel.medsims.core.ui.AdaptiveWidthContainer

@Composable
fun FacultyGradebookScreen(viewModel: FacultyGradebookViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    var query by remember { mutableStateOf("") }
    var editor by remember { mutableStateOf<FacultyResultDto?>(null) }
    var creating by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { viewModel.load() }
    AdaptiveWidthContainer {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { Text("Gradebook", style = MaterialTheme.typography.headlineSmall) }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(query, { query = it }, label = { Text("Student or exam") }, modifier = Modifier.weight(1f))
                    Button({ viewModel.search(query) }, enabled = !state.loading) { Text("Search") }
                }
            }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error) } }
            state.message?.let { item { Text(it, color = MaterialTheme.colorScheme.primary) } }
            if (state.loading || state.busy) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            item {
                Button(
                    onClick = { creating = true },
                    enabled = !state.busy && state.exams.isNotEmpty() && state.students.isNotEmpty(),
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("New draft result") }
            }
            if (!state.loading && state.results.isEmpty()) item { Text("No gradebook entries found.") }
            items(state.results, key = { it.id }) { result ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(result.student_name.ifBlank { result.student_reg_no }, style = MaterialTheme.typography.titleMedium)
                        Text("${result.student_reg_no} • ${result.exam_title}")
                        Text("${result.total_obtained} / ${result.total_max} • ${result.status} • ${result.final_outcome}")
                        result.component_entries.forEach { component ->
                            Text("${component.exam_component_name}: ${component.marks_obtained} / ${component.exam_component_max_marks}")
                        }
                        if (result.status == "DRAFT") TextButton({ editor = result }) { Text("Edit draft marks") }
                        else Text("Finalized results are read-only on Faculty devices.", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            if (state.resultNextPage != null) item { OutlinedButton(viewModel::loadMoreResults) { Text("Load more results") } }
            if (state.examNextPage != null) item { OutlinedButton(viewModel::loadMoreExams) { Text("Load more exam choices") } }
            if (state.studentNextPage != null) item { OutlinedButton(viewModel::loadMoreStudents) { Text("Load more student choices") } }
        }
    }
    if (creating) GradeEditorDialog(null, state.exams, state.students, state.sections, { creating = false }) { exam, student, obtained, maximum, marks ->
        creating = false
        viewModel.save(null, exam, student, obtained, maximum, marks)
    }
    editor?.let { result ->
        GradeEditorDialog(result, state.exams, state.students, state.sections, { editor = null }) { exam, student, obtained, maximum, marks ->
            editor = null
            viewModel.save(result, exam, student, obtained, maximum, marks)
        }
    }
}

@Composable
private fun GradeEditorDialog(
    existing: FacultyResultDto?,
    exams: List<FacultyExamDto>,
    students: List<FacultyStudentDto>,
    sections: List<FacultySectionDto>,
    dismiss: () -> Unit,
    save: (Long, Long, String, String, Map<Long, String>) -> Unit,
) {
    var examId by remember(existing?.id) { mutableStateOf(existing?.exam ?: exams.firstOrNull()?.id ?: 0) }
    var studentId by remember(existing?.id) { mutableStateOf(existing?.student ?: students.firstOrNull()?.id ?: 0) }
    var obtained by remember(existing?.id) { mutableStateOf(existing?.total_obtained ?: "") }
    var maximum by remember(existing?.id) { mutableStateOf(existing?.total_max ?: "") }
    val marks = remember(existing?.id, examId) { mutableStateMapOf<Long, String>() }
    val exam = exams.firstOrNull { it.id == examId }
    val eligibleGroups = sections.filter { it.academic_period == exam?.academic_period }.mapNotNull { it.group }.toSet()
    val eligibleStudents = if (existing == null) students.filter { it.group in eligibleGroups } else students
    LaunchedEffect(examId, eligibleStudents) {
        if (existing == null && eligibleStudents.none { it.id == studentId }) studentId = eligibleStudents.firstOrNull()?.id ?: 0
    }
    LaunchedEffect(existing?.id, examId) {
        marks.clear()
        existing?.component_entries?.forEach { marks[it.exam_component] = it.marks_obtained }
    }
    AlertDialog(
        onDismissRequest = dismiss,
        title = { Text(if (existing == null) "New draft result" else "Edit draft marks") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    if (existing == null) ChoiceField("Exam", exams, examId, { it.id }, { it.title }) { examId = it }
                    else Text(existing.exam_title, style = MaterialTheme.typography.titleMedium)
                }
                item {
                    if (existing == null) ChoiceField("Student", eligibleStudents, studentId, { it.id }, { "${it.reg_no} — ${it.name}" }) { studentId = it }
                    else Text("${existing.student_reg_no} — ${existing.student_name}")
                }
                item { OutlinedTextField(obtained, { obtained = it }, label = { Text("Total obtained") }, singleLine = true) }
                item { OutlinedTextField(maximum, { maximum = it }, label = { Text("Total maximum") }, singleLine = true) }
                exam?.components?.sortedBy { it.sequence }?.forEach { component ->
                    item(component.id) {
                        OutlinedTextField(
                            marks[component.id].orEmpty(),
                            { marks[component.id] = it },
                            label = { Text("${component.name} (max ${component.max_marks})") },
                            singleLine = true,
                        )
                    }
                }
                item { Text("Saving sends this draft directly to the server. ExamCell retains publish and freeze authority.", style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = { TextButton({ save(examId, studentId, obtained, maximum, marks.toMap()) }) { Text("Save draft") } },
        dismissButton = { TextButton(dismiss) { Text("Cancel") } },
    )
}

@Composable
fun FacultyMaterialsScreen(userId: Long, viewModel: FacultyMaterialsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    var query by remember { mutableStateOf("") }
    var editor by remember { mutableStateOf<LearningMaterialDto?>(null) }
    var creating by remember { mutableStateOf(false) }
    var audienceTarget by remember { mutableStateOf<LearningMaterialDto?>(null) }
    var confirmation by remember { mutableStateOf<Pair<String, LearningMaterialDto>?>(null) }
    var picked by remember { mutableStateOf<PickedDocument?>(null) }
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        picked = uri?.let { describeFacultyDocument(context, it) }
    }
    LaunchedEffect(Unit) { viewModel.load() }
    AdaptiveWidthContainer {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { Text("Learning materials", style = MaterialTheme.typography.headlineSmall) }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(query, { query = it }, label = { Text("Search materials") }, modifier = Modifier.weight(1f))
                    Button({ viewModel.search(query) }, enabled = !state.loading) { Text("Search") }
                }
            }
            state.error?.let { item { Text(it, color = MaterialTheme.colorScheme.error) } }
            state.message?.let { item { Text(it, color = MaterialTheme.colorScheme.primary) } }
            if (state.loading || state.busy) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            item { Button({ picked = null; creating = true }, enabled = !state.busy && state.sections.isNotEmpty(), modifier = Modifier.fillMaxWidth()) { Text("New material") } }
            if (!state.loading && state.materials.isEmpty()) item { Text("No materials found.") }
            items(state.materials, key = { it.id }) { material ->
                val owned = material.created_by == null || material.created_by == userId
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(material.title, style = MaterialTheme.typography.titleMedium)
                        Text("${material.kind} • ${material.status}")
                        material.description.takeIf(String::isNotBlank)?.let { Text(it) }
                        material.url?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                        Text("Audiences: ${material.audiences.size}")
                        material.audiences.forEach { audience ->
                            val section = state.sections.firstOrNull { it.id == audience.section }
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(section?.let { "${it.course_code ?: it.course_name} — ${it.name}" } ?: "Section ${audience.section}")
                                if (owned && material.status == "DRAFT") TextButton({ viewModel.deleteAudience(audience.id) }) { Text("Remove") }
                            }
                        }
                        if (owned) Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            if (material.status == "DRAFT") {
                                TextButton({ editor = material }) { Text("Edit") }
                                TextButton({ audienceTarget = material }) { Text("Add section") }
                                TextButton({ confirmation = "publish" to material }) { Text("Publish") }
                                TextButton({ confirmation = "delete" to material }) { Text("Delete") }
                            } else if (material.status != "ARCHIVED") {
                                TextButton({ confirmation = "archive" to material }) { Text("Archive") }
                            }
                        }
                    }
                }
            }
            if (state.materialNextPage != null) item { OutlinedButton(viewModel::loadMoreMaterials) { Text("Load more materials") } }
            if (state.sectionNextPage != null) item { OutlinedButton(viewModel::loadMoreSections) { Text("Load more teaching sections") } }
        }
    }
    if (creating) MaterialEditorDialog(null, state.sections, picked, { picker.launch(arrayOf("application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) }, { creating = false }) { title, description, url, section, from, until ->
        creating = false
        viewModel.create(title, description, url, picked, section, from, until)
        picked = null
    }
    editor?.let { material ->
        MaterialEditorDialog(material, state.sections, null, {}, { editor = null }) { title, description, url, _, from, until ->
            editor = null
            viewModel.update(material, title, description, url, from, until)
        }
    }
    audienceTarget?.let { material ->
        var sectionId by remember(material.id) { mutableStateOf(state.sections.firstOrNull()?.id ?: 0) }
        AlertDialog(
            onDismissRequest = { audienceTarget = null },
            title = { Text("Add teaching section") },
            text = { ChoiceField("Section", state.sections, sectionId, { it.id }, { "${it.course_code ?: it.course_name} — ${it.name}" }) { sectionId = it } },
            confirmButton = { TextButton({ audienceTarget = null; viewModel.addAudience(material.id, sectionId) }) { Text("Add") } },
            dismissButton = { TextButton({ audienceTarget = null }) { Text("Cancel") } },
        )
    }
    confirmation?.let { (action, material) ->
        AlertDialog(
            onDismissRequest = { confirmation = null },
            title = { Text("Confirm ${action.replaceFirstChar(Char::uppercase)}") },
            text = { Text("This $action action is sent to the server immediately and is not queued offline.") },
            confirmButton = { TextButton({ confirmation = null; when (action) { "publish" -> viewModel.publish(material); "archive" -> viewModel.archive(material); else -> viewModel.delete(material) } }) { Text("Confirm") } },
            dismissButton = { TextButton({ confirmation = null }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun MaterialEditorDialog(
    existing: LearningMaterialDto?,
    sections: List<FacultySectionDto>,
    picked: PickedDocument?,
    chooseFile: () -> Unit,
    dismiss: () -> Unit,
    save: (String, String, String, Long?, String, String) -> Unit,
) {
    var title by remember(existing?.id) { mutableStateOf(existing?.title.orEmpty()) }
    var description by remember(existing?.id) { mutableStateOf(existing?.description.orEmpty()) }
    var url by remember(existing?.id) { mutableStateOf(existing?.url.orEmpty()) }
    var fileMode by remember(existing?.id) { mutableStateOf(existing?.kind == "FILE") }
    var sectionId by remember(existing?.id) { mutableStateOf(sections.firstOrNull()?.id ?: 0) }
    var from by remember(existing?.id) { mutableStateOf(existing?.available_from.orEmpty()) }
    var until by remember(existing?.id) { mutableStateOf(existing?.available_until.orEmpty()) }
    AlertDialog(
        onDismissRequest = dismiss,
        title = { Text(if (existing == null) "New learning material" else "Edit draft material") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item { OutlinedTextField(title, { title = it }, label = { Text("Title") }) }
                item { OutlinedTextField(description, { description = it }, label = { Text("Description") }) }
                if (existing == null) item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { FilterChip(!fileMode, { fileMode = false }, { Text("Link") }); FilterChip(fileMode, { fileMode = true }, { Text("File") }) } }
                if (fileMode) item {
                    if (existing == null) OutlinedButton(chooseFile) { Text(if (picked == null) "Choose file" else "Selected: ${picked.displayName}") }
                    else Text("Existing file retained: ${existing.file?.substringAfterLast('/') ?: existing.title}")
                }
                else item { OutlinedTextField(url, { url = it }, label = { Text("HTTPS link") }) }
                if (existing == null) item { ChoiceField("Teaching section", sections, sectionId, { it.id }, { "${it.course_code ?: it.course_name} — ${it.name}" }) { sectionId = it } }
                item { OutlinedTextField(from, { from = it }, label = { Text("Available from (ISO date-time, optional)") }) }
                item { OutlinedTextField(until, { until = it }, label = { Text("Available until (ISO date-time, optional)") }) }
            }
        },
        confirmButton = { TextButton({ save(title, description, url, sectionId.takeIf { existing == null }, from, until) }) { Text("Save draft") } },
        dismissButton = { TextButton(dismiss) { Text("Cancel") } },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun <T> ChoiceField(label: String, choices: List<T>, selectedId: Long, id: (T) -> Long, text: (T) -> String, select: (Long) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded, { expanded = it }) {
        OutlinedTextField(
            choices.firstOrNull { id(it) == selectedId }?.let(text).orEmpty(),
            {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.menuAnchor(MenuAnchorType.PrimaryNotEditable).fillMaxWidth(),
        )
        ExposedDropdownMenu(expanded, { expanded = false }) {
            choices.forEach { choice -> DropdownMenuItem({ Text(text(choice)) }, { expanded = false; select(id(choice)) }) }
        }
    }
}

private fun describeFacultyDocument(context: Context, uri: Uri): PickedDocument {
    var name: String? = null
    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
        if (cursor.moveToFirst()) name = cursor.getString(0)
    }
    return PickedDocument(uri.toString(), name?.take(120) ?: "document", context.contentResolver.getType(uri))
}
