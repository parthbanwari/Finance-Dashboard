from rest_framework import serializers


class OtpSendSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=4, max_length=8, trim_whitespace=True)

    def validate_otp(self, value: str) -> str:
        cleaned = "".join(value.split())
        if not cleaned.isdigit():
            raise serializers.ValidationError("Code must be numeric.")
        if len(cleaned) != 6:
            raise serializers.ValidationError("Enter the 6-digit code.")
        return cleaned
