package pk.vexel.medsims.feature.shell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import pk.vexel.medsims.core.auth.SessionState
import pk.vexel.medsims.core.auth.SessionViewModel
import pk.vexel.medsims.core.network.UserDto
import pk.vexel.medsims.core.network.normalizeRole
import pk.vexel.medsims.core.ui.WindowWidthSizeClass
import pk.vexel.medsims.core.ui.currentWindowWidthSizeClass
import pk.vexel.medsims.feature.attendance.AttendanceScreen
import pk.vexel.medsims.feature.auth.LoginScreen
import pk.vexel.medsims.feature.home.HomeScreen
import pk.vexel.medsims.feature.profile.ProfileScreen
import pk.vexel.medsims.feature.results.ResultsScreen
import pk.vexel.medsims.feature.timetable.TimetableScreen
import pk.vexel.medsims.feature.student.StudentServicesScreen
import pk.vexel.medsims.feature.faculty.FacultyHomeScreen
import pk.vexel.medsims.feature.faculty.FacultyAttendanceScreen
import pk.vexel.medsims.feature.faculty.FacultyGradebookScreen
import pk.vexel.medsims.feature.faculty.FacultyMaterialsScreen
import pk.vexel.medsims.BuildConfig
import pk.vexel.medsims.core.network.AppRole
import pk.vexel.medsims.feature.staff.*

@Composable fun MedSimsApp(viewModel: SessionViewModel = hiltViewModel()) {
    val session by viewModel.state.collectAsState()
    val impersonation by viewModel.impersonation.collectAsState()
    when (val state = session) { SessionState.Initializing -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(); Text("Preparing MedSIMS", Modifier.padding(top = 72.dp)) }
        SessionState.Unauthenticated, SessionState.Expired -> LoginScreen(viewModel::authenticated)
        is SessionState.Authenticated -> Shell(state.user, viewModel::logout, viewModel::updateUser,access=state.access,impersonation=impersonation) }
}

/**
 * [widthSizeClass] takes a real window default but is an overridable parameter so androidTest can
 * exercise the rail-vs-bottom-bar branch directly without needing to resize a real window/emulator.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun Shell(user: UserDto, logout: () -> Unit, onUserUpdated: (UserDto) -> Unit = {}, widthSizeClass: WindowWidthSizeClass = currentWindowWidthSizeClass(),access:pk.vexel.medsims.core.network.AccessContextDto?=null,impersonation:pk.vexel.medsims.core.auth.ImpersonationState?=null) {
    val navController = rememberNavController()
    val destinations = remember(user.role) { Destination.forRole(normalizeRole(user.role), BuildConfig.ENABLE_FACULTY) }
    val isStudent = normalizeRole(user.role) == pk.vexel.medsims.core.network.AppRole.STUDENT
    val isFaculty = normalizeRole(user.role) == pk.vexel.medsims.core.network.AppRole.FACULTY && BuildConfig.ENABLE_FACULTY
    val role = normalizeRole(user.role)
    val staffModules = remember(role,access) { when(role) {
        AppRole.REGISTRAR -> StaffCatalog.registrar
        AppRole.COORDINATOR -> StaffCatalog.coordinator
        AppRole.EXAM_CELL -> StaffCatalog.exam
        AppRole.FINANCE -> StaffCatalog.finance
        AppRole.ADMIN -> StaffCatalog.registrar + StaffCatalog.coordinator + StaffCatalog.exam + StaffCatalog.finance + StaffCatalog.admin
        else -> emptyList()
    }.distinctBy { it.key }.let{modules->val tasks=access?.tasks?.map{it.code}.orEmpty();if(tasks.isEmpty()||role==AppRole.ADMIN)modules else modules.filter{module->moduleTaskPrefixes(module).any{prefix->tasks.any{it.startsWith(prefix)}}}} }
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val useRail = widthSizeClass != WindowWidthSizeClass.COMPACT
    val navigate: (Destination) -> Unit = { destination ->
        navController.navigate(destination.route) { launchSingleTop = true; restoreState = true; popUpTo(navController.graph.findStartDestination().id) { saveState = true } }
    }
    Scaffold(
        topBar = { Column{TopAppBar(title = { Text("Vexel MedSIMS") });if(impersonation!=null)Surface(color=MaterialTheme.colorScheme.errorContainer,modifier=Modifier.fillMaxWidth()){Text("Acting as ${impersonation.targetName} (${impersonation.targetRole}) • Operations → Impersonation to stop",Modifier.padding(10.dp),color=MaterialTheme.colorScheme.onErrorContainer)}} },
        bottomBar = {
            if (!useRail) {
                NavigationBar {
                    destinations.forEach { destination ->
                        NavigationBarItem(
                            selected = currentRoute == destination.route,
                            onClick = { navigate(destination) },
                            icon = { Text(destination.label.take(1)) },
                            label = { Text(destination.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        Row(Modifier.padding(padding).fillMaxSize()) {
            if (useRail) {
                NavigationRail(Modifier.semantics { contentDescription = "Navigation rail" }) {
                    destinations.forEach { destination ->
                        NavigationRailItem(
                            selected = currentRoute == destination.route,
                            onClick = { navigate(destination) },
                            icon = { Text(destination.label.take(1)) },
                            label = { Text(destination.label) },
                        )
                    }
                }
            }
            NavHost(navController, startDestination = destinations.first().route, modifier = Modifier.weight(1f)) {
                composable(Destination.Home.route) {
                    if (isStudent) HomeScreen(
                        onOpenTimetable = { navController.navigate(Destination.Timetable.route) { launchSingleTop = true } },
                        onOpenAttendance = { navController.navigate(Destination.Attendance.route) { launchSingleTop = true } },
                        onOpenResults = { navController.navigate(Destination.Results.route) { launchSingleTop = true } },
                    ) else if (isFaculty) FacultyHomeScreen() else RoleWorkspaceScreen(user)
                }
                if (isStudent) {
                    composable(Destination.Timetable.route) { TimetableScreen() }
                    composable(Destination.Attendance.route) { AttendanceScreen() }
                    composable(Destination.Results.route) { ResultsScreen() }
                    composable(Destination.StudentServices.route) { StudentServicesScreen(user) }
                }
                if (isFaculty) {
                    composable(Destination.FacultyAttendance.route) { FacultyAttendanceScreen() }
                    composable(Destination.FacultyGradebook.route) { FacultyGradebookScreen() }
                    composable(Destination.FacultyMaterials.route) { FacultyMaterialsScreen(user.id) }
                }
                if (staffModules.isNotEmpty()) {
                    composable(Destination.Operations.route) { StaffHomeScreen(user.role, staffModules) { navController.navigate("staff/${it.key}") } }
                    composable("staff/{module}") { entry -> staffModules.firstOrNull { it.key == entry.arguments?.getString("module") }?.let { StaffModuleScreen(it) } }
                }
                composable(Destination.Profile.route) { ProfileScreen(user, logout, if (isStudent) ({ navController.navigate(Destination.StudentServices.route) }) else null, onUserUpdated) }
            }
        }
    }
}

@Composable private fun RoleWorkspaceScreen(user: UserDto) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${user.role} workspace", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(8.dp))
            Text("This role's native workflows are being released in staged parity deliveries.", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

private fun moduleTaskPrefixes(module:StaffModule):List<String> = when(module.key){
    "students","placement","imports"->listOf("students.")
    "people","contacts","addresses","identities"->listOf("people.")
    "programs","batches","periods","groups","departments"->listOf("academics.")
    "timetables","timetable-entries","timetable-generator"->listOf("timetable.")
    "eligibility"->listOf("attendance.","students.")
    "exams","exam-components"->listOf("exams.")
    "results","result-components","corrections","transcripts"->listOf("results.")
    "fee-types","fee-plans","vouchers","voucher-generator","payments","ledger","adjustments","policies","finance-reports"->listOf("finance.")
    "audit"->listOf("audit.")
    "roles","role-tasks","user-tasks"->listOf("core.")
    else->listOf("admin.")
}
