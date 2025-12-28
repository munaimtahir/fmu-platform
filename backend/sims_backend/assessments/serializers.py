from rest_framework import serializers

from .models import Assessment, AssessmentScore


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ["id", "section", "type", "weight"]

    def validate(self, data):
        """Validate assessment weight doesn't exceed 100% for section"""
        # Get section from data or from instance if updating
        section = data.get("section")
        if not section and self.instance:
            section = self.instance.section

        weight = data.get("weight", 0)
        if not weight and self.instance:
            weight = self.instance.weight

        if section:
            # Get total weight for this section (excluding current instance)
            existing_assessments = Assessment.objects.filter(section=section)
            if self.instance:
                existing_assessments = existing_assessments.exclude(id=self.instance.id)

            total_weight = sum(a.weight for a in existing_assessments) + weight

            if total_weight > 100:
                raise serializers.ValidationError(
                    {
                        "weight": f"Total weight for section cannot exceed 100%. Current total: {total_weight}%"
                    }
                )
        return data


class AssessmentScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentScore
        fields = ["id", "assessment", "student", "score", "max_score"]

    def validate(self, data):
        """Validate score doesn't exceed max_score"""
        score = data.get("score", 0)
        max_score = data.get("max_score", 100)

        if score > max_score:
            raise serializers.ValidationError(
                {"score": f"Score ({score}) cannot exceed max_score ({max_score})"}
            )

        if score < 0:
            raise serializers.ValidationError({"score": "Score cannot be negative"})

        if max_score <= 0:
            raise serializers.ValidationError(
                {"max_score": "Max score must be positive"}
            )

        return data
