import os
import django
import pandas as pd

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import ProductMaster

def run():
    print("Reading products.xlsx...")
    df = pd.read_excel('products.xlsx')
    
    # Check the actual column names in df. Assuming 'Material Code' and 'Material Name' based on earlier context
    # Usually, we'd rename columns, but let's iterate and safely create them
    # Fallback to index 0 and 1 if names don't match exactly
    products = []
    codes = set()
    
    for i, row in df.iterrows():
        try:
            # Try to get by index if column names are unknown
            code = str(row.iloc[0]).strip()
            name = str(row.iloc[1]).strip()
            
            if pd.isna(code) or code == 'nan' or not code:
                continue
                
            if code not in codes:
                products.append(ProductMaster(material_code=code, material_name=name))
                codes.add(code)
                
        except Exception as e:
            print(f"Skipping row {i}: {e}")
            
    print(f"Inserting {len(products)} products into the database...")
    # Clear existing if any
    ProductMaster.objects.all().delete()
    
    # Bulk create
    ProductMaster.objects.bulk_create(products, batch_size=500)
    print("Done!")

if __name__ == '__main__':
    run()
