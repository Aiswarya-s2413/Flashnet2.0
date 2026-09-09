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

code_to_name = {p.material_code: clean_prod_name(p.material_name) for p in ProductMaster.objects.all() if p.material_code}
name_to_clean_name = {clean_prod_name(p.material_name): clean_prod_name(p.material_name) for p in ProductMaster.objects.all()}

def get_clean_ps_product(ps):
    if ps.material_code and ps.material_code in code_to_name:
        return code_to_name[ps.material_code]
    desc_clean = clean_prod_name(ps.material_desc)
    if desc_clean in name_to_clean_name:
        return name_to_clean_name[desc_clean]
    for clean_m_name in name_to_clean_name:
        if desc_clean.startswith(clean_m_name) or clean_m_name in desc_clean:
            return clean_m_name
    return desc_clean

def get_clean_ms_product(ms):
    prod_clean = clean_prod_name(ms.product_name)
    if prod_clean in name_to_clean_name:
        return name_to_clean_name[prod_clean]
    for clean_m_name in name_to_clean_name:
        if prod_clean.startswith(clean_m_name) or clean_m_name in prod_clean:
            return clean_m_name
    return prod_clean

ps_prods = set(get_clean_ps_product(ps) for ps in PrimarySales.objects.all())
ms_prods = set(get_clean_ms_product(ms) for ms in MonthlySales.objects.all())

ps_only = ps_prods - ms_prods
ms_only = ms_prods - ps_prods

print("Fuzzy matching non-intersecting products...")
matches_found = 0
for p in sorted(ps_only):
    # Find if there is any ms product that is a substring, or shares a large part
    # Or matches when stripping codes like 0025, 0120, etc.
    p_stripped = re.sub(r'\s*\d{4,}\s*$', '', p).strip() # Strip trailing 4+ digit codes (like 0025, 0120)
    p_stripped = re.sub(r'\s*(BOX|KG|BAG|DRUM|TIN|IBC|LIQ|NEW|CWR|ACE).*$', '', p_stripped).strip()
    
    for m in ms_only:
        m_stripped = re.sub(r'\s*\d{4,}\s*$', '', m).strip()
        m_stripped = re.sub(r'\s*(BOX|KG|BAG|DRUM|TIN|IBC|LIQ|NEW|CWR|ACE).*$', '', m_stripped).strip()
        if p_stripped == m_stripped and p_stripped:
            print(f"PS: '{p}' <-> MS: '{m}'  (Stripped match: '{p_stripped}')")
            matches_found += 1
            break
            
print(f"Total potential stripped matches: {matches_found}")
