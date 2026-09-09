import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.views import primary_vs_secondary_analytics
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/dashboard/analytics-ps-ss/')
from django.contrib.auth import get_user_model
User = get_user_model()
request.user = User.objects.first()

response = primary_vs_secondary_analytics(request)
data = response.data

for month_data in data.get('monthly_comparison', []):
    if month_data['included']:
        print(f"\nMonth: {month_data['month']} | PS: {month_data['ps']} | SS: {month_data['ss']}")
        prods = month_data.get('products', [])
        print(f"  Total Products: {len(prods)}")
        for p in prods[:10]:
            print(f"    Product: {p['name']} | PS: {p['ps']} | SS: {p['ss']} | Diff: {p['difference']}")
