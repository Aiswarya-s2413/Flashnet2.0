import os
import sys
import json
import django

sys.path.append('/home/mohit/Flashnet2.0/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import MonthlySales

def run():
    json_path = "/tmp/chemielink_secondary.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        records_data = json.load(f)

    print(f"Loaded {len(records_data)} records from JSON.")

    # Remove the 10 old summary CHEMIELINK records
    deleted_count, _ = MonthlySales.objects.filter(distributor_name__iexact='CHEMIELINK').delete()
    print(f"Deleted {deleted_count} old CHEMIELINK summary records.")

    # Create new records
    to_create = [
        MonthlySales(
            distributor_name=r['distributor_name'],
            ship_to_code=r['ship_to_code'],
            customer_name=r['customer_name'],
            customer_classification=r['customer_classification'],
            product_code=r['product_code'],
            product_name=r['product_name'],
            product_bd_group=r['product_bd_group'],
            volumes=r['volumes'],
            total_volume=r['total_volume'],
            values=r['values'],
            total_value=r['total_value']
        )
        for r in records_data
    ]

    MonthlySales.objects.bulk_create(to_create)
    print(f"Successfully bulk created {len(to_create)} detailed CHEMIELINK records.")

    # Verify counts
    total_ms = MonthlySales.objects.count()
    chemi_ms = MonthlySales.objects.filter(distributor_name='CHEMIELINK').count()
    print(f"Total MonthlySales in DB: {total_ms}")
    print(f"CHEMIELINK MonthlySales in DB: {chemi_ms}")

    if os.path.exists(json_path):
        os.remove(json_path)

if __name__ == '__main__':
    run()
