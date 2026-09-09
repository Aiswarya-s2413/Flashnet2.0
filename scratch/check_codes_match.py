import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales, MonthlySales, ProductMaster
from collections import defaultdict
from django.db.models import Sum
from django.db.models.functions import TruncMonth

# Build mapping of code to clean name
code_to_name = {p.material_code: p.material_name for p in ProductMaster.objects.all()}

ps_codes = set(PrimarySales.objects.values_list('material_code', flat=True))
ms_codes = set(MonthlySales.objects.values_list('product_code', flat=True))

print(f"Primary Sales unique codes: {len(ps_codes)}")
print(f"Monthly Sales unique codes: {len(ms_codes)}")
print(f"Intersection of codes: {len(ps_codes.intersection(ms_codes))}")

# Check sample intersection codes and their names
for code in list(ps_codes.intersection(ms_codes))[:10]:
    name_in_master = code_to_name.get(code, "Unknown")
    print(f"Code: {code} | Master Name: {name_in_master}")
