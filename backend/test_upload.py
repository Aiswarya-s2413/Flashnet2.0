import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory
from sales_app.views import upload_primary_sales
import pandas as pd

# Create a mock Excel file matching Book1.xlsx
df = pd.DataFrame({
    'Ship to party (NLZ)': [838522, 838477],
    'Ship To Party Name': ['MIKHAIL ENTERPRISES', 'VIKRAM TRADING COMPANY'],
    'Group Name': ['Grp Vikram', 'Grp Vikram'],
    'PPC': [26122230270, 27918625946],
    'Material Text': ['Imerol MFB liq', 'Imerol LF new liq'],
    'United Segments': ['PTC & OBA', 'PTC & OBA'],
    'United Groups': ['PTC & OBA', 'PTC & OBA'],
    'Inv Qty Kgs': [100, 5000],
    'Inv Value INR': [26500, 550000]
})

df.to_excel('test_book.xlsx', index=False)

with open('test_book.xlsx', 'rb') as f:
    file = SimpleUploadedFile('test_book.xlsx', f.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

request = RequestFactory().post('/upload-primary/', {'file': file, 'ignore_errors': 'true'})
response = upload_primary_sales(request)
print(response.status_code)
print(response.data)
