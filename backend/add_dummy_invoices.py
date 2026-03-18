import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import DistributorInvoice, ProductMaster

def create_dummy_data():
    DistributorInvoice.objects.all().delete()
    
    products = list(ProductMaster.objects.all()[:5])
    
    invoices = []
    
    # 5 matching materials (but 2 will have wrong names for validation testing)
    if len(products) > 0:
        p1 = products[0]
        invoices.append(DistributorInvoice(
            invoice_no="INV-1001", invoice_date=date(2026, 3, 1),
            material_code=p1.material_code, material_name=p1.material_name,
            packsize="100g", qty=50, customer="Client A", ship_to="Location A", sold_to="Location A"
        ))
        invoices.append(DistributorInvoice(
            invoice_no="INV-1002", invoice_date=date(2026, 3, 2),
            material_code=p1.material_code, material_name=p1.material_name + " (Wrong Name)",
            packsize="200g", qty=30, customer="Client B", ship_to="Location B", sold_to="Location B"
        ))
    if len(products) > 1:
        p2 = products[1]
        invoices.append(DistributorInvoice(
            invoice_no="INV-1003", invoice_date=date(2026, 3, 3),
            material_code=p2.material_code, material_name=p2.material_name,
            packsize="500g", qty=100, customer="Client C", ship_to="Location C", sold_to="Location C"
        ))
    if len(products) > 2:
        p3 = products[2]
        invoices.append(DistributorInvoice(
            invoice_no="INV-1004", invoice_date=date(2026, 3, 4),
            material_code=p3.material_code, material_name="Completely Wrong Name",
            packsize="1kg", qty=10, customer="Client D", ship_to="Location D", sold_to="Location D"
        ))
    if len(products) > 3:
        p4 = products[3]
        invoices.append(DistributorInvoice(
            invoice_no="INV-1005", invoice_date=date(2026, 3, 5),
            material_code=p4.material_code, material_name=p4.material_name,
            packsize="50g", qty=200, customer="Client E", ship_to="Location E", sold_to="Location E"
        ))
    
    # Fill the remaining to make 10
    dummy_data = [
        ("INV-1006", "M-999", "Unknown Material 999", "100g", 25, "Client F"),
        ("INV-1007", "M-888", "Unknown Material 888", "200g", 40, "Client G"),
        ("INV-1008", "M-777", "Unknown Material 777", "500g", 15, "Client H"),
        ("INV-1009", "M-666", "Unknown Material 666", "1kg", 60, "Client I"),
        ("INV-1010", "M-555", "Unknown Material 555", "50g", 85, "Client J"),
    ]
    
    day = 6
    for inv, md, mn, ps, qt, cust in dummy_data:
        invoices.append(DistributorInvoice(
            invoice_no=inv, invoice_date=date(2026, 3, day),
            material_code=md, material_name=mn,
            packsize=ps, qty=qt, customer=cust, ship_to=cust + " Ship To", sold_to=cust + " Sold To"
        ))
        day += 1
        
    DistributorInvoice.objects.bulk_create(invoices)
    print(f"Successfully inserted {len(invoices)} invoices.")
    for i in invoices:
        print(f"{i.invoice_no}: {i.material_code} - {i.material_name}")

if __name__ == '__main__':
    create_dummy_data()
