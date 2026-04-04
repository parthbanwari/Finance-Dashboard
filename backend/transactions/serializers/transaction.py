from rest_framework import serializers

from transactions.models import Category, Transaction
from transactions.serializers.category import CategorySerializer


class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "amount",
            "currency",
            "type",
            "category",
            "category_id",
            "transaction_date",
            "description",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["category_id"].queryset = Category.objects.filter(user=request.user)
        if self.instance is None:
            self.fields["category_id"].required = True
