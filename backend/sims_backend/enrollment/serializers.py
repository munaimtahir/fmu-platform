from rest_framework import serializers

from sims_backend.academics.models import Term

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student", "section", "term", "status", "enrolled_at"]
        read_only_fields = ["enrolled_at"]

    def validate(self, data):
        """Validate enrollment capacity and term status"""
        section = data.get("section")
        term_name = data.get("term") or (section.term if section else None)

        # Check if term is closed
        if term_name:
            try:
                term = Term.objects.get(name=term_name)
                if term.status == "closed":
                    raise serializers.ValidationError(
                        {"term": "Cannot enroll in a closed term"}
                    )
            except Term.DoesNotExist:
                # If term doesn't exist in Term model, allow enrollment (backward compatibility)
                pass

        # Validate capacity (only for new enrollments)
        if section and self.instance is None:
            current_count = Enrollment.objects.filter(
                section=section, status="enrolled"
            ).count()
            if current_count >= section.capacity:
                raise serializers.ValidationError(
                    {"section": f"Section is at full capacity ({section.capacity})"}
                )

        # Auto-populate term from section if not provided
        if not term_name and section:
            data["term"] = section.term

        return data
