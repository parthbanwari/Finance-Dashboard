from django.urls import path

from users.views.auth import CustomTokenObtainPairView, TokenRefreshViewWithSchema

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshViewWithSchema.as_view(), name="token_refresh"),
]
