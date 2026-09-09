package pk.vexel.medsims

import org.junit.Assert.assertEquals
import org.junit.Test
import pk.vexel.medsims.core.network.AppRole
import pk.vexel.medsims.core.network.ErrorKind
import pk.vexel.medsims.core.network.errorKind
import pk.vexel.medsims.core.network.normalizeRole

class FoundationTest {
    @Test fun roles_are_normalized() { assertEquals(AppRole.OFFICE_ASSISTANT, normalizeRole("Office Assistant")); assertEquals(AppRole.UNKNOWN, normalizeRole("FutureRole")) }
    @Test fun errors_are_classified() { assertEquals(ErrorKind.UNAUTHORIZED, errorKind(401)); assertEquals(ErrorKind.SERVER, errorKind(503)) }
}
