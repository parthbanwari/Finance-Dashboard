from django.urls import include, path

urlpatterns = [
    path("auth/", include("users.auth_urls")),
    path("users/", include("users.urls")),
    path("transactions/", include("transactions.urls")),
    path("analytics/", include("analytics.urls")),
]
