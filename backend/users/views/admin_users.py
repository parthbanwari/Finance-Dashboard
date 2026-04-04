from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.mixins import EnvelopeMessageMixin
from users.models import User
from users.permissions import IsAdmin
from users.serializers import UserAdminSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Users"],
        summary="List users (admin)",
        description="**Admin only.** Paginated directory of all accounts.",
    ),
    retrieve=extend_schema(
        tags=["Users"],
        summary="User detail (admin)",
        description="**Admin only.** Fetch any user by primary key.",
    ),
    partial_update=extend_schema(
        tags=["Users"],
        summary="Update user (admin)",
        description="**Admin only.** Update role, active flag, email, and name. **is_staff** is read-only via API.",
    ),
)
class UserAdminViewSet(EnvelopeMessageMixin, viewsets.ModelViewSet):
    envelope_resource_label = "Users"

    queryset = User.objects.all().order_by("id")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "head", "options", "patch"]
