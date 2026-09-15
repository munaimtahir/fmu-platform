package pk.vexel.medsims.core.faculty

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module @InstallIn(SingletonComponent::class)
abstract class FacultyBindingModule {
    @Binds abstract fun bindFacultyDataSource(impl: FacultyRepository): FacultyDataSource
}
