"""Syllabus models."""
from django.core.exceptions import ValidationError
from django.db import models

from core.models import TimeStampedModel


class SyllabusItem(TimeStampedModel):
    """
    Syllabus item attached to academic hierarchy nodes.
    
    Can be attached to:
    - Program (top level)
    - Period (within a program)
    - LearningBlock (within a period/track)
    - Module (within an integrated block)
    """
    
    # Academic hierarchy anchors (at least one must be set)
    program = models.ForeignKey(
        "academics.Program",
        on_delete=models.CASCADE,
        related_name="syllabus_items",
        null=True,
        blank=True,
        help_text="Program this syllabus item belongs to (top level)",
    )
    period = models.ForeignKey(
        "academics.Period",
        on_delete=models.CASCADE,
        related_name="syllabus_items",
        null=True,
        blank=True,
        help_text="Period this syllabus item belongs to",
    )
    learning_block = models.ForeignKey(
        "academics.LearningBlock",
        on_delete=models.CASCADE,
        related_name="syllabus_items",
        null=True,
        blank=True,
        help_text="Learning block this syllabus item belongs to",
    )
    module = models.ForeignKey(
        "academics.Module",
        on_delete=models.CASCADE,
        related_name="syllabus_items",
        null=True,
        blank=True,
        help_text="Module this syllabus item belongs to",
    )
    
    # Syllabus content
    title = models.CharField(
        max_length=255,
        help_text="Syllabus item title",
    )
    code = models.CharField(
        max_length=32,
        blank=True,
        help_text="Optional syllabus item code",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of the syllabus item",
    )
    learning_objectives = models.TextField(
        blank=True,
        help_text="Learning objectives for this item",
    )
    order_no = models.PositiveIntegerField(
        default=1,
        help_text="Order/sequence number (>= 1)",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this syllabus item is active",
    )
    
    class Meta:
        ordering = ["order_no", "title"]
        indexes = [
            models.Index(fields=["program", "is_active"]),
            models.Index(fields=["period", "is_active"]),
            models.Index(fields=["learning_block", "is_active"]),
            models.Index(fields=["module", "is_active"]),
            models.Index(fields=["order_no"]),
        ]
    
    def __str__(self):
        anchor = self.module or self.learning_block or self.period or self.program
        return f"{self.title} ({anchor})"
    
    def clean(self):
        """Validate that at least one anchor is set."""
        anchors = [self.program, self.period, self.learning_block, self.module]
        if not any(anchors):
            raise ValidationError("At least one academic anchor (program, period, block, or module) must be set.")
        
        if self.order_no < 1:
            raise ValidationError("order_no must be >= 1")
        
        # Validate hierarchy consistency if multiple anchors are set
        if self.module and self.learning_block:
            if self.module.block != self.learning_block:
                raise ValidationError("Module must belong to the specified learning block.")
        
        if self.learning_block and self.period:
            if self.learning_block.period != self.period:
                raise ValidationError("Learning block must belong to the specified period.")
        
        if self.period and self.program:
            if self.period.program != self.program:
                raise ValidationError("Period must belong to the specified program.")
