package pk.vexel.medsims.feature.shell

sealed class Destination(val route: String, val label: String) {
    data object Home: Destination("home", "Home")
    data object Timetable: Destination("timetable", "Timetable")
    data object Attendance: Destination("attendance", "Attendance")
    data object Results: Destination("results", "Results")
    data object Profile: Destination("profile", "Profile")

    companion object { val bottomNavItems = listOf(Home, Timetable, Attendance, Results, Profile) }
}
