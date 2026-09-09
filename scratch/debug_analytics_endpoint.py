import os
import django
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.views import primary_vs_secondary_analytics
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/api/dashboard/analytics-ps-ss/')

# Mock authentication
from django.contrib.auth.models import AnonymousUser
request.user = AnonymousUser()

try:
    response = primary_vs_secondary_analytics(request)
    print("Response Status Code:", response.status_code)
    if response.status_code != 200:
        print("Response Data:", response.data)
except Exception as e:
    import traceback
    print("Traceback:")
    traceback.print_exc()
