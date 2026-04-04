from django.urls import path

from users.views.auth import CustomTokenObtainPairView, TokenRefreshViewWithSchema
from users.views.otp import OtpSendView, OtpVerifyView

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshViewWithSchema.as_view(), name="token_refresh"),
    path("otp/send/", OtpSendView.as_view(), name="otp_send"),
    path("otp/verify/", OtpVerifyView.as_view(), name="otp_verify"),
]
