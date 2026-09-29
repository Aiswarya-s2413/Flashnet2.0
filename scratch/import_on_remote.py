import gzip
import os
import sys
import time
import django

sys.path.append('/home/mohit/Flashnet2.0/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from sales_app.models import PrimarySales, ProductMaster

def run_import():
    t0 = time.time()
    csv_gz_path = "/tmp/primary_sales_upload.csv.gz"
    csv_uncompressed_path = "/tmp/primary_sales_upload.csv"
    products_csv_path = "/tmp/new_products.csv"

    print("Step 1: Uncompressing CSV...")
    with gzip.open(csv_gz_path, 'rb') as f_in:
        with open(csv_uncompressed_path, 'wb') as f_out:
            while chunk := f_in.read(1024 * 1024):
                f_out.write(chunk)
    print(f"Uncompressed size: {os.path.getsize(csv_uncompressed_path):,} bytes ({time.time()-t0:.2f}s)")

    print("Step 2: Checking table state...")
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE sales_app_primarysales RESTART IDENTITY;")
        print("Truncated sales_app_primarysales table.")

        print("Step 3: Executing COPY FROM...")
        cols = (
            "billing_no, tax_invoice_no, sales_order, so_creation_date, division, "
            "sold_to_party, sold_to_party_address, ship_to_party, ship_to_party_name, "
            "material_code, material_desc, billing_date, plant, rate_per_unit, "
            "billed_quantity, assessable_value, billing_item, country, region_dlv_plant, "
            "sales_order_item, sales_unit, sales_exec"
        )
        sql = f"COPY sales_app_primarysales ({cols}) FROM STDIN WITH (FORMAT csv, NULL '\\N', QUOTE '\"', ESCAPE '\\')"
        
        with open(csv_uncompressed_path, 'r', encoding='utf-8') as f:
            cursor.copy_expert(sql, f)
            
        print("COPY completed successfully!")

        print("Step 4: Syncing missing ProductMaster records...")
        if os.path.exists(products_csv_path):
            with open(products_csv_path, 'r', encoding='utf-8') as pf:
                import csv
                reader = csv.reader(pf)
                new_prods = []
                for row in reader:
                    if len(row) >= 2:
                        m_code, m_desc = row[0].strip(), row[1].strip()
                        if m_code:
                            cursor.execute(
                                """
                                INSERT INTO sales_app_productmaster (material_code, material_name, updated_at, mat_div, prod_hierracy_code, pack_size, end_customer_code)
                                VALUES (%s, %s, NOW(), '', '', '', '')
                                ON CONFLICT (material_code) DO NOTHING;
                                """,
                                [m_code, m_desc or m_code]
                            )
            print("ProductMaster sync completed!")

    # Verify counts
    ps_count = PrimarySales.objects.count()
    pm_count = ProductMaster.objects.count()
    print(f"\nVerification Results:")
    print(f"Total PrimarySales in DB: {ps_count:,}")
    print(f"Total ProductMaster in DB: {pm_count:,}")

    # Check sample
    sample = PrimarySales.objects.first()
    if sample:
        print(f"Sample Record:")
        print(f"  Invoice: {sample.billing_no} | Item: {sample.billing_item}")
        print(f"  Date: {sample.billing_date}")
        print(f"  Customer: {sample.sold_to_party} - {sample.sold_to_party_address}")
        print(f"  Material: {sample.material_code} - {sample.material_desc}")
        print(f"  Qty: {sample.billed_quantity} {sample.sales_unit} | Value: {sample.assessable_value}")

    # Clean up temp files
    if os.path.exists(csv_uncompressed_path):
        os.remove(csv_uncompressed_path)
    if os.path.exists(csv_gz_path):
        os.remove(csv_gz_path)
    if os.path.exists(products_csv_path):
        os.remove(products_csv_path)

    print(f"\nAll operations completed in {time.time() - t0:.2f}s!")

if __name__ == '__main__':
    run_import()
