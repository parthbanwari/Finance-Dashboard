from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from core.mixins import EnvelopeMessageMixin
from users.permissions import TransactionPermission

from transactions.filters import TransactionFilter
from transactions.models import Transaction
from transactions.serializers import TransactionSerializer
from transactions.services.transaction import queryset_for_user


@extend_schema_view(
    list=extend_schema(
        tags=["Transactions"],
        summary="List transactions",
        description=(
            "Paginated list of your transactions. "
            "**Filters:** `date_from`, `date_to`, `category` (id), `type` (income|expense), `currency`. "
            "**Ordering:** `ordering=-transaction_date` (default), `amount`, `created_at`, `type`."
        ),
    ),
    retrieve=extend_schema(
        tags=["Transactions"],
        summary="Get transaction",
        description="Fetch a single transaction you own.",
    ),
    create=extend_schema(
        tags=["Transactions"],
        summary="Create transaction",
        description="**Analyst or Admin.** Creates a row scoped to your user.",
    ),
    update=extend_schema(
        tags=["Transactions"],
        summary="Replace transaction",
        description="**Analyst or Admin.** Full update (PUT).",
    ),
    partial_update=extend_schema(
        tags=["Transactions"],
        summary="Patch transaction",
        description="**Analyst or Admin.** Partial update.",
    ),
    destroy=extend_schema(
        tags=["Transactions"],
        summary="Soft-delete transaction",
        description="**Admin only.** Sets `deleted_at`; row hidden from default queries.",
    ),
)
class TransactionViewSet(EnvelopeMessageMixin, viewsets.ModelViewSet):
    envelope_resource_label = "Transactions"

    serializer_class = TransactionSerializer
    permission_classes = [TransactionPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TransactionFilter
    ordering_fields = ("transaction_date", "amount", "created_at", "type")
    ordering = ("-transaction_date", "-id")

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Transaction.objects.none()
        return queryset_for_user(self.request.user).select_related("category")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance: Transaction):
        instance.soft_delete()
