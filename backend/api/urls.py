"""API entry — add new versions as sibling packages (e.g. v2/)."""

from django.urls import include, path

urlpatterns = [
    path("", include("api.v1.urls")),
]
