import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import ProductMaster, Order

# Setup some dummy data
ProductMaster.objects.get_or_create(material_code='PROD1', defaults={'material_name': 'Test Product 1'})
ProductMaster.objects.get_or_create(material_code='PROD2', defaults={'material_name': 'Test Product 2'})

# Simulate a sale for PROD1 to 'Distributor A'
Order.objects.get_or_create(sold_to='Distributor A', material_code='PROD1', defaults={'qty': 100})

# Test the API
import requests
import pandas as pd
import io

df = pd.DataFrame({
    'Sold To': ['Distributor B', 'Distributor A', 'Distributor A'],
    'Product Code': ['PROD3', 'PROD2', 'PROD1'], # Row 2: PROD3 doesn't exist, Row 3: PROD2 exists but not sold to Dist A, Row 4: PROD1 sold to Dist A (valid)
    'Prod Desc': ['Test', 'Test', 'Test'],
    'Month End Inventory': [10, 20, 30]
})

excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_buffer.seek(0)

url = 'http://127.0.0.1:8000/api/stocks/upload/'
files = {'file': ('test_stock.xlsx', excel_buffer.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
response = requests.post(url, files=files)

print("Status Code:", response.status_code)
data = response.json()
print("Message:", data.get('message'))
print("Errors:")
for e in data.get('errors', []):
    print(" -", e)

