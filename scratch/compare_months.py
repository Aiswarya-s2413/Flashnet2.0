import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sales_app.models import PrimarySales, MonthlySales
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from collections import defaultdict

def analyze_months():
    # 1. Primary sales by month
    ps_by_month = defaultdict(float)
    ps_qs = PrimarySales.objects.annotate(month=TruncMonth('billing_date')).values('month').annotate(total=Sum('assessable_value'))
    for pm in ps_qs:
        if pm['month']:
            month_str = pm['month'].strftime('%Y-%m')
            ps_by_month[month_str] += pm['total'] or 0.0

    # 2. Secondary sales by month
    ss_by_month = defaultdict(float)
    for ms in MonthlySales.objects.all():
        for month_str, val in ms.values.items():
            try:
                ss_by_month[month_str] += float(val)
            except:
                pass

    # 3. Print analysis
    all_months = sorted(list(set(list(ps_by_month.keys()) + list(ss_by_month.keys()))))
    
    print("="*80)
    print(f"{'Month':<12} | {'Primary Sales (PS)':<20} | {'Secondary Sales (SS)':<20} | {'Included?'}")
    print("="*80)
    
    filtered_ps_total = 0.0
    filtered_ss_total = 0.0
    raw_ps_total = 0.0
    raw_ss_total = 0.0
    
    for m in all_months:
        ps_val = ps_by_month.get(m, 0.0)
        ss_val = ss_by_month.get(m, 0.0)
        
        raw_ps_total += ps_val
        raw_ss_total += ss_val
        
        has_both = ps_val > 0 and ss_val > 0
        status = "Yes (Both exist)" if has_both else "No (Mismatched)"
        
        if has_both:
            filtered_ps_total += ps_val
            filtered_ss_total += ss_val
            
        print(f"{m:<12} | ₹{ps_val:>18,.2f} | ₹{ss_val:>18,.2f} | {status}")
        
    print("="*80)
    print(f"RAW SUMS (Before Filter):")
    print(f"  Primary Sales: ₹{raw_ps_total:,.2f}")
    print(f"  Secondary Sales: ₹{raw_ss_total:,.2f}")
    print(f"FILTERED SUMS (Only months with both datasets):")
    print(f"  Primary Sales: ₹{filtered_ps_total:,.2f}")
    print(f"  Secondary Sales: ₹{filtered_ss_total:,.2f}")
    print(f"  Efficiency %: {filtered_ss_total / filtered_ps_total * 100:.2f}%")

if __name__ == '__main__':
    analyze_months()
