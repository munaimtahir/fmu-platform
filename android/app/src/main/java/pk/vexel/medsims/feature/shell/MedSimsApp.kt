package pk.vexel.medsims.feature.shell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import pk.vexel.medsims.feature.attendance.AttendanceScreen
import pk.vexel.medsims.feature.auth.LoginScreen
import pk.vexel.medsims.feature.home.HomeScreen
import pk.vexel.medsims.feature.profile.ProfileScreen
import pk.vexel.medsims.feature.results.ResultsScreen
import pk.vexel.medsims.feature.timetable.TimetableScreen

@Composable fun MedSimsApp(viewModel: SessionViewModel = hiltViewModel()) {
    val session by viewModel.state.collectAsState()
    when (val state = session) { SessionState.Initializing -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(); Text("Preparing MedSIMS", Modifier.padding(top = 72.dp)) }
        SessionState.Unauthenticated, SessionState.Expired -> LoginScreen(viewModel::authenticated)
        is SessionState.Authenticated -> Shell(state.user, viewModel::logout) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun Shell(user: UserDto, logout: () -> Unit) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    Scaffold(
        topBar = { TopAppBar(title = { Text("Vexel MedSIMS") }) },
        bottomBar = {
            NavigationBar {
                Destination.bottomNavItems.forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = { navController.navigate(destination.route) { launchSingleTop = true; restoreState = true; popUpTo(navController.graph.findStartDestination().id) { saveState = true } } },
                        icon = { Text(destination.label.take(1)) },
                        label = { Text(destination.label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(navController, startDestination = Destination.Home.route, modifier = Modifier.padding(padding)) {
            composable(Destination.Home.route) { HomeScreen(
                onOpenTimetable = { navController.navigate(Destination.Timetable.route) { launchSingleTop = true } },
                onOpenAttendance = { navController.navigate(Destination.Attendance.route) { launchSingleTop = true } },
                onOpenResults = { navController.navigate(Destination.Results.route) { launchSingleTop = true } },
            ) }
            composable(Destination.Timetable.route) { TimetableScreen() }
            composable(Destination.Attendance.route) { AttendanceScreen() }
            composable(Destination.Results.route) { ResultsScreen() }
            composable(Destination.Profile.route) { ProfileScreen(user, logout) }
        }
    }
}
