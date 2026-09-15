package pk.vexel.medsims.core.staff

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module @InstallIn(SingletonComponent::class)
abstract class StaffBindingModule {
    @Binds abstract fun bindStaffDataSource(repository: StaffRepository): StaffDataSource
}
