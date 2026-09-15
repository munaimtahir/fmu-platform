package pk.vexel.medsims.feature.staff

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StaffCatalogTest {
    @Test fun phase_three_catalog_has_records_lifecycle_import_and_eligibility(){
        val keys=(StaffCatalog.registrar+StaffCatalog.coordinator).map{it.key}.toSet()
        assertTrue(keys.containsAll(setOf("students","people","contacts","addresses","identities","programs","batches","periods","groups","departments","timetables","timetable-entries","imports","placement","eligibility")))
    }
    @Test fun phase_four_catalog_has_guarded_result_and_finance_workflows(){
        assertEquals(setOf("Verify","Publish","Freeze"),StaffCatalog.exam.first{it.key=="results"}.actions.map{it.label}.toSet())
        assertTrue(StaffCatalog.finance.first{it.key=="payments"}.actions.first{it.label=="Reverse"}.dangerous)
        assertTrue(StaffCatalog.finance.any{it.key=="finance-reports"})
    }
    @Test fun phase_five_catalog_has_governance_and_impersonation(){
        val keys=StaffCatalog.admin.map{it.key}.toSet()
        assertTrue(keys.containsAll(setOf("dashboard","users","roles","role-tasks","user-tasks","audit","settings","settings-allowed","syllabus","syllabus-reorder","impersonation")))
    }
}
