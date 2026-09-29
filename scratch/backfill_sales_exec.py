"""
Backfill sales_exec and division fields in PrimarySales from VBRK Excel file.
VBRK column AU = "Created By" → sales_exec
VBRK column BM = "Division"   → division
Matching key: VBRK column A = "Billing Document" = billing_no
"""
import os
import sys
import django
from python_calamine import CalamineWorkbook
from django.db import transaction

sys.path.append('/home/mohit/Flashnet2.0/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales

VBRK_PATH = '/tmp/VBRK_Extract.XLSX'

def col2idx(s):
    idx = 0
    for c in s.upper():
        idx = idx * 26 + (ord(c) - 64)
    return idx - 1

print("Loading VBRK file...")
wb = CalamineWorkbook.from_path(VBRK_PATH)
ws = wb.get_sheet_by_index(0)
rows = list(ws.to_python(skip_empty_area=False))

header = rows[0]
print(f"Total rows in VBRK: {len(rows)-1}")

# Find column indices
billing_idx = col2idx('A')   # Billing Document
created_by_idx = col2idx('AU')  # Created By → sales_exec
division_idx = col2idx('BM')    # Division

print(f"Header[AU]: {header[created_by_idx] if created_by_idx < len(header) else 'N/A'}")
print(f"Header[BM]: {header[division_idx] if division_idx < len(header) else 'N/A'}")

# Build mapping: billing_no -> (sales_exec, division)
print("Building billing_no → exec/division map...")
mapping = {}
for row in rows[1:]:
    billing_no = str(row[billing_idx]).strip() if billing_idx < len(row) and row[billing_idx] else ''
    created_by = str(row[created_by_idx]).strip() if created_by_idx < len(row) and row[created_by_idx] else ''
    division   = str(row[division_idx]).strip() if division_idx < len(row) and row[division_idx] else ''
    if billing_no and billing_no != 'None':
        mapping[billing_no] = (created_by, division)

print(f"Unique billing docs in VBRK: {len(mapping)}")

# Sample
sample = list(mapping.items())[:5]
for k,v in sample:
    print(f"  {k} → exec={v[0]}, div={v[1]}")

# Now update DB in batches
print("\nUpdating PrimarySales records...")
batch_size = 500
updated = 0
skipped = 0

billing_nos = list(mapping.keys())
total_batches = (len(billing_nos) + batch_size - 1) // batch_size

for i in range(0, len(billing_nos), batch_size):
    batch_keys = billing_nos[i:i+batch_size]
    records = PrimarySales.objects.filter(billing_no__in=batch_keys)
    
    to_update = []
    for rec in records:
        exec_val, div_val = mapping.get(rec.billing_no, ('', ''))
        changed = False
        if exec_val and rec.sales_exec != exec_val:
            rec.sales_exec = exec_val
            changed = True
        if div_val and rec.division != div_val:
            rec.division = div_val
            changed = True
        if changed:
            to_update.append(rec)
        else:
            skipped += 1
    
    if to_update:
        with transaction.atomic():
            PrimarySales.objects.bulk_update(to_update, ['sales_exec', 'division'], batch_size=200)
        updated += len(to_update)
    
    batch_num = i // batch_size + 1
    if batch_num % 10 == 0 or batch_num == total_batches:
        print(f"  Batch {batch_num}/{total_batches} — updated so far: {updated}")

print(f"\nDone! Updated: {updated}, Skipped (already set or no match): {skipped}")

# Verify
with_exec = PrimarySales.objects.exclude(sales_exec='').exclude(sales_exec__isnull=True).count()
print(f"Records now with sales_exec: {with_exec}")

unique_execs = list(PrimarySales.objects.exclude(sales_exec='').values_list('sales_exec', flat=True).distinct())
print(f"Unique sales execs: {unique_execs}")
