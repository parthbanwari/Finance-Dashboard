from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    """
    Normalized category per user — avoids duplicate strings, enables FK integrity,
    and supports future metadata (budget caps, icons) without schema churn.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=64)
    slug = models.SlugField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="uniq_category_user_name"),
        ]
        indexes = [
            models.Index(fields=["user", "name"], name="cat_user_name_idx"),
        ]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = (slugify(self.name) or "category")[:80]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class TransactionQuerySet(models.QuerySet):
    def active(self) -> "TransactionQuerySet":
        return self.filter(deleted_at__isnull=True)


class TransactionManager(models.Manager):
    """Default manager: hide soft-deleted rows from application queries."""

    def get_queryset(self) -> TransactionQuerySet:
        return TransactionQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)


class Transaction(models.Model):
    """
    Ledger line: amount is always stored as a positive magnitude; `type`
    determines sign for reporting (income adds, expense subtracts).
    """

    class TransactionType(models.TextChoices):
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    type = models.CharField(
        max_length=16,
        choices=TransactionType.choices,
        db_index=True,
    )
    currency = models.CharField(max_length=3, default="INR")
    transaction_date = models.DateField(
        db_index=True,
        default=timezone.localdate,
        help_text="Business date used for reporting and filters.",
    )
    description = models.CharField(max_length=255, blank=True)

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Soft delete timestamp; null means active.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TransactionManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ["-transaction_date", "-id"]
        indexes = [
            # Typical list: “my transactions in a date range, not deleted”
            models.Index(
                fields=["user", "transaction_date", "deleted_at"],
                name="tx_user_date_deleted_idx",
            ),
            # Dashboard splits by type (cash flow)
            models.Index(
                fields=["user", "type", "transaction_date"],
                name="tx_user_type_date_idx",
            ),
            # Category breakdowns for a period
            models.Index(
                fields=["user", "category", "transaction_date"],
                name="tx_user_cat_date_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.type} {self.amount} {self.currency} @ {self.transaction_date}"

    def soft_delete(self) -> None:
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    @property
    def signed_amount(self) -> Decimal:
        """Net effect on balance: income positive, expense negative."""
        if self.type == self.TransactionType.EXPENSE:
            return -self.amount
        return self.amount
