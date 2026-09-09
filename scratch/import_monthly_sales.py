import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from sales_app.views import upload_monthly_sales
from sales_app.models import MonthlySales
from django.contrib.auth import get_user_model

User = get_user_model()

def import_monthly_sales_files():
    print("="*80)
    print("IMPORTING CSI EXCEL FILES INTO MONTHLYSALES TABLE")
    print("="*80)

    # 1. Clear existing MonthlySales to avoid duplicates
    MonthlySales.objects.all().delete()
    print("Cleared existing MonthlySales records.")

    # Create dummy admin user for request context
    temp_admin, _ = User.objects.get_or_create(
        upn='importer_admin@archroma.com',
        defaults={'display_name': 'Importer Admin', 'is_active': True}
    )
    temp_admin.is_staff = True
    temp_admin.is_superuser = True
    temp_admin.save()

    factory = APIRequestFactory()
    files = ["CSI_ME MTD Feb. 26.xlsx", "CSI_VTC MTD FEB.  26.xlsx"]

    for filename in files:
        file_path = os.path.join(os.path.dirname(__file__), '..', filename)
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        print(f"Uploading {filename}...")
        with open(file_path, 'rb') as f:
            uploaded_file = SimpleUploadedFile(
                filename,
                f.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        
        request = factory.post(
            '/api/monthly-sales/upload/',
            {'file': uploaded_file, 'ignore_errors': 'true'},
            format='multipart'
        )
        request.user = temp_admin

        response = upload_monthly_sales(request)
        print(f"Response for {filename}: {response.status_code} | {response.data}")

    # Clean up admin user
    temp_admin.delete()
    print(f"Import complete. MonthlySales count now: {MonthlySales.objects.count()}")

if __name__ == '__main__':
    import_monthly_sales_files()
