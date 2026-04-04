from django.urls import include, path
from rest_framework.routers import DefaultRouter

from transactions.views import CategoryViewSet, TransactionViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]
