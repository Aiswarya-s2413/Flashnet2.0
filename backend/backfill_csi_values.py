import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import Order, PrimarySales
from django.db.models import Sum

def clean_prod_name(s):
    if not s: return ""
    return re.sub(r'[\s\xa0]+', ' ', str(s)).strip().upper()

def run():
    print("Calculating average rates from Primary Sales (Derived from Value/Qty)...")
    # Group by material_desc and calculate aggregate rate
    ps_data = PrimarySales.objects.values('material_desc').annotate(
        total_val=Sum('assessable_value'),
        total_qty=Sum('billed_quantity')
    )
    
    rate_map = {}
    for r in ps_data:
        if r['total_qty'] and r['total_qty'] > 0:
            rate = r['total_val'] / r['total_qty']
            rate_map[clean_prod_name(r['material_desc'])] = rate

    print(f"Calculated rates for {len(rate_map)} unique products.")

    print("Fetching orders with zero value...")
    orders = Order.objects.filter(value=0)
    total = orders.count()
    updated = 0
    
    for o in orders:
        p_clean = clean_prod_name(o.material_name)
        # Smart Match (Check if one name is a substring of the other)
        rate = 0
        for name, r in rate_map.items():
            if name and p_clean and (name in p_clean or p_clean in name):
                rate = r
                break
        
        if rate > 0:
            o.value = o.qty * rate
            o.save()
            updated += 1
            
    print(f"Done! Backfilled {updated} out of {total} orders with estimated financial values.")

if __name__ == '__main__':
    run()
