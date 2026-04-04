from django.contrib import admin

from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "slug")
    list_filter = ("user",)
    search_fields = ("name", "slug")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "type",
        "amount",
        "currency",
        "category",
        "transaction_date",
        "deleted_at",
    )
    list_filter = ("type", "currency", "transaction_date")
    search_fields = ("description", "user__username")
    raw_id_fields = ("user", "category")
    readonly_fields = ("created_at", "updated_at", "deleted_at")

    def get_queryset(self, request):
        return Transaction.all_objects.select_related("user", "category")
