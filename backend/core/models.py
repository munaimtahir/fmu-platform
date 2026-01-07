from __future__ import annotations

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError


class TimeStampedModel(models.Model):
    """An abstract base class model that provides self-updating `created_at` and
    `updated_at` fields.
    """

    created_at = models.DateTimeField(auto_now_add=True, help_text="The timestamp when the record was created.")
    updated_at = models.DateTimeField(auto_now=True, help_text="The timestamp when the record was last updated.")

    class Meta:
        """Meta options for the TimeStampedModel."""
        abstract = True
        ordering = ("-created_at",)

    def touch(
        self, using: str | None = None, update_fields: set[str] | None = None
    ) -> None:
        """
        Updates the `updated_at` timestamp to the current time.

        This method forces a save to the database, which automatically
        updates the `updated_at` field. It can be useful when an object's
        state has changed in a way that doesn't involve a standard field
        update but should be recorded.

        Args:
            using (str, optional): The database alias to use for the save.
                Defaults to None.
            update_fields (set[str], optional): A set of fields to update.
                If provided, only these fields will be saved to the database.
                Defaults to None, which saves all fields.
        """
        # Call save with appropriate arguments to update the timestamp
        if update_fields is not None:
            self.save(using=using, update_fields=list(update_fields))
        else:
            self.save(using=using)


class Profile(TimeStampedModel):
    """User profile extension with basic personal information"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        help_text="Associated user account",
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number",
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Date of birth",
    )

    def __str__(self) -> str:
        return f"Profile for {self.user.username}"


class FacultyProfile(TimeStampedModel):
    """Faculty-specific profile with department assignment"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="faculty_profile",
        help_text="Associated faculty user account",
    )
    department = models.ForeignKey(
        "academics.Department",
        on_delete=models.PROTECT,
        related_name="faculty_profiles",
        null=True,
        blank=True,
        help_text="Department this faculty member belongs to",
    )

    class Meta:
        verbose_name_plural = "Faculty profiles"

    def __str__(self) -> str:
        dept_name = self.department.name if self.department else "No department"
        return f"Faculty profile for {self.user.username} ({dept_name})"


class Role(TimeStampedModel):
    """Role model for RBAC system"""

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Role name (e.g., Admin, Student, Faculty)",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of the role's purpose and responsibilities",
    )
    is_system_role = models.BooleanField(
        default=False,
        help_text="True for built-in system roles that cannot be deleted",
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        if self.is_system_role and self.pk:
            # Prevent renaming system roles
            original = Role.objects.get(pk=self.pk)
            if original.name != self.name:
                raise ValidationError("Cannot rename system roles")

    def delete(self, *args, **kwargs):
        if self.is_system_role:
            raise ValidationError("Cannot delete system roles")
        super().delete(*args, **kwargs)


class PermissionTask(TimeStampedModel):
    """Permission task model for task-based RBAC"""

    code = models.CharField(
        max_length=200,
        unique=True,
        help_text="Unique task code (e.g., 'students.view', 'enrollment.create')",
    )
    name = models.CharField(
        max_length=255,
        help_text="Human-readable task name",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of what this permission task allows",
    )
    module = models.CharField(
        max_length=100,
        help_text="Module this task belongs to (e.g., 'students', 'enrollment')",
    )

    class Meta:
        ordering = ["module", "code"]
        indexes = [
            models.Index(fields=["module"]),
            models.Index(fields=["code"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} ({self.name})"


class RoleTaskAssignment(TimeStampedModel):
    """Assignment of permission tasks to roles"""

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="task_assignments",
        help_text="Role being assigned tasks",
    )
    task = models.ForeignKey(
        PermissionTask,
        on_delete=models.CASCADE,
        related_name="role_assignments",
        help_text="Permission task being assigned",
    )

    class Meta:
        unique_together = [["role", "task"]]
        indexes = [
            models.Index(fields=["role", "task"]),
        ]

    def __str__(self) -> str:
        return f"{self.role.name} → {self.task.code}"


class UserTaskAssignment(TimeStampedModel):
    """Direct assignment of permission tasks to users (override role defaults)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_assignments",
        help_text="User being assigned a task",
    )
    task = models.ForeignKey(
        PermissionTask,
        on_delete=models.CASCADE,
        related_name="user_assignments",
        help_text="Permission task being assigned",
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_task_assignments",
        help_text="User who granted this task",
    )

    class Meta:
        unique_together = [["user", "task"]]
        indexes = [
            models.Index(fields=["user", "task"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} → {self.task.code}"
