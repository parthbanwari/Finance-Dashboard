from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.generics import RetrieveUpdateAPIView

from core.mixins import EnvelopeMessageMixin
from users.models import User
from users.permissions import MeObjectPermission
from users.serializers import UserSerializer


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="Current user profile",
        description="Returns the authenticated user's profile. **Role** is read-only in responses.",
    ),
    patch=extend_schema(
        tags=["Users"],
        summary="Update current user profile",
        description="Update email, name, etc. You cannot change **role** via this endpoint.",
    ),
)
class MeView(EnvelopeMessageMixin, RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [MeObjectPermission]

    def get_envelope_success_message(self):
        if self.request.method == "PATCH":
            return "Profile updated successfully."
        return "Profile retrieved successfully."

    def get_object(self):
        return self.request.user

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return User.objects.none()
        return User.objects.filter(pk=self.request.user.pk)
