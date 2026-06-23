from django.urls import path
from .views import RegisterEmailView, VerifyEmailView, OnboardingStatusView, ListRequestsView, RequestActionView

urlpatterns = [
    path('register-email/', RegisterEmailView.as_view(), name='register_email'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('status/', OnboardingStatusView.as_view(), name='onboarding_status'),
    path('requests/', ListRequestsView.as_view(), name='onboarding_requests'),
    path('requests/<int:pk>/action/', RequestActionView.as_view(), name='onboarding_request_action'),
]
