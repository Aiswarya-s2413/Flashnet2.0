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

def test_kpi_formula():
    print("="*80)
    print("STARTING TEST FOR CUSTOM KPI FORMULA (MONTHS WITH BOTH PS AND SS DATA)")
    print("="*80)

    # 1. Clear previous mock entries
    PrimarySales.objects.filter(sold_to_party='MOCK_KPI_DIST').delete()
    MonthlySales.objects.filter(distributor_name='MOCK_KPI_DIST').delete()
    User.objects.filter(upn='admin@archroma.com').delete()

    # Create mock distributor user
    mock_user = User.objects.create(
        upn='admin@archroma.com',
        display_name='Mock Distributor User',
        distributor_code='MOCK_KPI_DIST',
        is_active=True
    )

    try:
        # Month A: 2026-06 - Both PS and SS exist
        # PS in 2026-06: 10,000
        PrimarySales.objects.create(
            billing_no="PS-JUNE",
            billing_date="2026-06-15",
            sold_to_party="MOCK_KPI_DIST",
            assessable_value=10000.0,
            material_code="MAT_001",
            material_desc="TEST CHEMICAL A"
        )
        # SS in 2026-06: 8,000
        MonthlySales.objects.create(
            distributor_name="MOCK_KPI_DIST",
            ship_to_code="MOCK_KPI_DIST",
            customer_name="Customer A",
            product_code="MAT_001",
            product_name="TEST CHEMICAL A",
            volumes={"2026-06": 100},
            values={"2026-06": 8000.0},
            total_volume=100,
            total_value=8000.0
        )

        # Month B: 2026-07 - ONLY PS exists
        # PS in 2026-07: 15,000 (SS is 0 or absent)
        PrimarySales.objects.create(
            billing_no="PS-JULY",
            billing_date="2026-07-15",
            sold_to_party="MOCK_KPI_DIST",
            assessable_value=15000.0,
            material_code="MAT_001",
            material_desc="TEST CHEMICAL A"
        )

        # Month C: 2026-08 - ONLY SS exists
        # SS in 2026-08: 12,000 (PS is 0 or absent)
        MonthlySales.objects.create(
            distributor_name="MOCK_KPI_DIST",
            ship_to_code="MOCK_KPI_DIST",
            customer_name="Customer B",
            product_code="MAT_001",
            product_name="TEST CHEMICAL A",
            volumes={"2026-08": 200},
            values={"2026-08": 12000.0},
            total_volume=200,
            total_value=12000.0
        )

        # Call analytics endpoint
        factory = APIRequestFactory()
        request = factory.get('/api/dashboard/analytics-ps-ss/')
        request.user = mock_user
        
        response = primary_vs_secondary_analytics(request)
        data = response.data
        
        print(f"API Response data: {data}")
        
        kpis = data['kpis']
        total_primary = kpis['total_primary']
        total_secondary = kpis['total_secondary']
        channel_efficiency = kpis['channel_efficiency']

        print(f"Aggregated Total Primary: {total_primary} (Expected: 10000.0)")
        print(f"Aggregated Total Secondary: {total_secondary} (Expected: 8000.0)")
        print(f"Efficiency %: {channel_efficiency}% (Expected: 80.0%)")

        assert total_primary == 10000.0, f"Primary total {total_primary} != 10000.0 (July 15,000 PS must be excluded)"
        assert total_secondary == 8000.0, f"Secondary total {total_secondary} != 8000.0 (August 12,000 SS must be excluded)"
        assert channel_efficiency == 80.0, f"Efficiency {channel_efficiency} != 80.0"
        
        # Verify trend array
        monthly_trend = data['monthly_trend']
        print(f"Trend Array: {monthly_trend}")
        assert len(monthly_trend) == 1, "Should only have 1 month in the trend array"
        assert monthly_trend[0]['month'] == '2026-06'
        
        print("\nTEST PASSED SUCCESSFULLY!")
        
    finally:
        # Cleanup
        PrimarySales.objects.filter(sold_to_party='MOCK_KPI_DIST').delete()
        MonthlySales.objects.filter(distributor_name='MOCK_KPI_DIST').delete()
        User.objects.filter(upn='admin@archroma.com').delete()
        print("Cleanup completed.")

if __name__ == '__main__':
    test_kpi_formula()
