import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from collections import defaultdict
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from sales_app.models import PrimarySales, MonthlySales, Order

print("=== Primary Sales ===")
total_ps_all = PrimarySales.objects.aggregate(total=Sum('assessable_value'))['total'] or 0.0
print(f"Total Primary Sales in DB: {total_ps_all}")

print("=== Monthly Sales (Secondary Sales) ===")
total_ms_all = 0.0
for ms in MonthlySales.objects.all():
    for m, val in ms.values.items():
        total_ms_all += float(val or 0)
print(f"Total Monthly Sales (Secondary) in DB: {total_ms_all}")

# Let's do the matched months logic like in views.py
trend_map = defaultdict(lambda: {'ps': 0.0, 'ss': 0.0})
ps_months = PrimarySales.objects.annotate(month=TruncMonth('billing_date')).values('month').annotate(total=Sum('assessable_value'))
for pm in ps_months:
    if pm['month']:
        month_str = pm['month'].strftime('%Y-%m')
        trend_map[month_str]['ps'] += pm['total'] or 0.0

for ms in MonthlySales.objects.all():
    for month_str, val in ms.values.items():
        try:
            val_float = float(val)
            trend_map[month_str]['ss'] += val_float
        except:
            pass

print("=== Monthly Details (only showing months with both PS and SS > 0) ===")
total_ps_matched = 0.0
total_ss_matched = 0.0
for m, v in sorted(trend_map.items()):
    eff = (v['ss'] / v['ps'] * 100) if v['ps'] > 0 else 0
    print(f"Month: {m} | PS: {v['ps']:.2f} | SS: {v['ss']:.2f} | Eff: {eff:.2f}%")
    if v['ps'] > 0 and v['ss'] > 0:
        total_ps_matched += v['ps']
        total_ss_matched += v['ss']

matched_eff = (total_ss_matched / total_ps_matched * 100) if total_ps_matched > 0 else 0
print(f"\nMatched Months Totals -> PS: {total_ps_matched:.2f} | SS: {total_ss_matched:.2f} | Eff: {matched_eff:.2f}%")
