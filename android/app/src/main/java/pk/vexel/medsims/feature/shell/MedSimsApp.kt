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
import pk.vexel.medsims.BuildConfig

@Composable fun MedSimsApp(viewModel: SessionViewModel = hiltViewModel()) {
    val session by viewModel.state.collectAsState()
    when (val state = session) { SessionState.Initializing -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(); Text("Preparing MedSIMS", Modifier.padding(top = 72.dp)) }
        SessionState.Unauthenticated, SessionState.Expired -> LoginScreen(viewModel::authenticated)
        is SessionState.Authenticated -> Shell(state.user, viewModel::logout, viewModel::updateUser) }
}

/**
 * [widthSizeClass] takes a real window default but is an overridable parameter so androidTest can
 * exercise the rail-vs-bottom-bar branch directly without needing to resize a real window/emulator.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun Shell(user: UserDto, logout: () -> Unit, onUserUpdated: (UserDto) -> Unit = {}, widthSizeClass: WindowWidthSizeClass = currentWindowWidthSizeClass()) {
    val navController = rememberNavController()
    val destinations = remember(user.role) { Destination.forRole(normalizeRole(user.role), BuildConfig.ENABLE_FACULTY) }
    val isStudent = normalizeRole(user.role) == pk.vexel.medsims.core.network.AppRole.STUDENT
    val isFaculty = normalizeRole(user.role) == pk.vexel.medsims.core.network.AppRole.FACULTY && BuildConfig.ENABLE_FACULTY
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val useRail = widthSizeClass != WindowWidthSizeClass.COMPACT
    val navigate: (Destination) -> Unit = { destination ->
        navController.navigate(destination.route) { launchSingleTop = true; restoreState = true; popUpTo(navController.graph.findStartDestination().id) { saveState = true } }
    }
    Scaffold(
        topBar = { TopAppBar(title = { Text("Vexel MedSIMS") }) },
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
                if (isFaculty) composable(Destination.FacultyAttendance.route) { FacultyAttendanceScreen() }
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
