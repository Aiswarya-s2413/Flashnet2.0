import os
import django
import pandas as pd
import re
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales, ProductMaster

def clean_prod_name(s):
    if not s: return ""
    return re.sub(r'[\s\xa0]+', ' ', str(s)).strip().upper()

def run():
    print("Reading Book1.xlsx...")
    raw_df = pd.read_excel('Book1.xlsx', header=None)
    
    # 1. Sync Products
    print("Syncing Product Master...")
    # Data starts after row 5 (index 4 is header)
    data_raw = raw_df.iloc[5:]
    unique_products = data_raw[[11, 12]].drop_duplicates().dropna()
    
    prod_added = 0
    for _, row in unique_products.iterrows():
        code = str(row[11]).strip()
        name = str(row[12]).strip()
        if code and name:
            obj, created = ProductMaster.objects.get_or_create(
                material_code=code,
                defaults={'material_name': name}
            )
            if created:
                prod_added += 1
    print(f"Added {prod_added} missing products.")

    # 2. Upload Primary Sales Data
    print("Uploading Primary Sales records...")
    # Clear existing data as per previous pattern?
    # PrimarySales.objects.all().delete()
    
    valid_records = []
    for _, row in data_raw.iterrows():
        try:
            # Column mapping based on previous inspection:
            # 8: ship_to_party
            # 9: ship_to_party_name
            # 11: material_code
            # 12: material_name
            # 15: qty
            # 16: value
            # 5: billing_date (formatted like '2026-03') - Wait, I should check if there's a better date.
            
            bill_date_raw = row[5] # '2026-03'
            try:
                billing_date = datetime.strptime(str(bill_date_raw), '%Y-%m').date()
            except:
                billing_date = None
                
            valid_records.append(PrimarySales(
                ship_to_party=str(row[8]).strip(),
                ship_to_party_name=str(row[9]).strip(),
                material_code=str(row[11]).strip(),
                material_desc=str(row[12]).strip(),
                billing_date=billing_date,
                billed_quantity=float(row[15]) if pd.notna(row[15]) else 0,
                assessable_value=float(row[16]) if pd.notna(row[16]) else 0,
                # Fill other fields with defaults or empty
                billing_no='',
                tax_invoice_no='',
                sales_order='',
                so_creation_date=None,
                division='',
                sold_to_party='',
                sold_to_party_address='',
                plant='',
                rate_per_unit=0
            ))
        except Exception as e:
            print(f"Skipping row due to error: {e}")

    PrimarySales.objects.bulk_create(valid_records)
    print(f"Successfully uploaded {len(valid_records)} Primary Sales records.")

if __name__ == '__main__':
    run()
