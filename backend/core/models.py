from __future__ import annotations

from django.db import models


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
