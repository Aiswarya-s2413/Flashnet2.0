import os
import django
import sys
import re

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from collections import defaultdict
from django.db.models import Sum
from sales_app.models import PrimarySales, MonthlySales, ProductMaster

def clean_prod_name(s):
    if not s: return ""
    return re.sub(r'[\s\xa0]+', ' ', str(s)).strip().upper()

# Enhanced Canonicalization function
def get_canonical_name(name):
    if not name:
        return ""
    # Uppercase and normalize whitespace
    name = str(name).strip().upper()
    name = re.sub(r'[\s\xa0]+', ' ', name)
    
    # Remove trailing 4-digit codes like 0025, 0120, etc.
    name = re.sub(r'\b\d{4,}\b$', '', name).strip()
    
    # Remove packing terms and size patterns like 'BOX 25KG', 'DRUM 120KG', 'BAG 25KG', '50KG', '25KG'
    name = re.sub(r'\b\d+\s*(KG|KGS)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\b(BOX|DRUM|BAG|TIN|IBC|KG|KGS)\s*\d+\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\b(BOX|DRUM|BAG|TIN|IBC|KG|KGS)\b', '', name, flags=re.IGNORECASE)
    
    # Normalize punctuation (replace dashes, dots, and trailing junk with space)
    name = name.replace('-', ' ').replace('.', ' ')
    name = re.sub(r'[^A-Z0-9\s%]', '', name) # Remove special characters except alphanumeric, space, %
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

code_to_name = {p.material_code: clean_prod_name(p.material_name) for p in ProductMaster.objects.all() if p.material_code}
name_to_clean_name = {clean_prod_name(p.material_name): clean_prod_name(p.material_name) for p in ProductMaster.objects.all()}

def get_clean_ps_product(ps):
    if ps.material_code and ps.material_code in code_to_name:
        return get_canonical_name(code_to_name[ps.material_code])
    desc_clean = clean_prod_name(ps.material_desc)
    if desc_clean in name_to_clean_name:
        return get_canonical_name(name_to_clean_name[desc_clean])
    # Substring match against ProductMaster names
    for clean_m_name in name_to_clean_name:
        if desc_clean.startswith(clean_m_name) or clean_m_name in desc_clean:
            return get_canonical_name(clean_m_name)
    return get_canonical_name(desc_clean)

def get_clean_ms_product(ms):
    prod_clean = clean_prod_name(ms.product_name)
    if prod_clean in name_to_clean_name:
        return get_canonical_name(name_to_clean_name[prod_clean])
    # Substring match against ProductMaster names
    for clean_m_name in name_to_clean_name:
        if prod_clean.startswith(clean_m_name) or clean_m_name in prod_clean:
            return get_canonical_name(clean_m_name)
    return get_canonical_name(prod_clean)

ps_prods = set()
for ps in PrimarySales.objects.all():
    ps_prods.add(get_clean_ps_product(ps))

ms_prods = set()
for ms in MonthlySales.objects.all():
    ms_prods.add(get_clean_ms_product(ms))

print(f"Total cleaned products in Primary Sales: {len(ps_prods)}")
print(f"Total cleaned products in Monthly Sales: {len(ms_prods)}")

intersection = ps_prods.intersection(ms_prods)
print(f"Intersecting cleaned products: {len(intersection)}")

print("\nSample intersecting products:")
for p in sorted(intersection)[:20]:
    print(f"- {p}")

print("\nSample non-intersecting Primary Sales products:")
for p in sorted(ps_prods - ms_prods)[:10]:
    print(f"- PS only: {p}")

print("\nSample non-intersecting Monthly Sales products:")
for p in sorted(ms_prods - ps_prods)[:10]:
    print(f"- MS only: {p}")
