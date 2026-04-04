from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from core.mixins import EnvelopeMessageMixin
from users.permissions import CategoryPermission

from transactions.models import Category
from transactions.serializers import CategorySerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Transactions"],
        summary="List categories",
        description="All categories belonging to the authenticated user.",
    ),
    retrieve=extend_schema(
        tags=["Transactions"],
        summary="Get category",
    ),
    create=extend_schema(
        tags=["Transactions"],
        summary="Create category",
        description="**Analyst or Admin.** Name must be unique per user.",
    ),
    update=extend_schema(
        tags=["Transactions"],
        summary="Replace category",
    ),
    partial_update=extend_schema(
        tags=["Transactions"],
        summary="Patch category",
    ),
    destroy=extend_schema(
        tags=["Transactions"],
        summary="Delete category",
        description="**Admin only.** Blocked if transactions still reference this category (PROTECT).",
    ),
)
class CategoryViewSet(EnvelopeMessageMixin, viewsets.ModelViewSet):
    envelope_resource_label = "Categories"

    serializer_class = CategorySerializer
    permission_classes = [CategoryPermission]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Category.objects.none()
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
