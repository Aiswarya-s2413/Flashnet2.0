import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales, MonthlySales
from rest_framework.test import APIRequestFactory
from sales_app.views import primary_vs_secondary_analytics
from django.contrib.auth import get_user_model

User = get_user_model()

def get_totals():
    # Fetch global totals (Admin/Staff view)
    factory = APIRequestFactory()
    request = factory.get('/api/dashboard/analytics-ps-ss/')
    
    # Create or use a temporary admin user (is_staff=True) to view global stats
    temp_admin, _ = User.objects.get_or_create(
        upn='global_admin_viewer@archroma.com',
        defaults={'display_name': 'Global Admin Viewer', 'is_active': True}
    )
    # Set attributes
    temp_admin.is_staff = True
    temp_admin.is_superuser = True
    temp_admin.save()
    
    request.user = temp_admin
    
    response = primary_vs_secondary_analytics(request)
    data = response.data
    kpis = data.get('kpis', {})
    
    print("GLOBAL TOTALS (All Distributors Combined):")
    print(f"  Primary Sales (PS): ₹{kpis.get('total_primary', 0):,.2f}")
    print(f"  Secondary Sales (SS): ₹{kpis.get('total_secondary', 0):,.2f}")
    print(f"  Channel Efficiency: {kpis.get('channel_efficiency', 0)}%")
    print(f"  Months analyzed: {[item['month'] for item in data.get('monthly_trend', [])]}")
    
    # Check if there are individual distributors
    distributors = User.objects.filter(is_active=True).exclude(distributor_code='')
    if distributors.exists():
        print("\nDISTRIBUTOR SPECIFIC TOTALS:")
        for dist in distributors:
            dist_req = factory.get('/api/dashboard/analytics-ps-ss/')
            dist_req.user = dist
            dist_resp = primary_vs_secondary_analytics(dist_req)
            dist_kpis = dist_resp.data.get('kpis', {})
            print(f"  Distributor: {dist.display_name} (Code: {dist.distributor_code})")
            print(f"    Primary Sales (PS): ₹{dist_kpis.get('total_primary', 0):,.2f}")
            print(f"    Secondary Sales (SS): ₹{dist_kpis.get('total_secondary', 0):,.2f}")
            print(f"    Channel Efficiency: {dist_kpis.get('channel_efficiency', 0)}%")
            print(f"    Months analyzed: {[item['month'] for item in dist_resp.data.get('monthly_trend', [])]}")
            
    # Clean up temp admin
    temp_admin.delete()

if __name__ == '__main__':
    get_totals()
