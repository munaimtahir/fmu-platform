package pk.vexel.medsims.feature.shell

import org.junit.Assert.assertEquals
import org.junit.Test
import pk.vexel.medsims.core.network.AppRole

class DestinationsTest {
    @Test fun student_receives_only_student_workflows_and_profile() {
        assertEquals(
            listOf(Destination.Home, Destination.Timetable, Destination.Attendance, Destination.Results, Destination.Profile),
            Destination.forRole(AppRole.STUDENT),
        )
    }

    @Test fun non_student_roles_cannot_reach_student_scoped_destinations() {
        listOf(AppRole.ADMIN, AppRole.REGISTRAR, AppRole.EXAM_CELL, AppRole.FINANCE, AppRole.FACULTY, AppRole.COORDINATOR, AppRole.UNKNOWN)
            .forEach { role -> assertEquals(listOf(Destination.Home, Destination.Profile), Destination.forRole(role)) }
    }
}
