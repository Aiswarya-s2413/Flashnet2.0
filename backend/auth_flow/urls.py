from django.urls import path
from .views import EntraCallbackView, MeView, LogoutView

urlpatterns = [
    path('entra-callback/', EntraCallbackView.as_view(), name='entra_callback'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]
