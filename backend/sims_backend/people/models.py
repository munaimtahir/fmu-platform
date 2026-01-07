"""
People module models - Central identity and contact management.
Students, faculty, and staff reference a shared person record.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class Person(TimeStampedModel):
    """
    Central identity record. Students, faculty, and staff reference this.
    Identity data is never duplicated across modules.
    """

    GENDER_MALE = "male"
    GENDER_FEMALE = "female"
    GENDER_OTHER = "other"
    GENDER_PREFER_NOT_TO_SAY = "prefer_not_to_say"

    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
        (GENDER_OTHER, "Other"),
        (GENDER_PREFER_NOT_TO_SAY, "Prefer not to say"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="person",
        help_text="Linked user account (optional)",
    )
    first_name = models.CharField(
        max_length=100,
        help_text="First/given name",
    )
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Middle name(s)",
    )
    last_name = models.CharField(
        max_length=100,
        help_text="Last/family name",
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text="Date of birth",
    )
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        help_text="Gender",
    )
    national_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="National ID / CNIC / Passport number",
    )
    photo = models.ImageField(
        upload_to="people/photos/",
        null=True,
        blank=True,
        help_text="Profile photo",
    )

    class Meta:
        ordering = ["last_name", "first_name"]
        indexes = [
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["national_id"]),
        ]
        verbose_name_plural = "People"

    def __str__(self) -> str:
        return self.full_name

    @property
    def full_name(self) -> str:
        """Return full name."""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return " ".join(parts)


class ContactInfo(TimeStampedModel):
    """Contact information for a person (phones, emails, emergency contacts)."""

    TYPE_PHONE = "phone"
    TYPE_EMAIL = "email"
    TYPE_EMERGENCY = "emergency_contact"
    TYPE_WHATSAPP = "whatsapp"

    TYPE_CHOICES = [
        (TYPE_PHONE, "Phone"),
        (TYPE_EMAIL, "Email"),
        (TYPE_EMERGENCY, "Emergency Contact"),
        (TYPE_WHATSAPP, "WhatsApp"),
    ]

    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name="contact_info",
        help_text="Person this contact info belongs to",
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of contact information",
    )
    value = models.CharField(
        max_length=255,
        help_text="Contact value (phone number, email, etc.)",
    )
    label = models.CharField(
        max_length=50,
        blank=True,
        help_text="Optional label (e.g., 'Work', 'Home')",
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Is this the primary contact for this type?",
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Has this contact been verified?",
    )

    class Meta:
        ordering = ["-is_primary", "type", "label"]
        indexes = [
            models.Index(fields=["person", "type"]),
            models.Index(fields=["type", "value"]),
        ]
        verbose_name_plural = "Contact Information"

    def __str__(self) -> str:
        return f"{self.get_type_display()}: {self.value}"


class Address(TimeStampedModel):
    """Physical address for a person."""

    TYPE_MAILING = "mailing"
    TYPE_PERMANENT = "permanent"
    TYPE_TEMPORARY = "temporary"
    TYPE_WORK = "work"

    TYPE_CHOICES = [
        (TYPE_MAILING, "Mailing Address"),
        (TYPE_PERMANENT, "Permanent Address"),
        (TYPE_TEMPORARY, "Temporary Address"),
        (TYPE_WORK, "Work Address"),
    ]

    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name="addresses",
        help_text="Person this address belongs to",
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of address",
    )
    street = models.CharField(
        max_length=255,
        help_text="Street address",
    )
    city = models.CharField(
        max_length=100,
        help_text="City",
    )
    state = models.CharField(
        max_length=100,
        blank=True,
        help_text="State/Province",
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="Postal/ZIP code",
    )
    country = models.CharField(
        max_length=100,
        default="Pakistan",
        help_text="Country",
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Is this the primary address?",
    )

    class Meta:
        ordering = ["-is_primary", "type"]
        indexes = [
            models.Index(fields=["person", "type"]),
        ]
        verbose_name_plural = "Addresses"

    def __str__(self) -> str:
        return f"{self.get_type_display()}: {self.city}, {self.country}"


class IdentityDocument(TimeStampedModel):
    """Identity documents for a person (passport, CNIC, etc.)."""

    TYPE_CNIC = "cnic"
    TYPE_PASSPORT = "passport"
    TYPE_DRIVING_LICENSE = "driving_license"
    TYPE_OTHER = "other"

    TYPE_CHOICES = [
        (TYPE_CNIC, "CNIC"),
        (TYPE_PASSPORT, "Passport"),
        (TYPE_DRIVING_LICENSE, "Driving License"),
        (TYPE_OTHER, "Other"),
    ]

    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name="identity_documents",
        help_text="Person this document belongs to",
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of identity document",
    )
    document_number = models.CharField(
        max_length=100,
        help_text="Document number",
    )
    issue_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date of issue",
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expiry date",
    )
    issuing_authority = models.CharField(
        max_length=255,
        blank=True,
        help_text="Issuing authority",
    )
    document_file = models.FileField(
        upload_to="people/documents/",
        null=True,
        blank=True,
        help_text="Scanned copy of the document",
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Has this document been verified?",
    )

    class Meta:
        ordering = ["type", "-issue_date"]
        indexes = [
            models.Index(fields=["person", "type"]),
            models.Index(fields=["document_number"]),
        ]
        unique_together = [["person", "type", "document_number"]]

    def __str__(self) -> str:
        return f"{self.get_type_display()}: {self.document_number}"
