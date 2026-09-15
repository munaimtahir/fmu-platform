package pk.vexel.medsims.feature.shell

import pk.vexel.medsims.core.network.AppRole

sealed class Destination(val route: String, val label: String) {
    data object Home: Destination("home", "Home")
    data object Timetable: Destination("timetable", "Timetable")
    data object Attendance: Destination("attendance", "Attendance")
    data object Results: Destination("results", "Results")
    data object Profile: Destination("profile", "Profile")
    data object StudentServices: Destination("student-services", "Services")
    data object FacultyAttendance: Destination("faculty-attendance", "Attendance")
    data object Operations: Destination("operations", "Operations")

    companion object {
        /**
         * Navigation is a usability aid, not authorization.  The API remains the authority for
         * every request, but this prevents a staff session from accidentally entering one of the
         * student-scoped screens (which require a student id and call student-only APIs).
         */
        fun forRole(role: AppRole, facultyEnabled: Boolean = true): List<Destination> = when (role) {
            AppRole.STUDENT -> listOf(Home, Timetable, Attendance, Results, Profile)
            AppRole.FACULTY -> if (facultyEnabled) listOf(Home, FacultyAttendance, Profile) else listOf(Home, Profile)
            AppRole.REGISTRAR, AppRole.COORDINATOR, AppRole.EXAM_CELL, AppRole.FINANCE, AppRole.ADMIN -> listOf(Home, Operations, Profile)
            else -> listOf(Home, Profile)
        }
    }
}
