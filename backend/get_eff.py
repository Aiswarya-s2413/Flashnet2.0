import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from collections import defaultdict
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from sales_app.models import PrimarySales, Order

trend_map = defaultdict(lambda: {'ps': 0, 'ss': 0})

ps_months = PrimarySales.objects.annotate(month=TruncMonth('billing_date')).values('month').annotate(total=Sum('billed_quantity'))
for pm in ps_months:
    if pm['month']:
        month_str = pm['month'].strftime('%Y-%m')
        trend_map[month_str]['ps'] += pm['total']

ss_months = Order.objects.annotate(month=TruncMonth('invoice_date')).values('month').annotate(total=Sum('qty'))
for sm in ss_months:
    if sm['month']:
        month_str = sm['month'].strftime('%Y-%m')
        trend_map[month_str]['ss'] += sm['total']

shared_months = [m for m, v in trend_map.items() if v['ps'] > 0 and v['ss'] > 0]
if shared_months:
    ps_shared_total = sum(trend_map[m]['ps'] for m in shared_months)
    ss_shared_total = sum(trend_map[m]['ss'] for m in shared_months)
    eff = (ss_shared_total / ps_shared_total * 100) if ps_shared_total > 0 else 0
    print(f"Shared Months Method:")
    print(f"Shared Months: {shared_months}")
    print(f"Total SS in shared months: {ss_shared_total}")
    print(f"Total PS in shared months: {ps_shared_total}")
    print(f"Efficiency: {eff}")
else:
    total_ps = sum(v['ps'] for v in trend_map.values())
    total_ss = sum(v['ss'] for v in trend_map.values())
    eff = (total_ss / total_ps * 100) if total_ps > 0 else 0
    print(f"Fallback Method:")
    print(f"Total SS: {total_ss}")
    print(f"Total PS: {total_ps}")
    print(f"Efficiency: {eff}")
