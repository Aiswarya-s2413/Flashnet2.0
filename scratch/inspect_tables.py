import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales, MonthlySales, Order, ProductMaster, DistributorInvoice

def inspect_db():
    print(f"ProductMaster count: {ProductMaster.objects.count()}")
    print(f"DistributorInvoice count: {DistributorInvoice.objects.count()}")
    print(f"Order count: {Order.objects.count()}")
    print(f"PrimarySales count: {PrimarySales.objects.count()}")
    print(f"MonthlySales count: {MonthlySales.objects.count()}")
    
    if PrimarySales.objects.exists():
        print("\nPrimarySales sample billing_dates:")
        for ps in PrimarySales.objects.all()[:5]:
            print(f"  ID: {ps.id} | Date: {ps.billing_date} | Value: {ps.assessable_value} | Sold To: {ps.sold_to_party}")
            
    if MonthlySales.objects.exists():
        print("\nMonthlySales sample details:")
        for ms in MonthlySales.objects.all()[:5]:
            print(f"  ID: {ms.id} | Distributor: {ms.distributor_name} | Values: {ms.values} | Total Value: {ms.total_value}")

if __name__ == '__main__':
    inspect_db()
