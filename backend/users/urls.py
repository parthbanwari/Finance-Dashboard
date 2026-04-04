from django.urls import include, path
from rest_framework.routers import DefaultRouter

from users.views import MeView, UserAdminViewSet

router = DefaultRouter()
router.register("", UserAdminViewSet, basename="user")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
