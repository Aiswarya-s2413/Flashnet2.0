import os, sys, django
sys.path.insert(0, '/home/mohit/Flashnet2.0/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.test import RequestFactory
from sales_app.views import stock_analysis
from collections import defaultdict

rf = RequestFactory()
req = rf.get('/api/analytics/stock/?dist=CHEMIELINK')
res = stock_analysis(req)
rows = res.data.get('rows', [])

month_agg = defaultdict(lambda: {'ps_qty': 0.0, 'ss_qty': 0.0, 'stock': 0.0, 'has_stock': False})
for r in rows:
    m = r['month']
    month_agg[m]['ps_qty'] += r.get('primary_qty', 0.0)
    month_agg[m]['ss_qty'] += r.get('secondary_qty', 0.0)
    if r.get('actual_stock') is not None:
        month_agg[m]['stock'] += r.get('actual_stock', 0.0)
        month_agg[m]['has_stock'] = True

for m in sorted(month_agg.keys()):
    v = month_agg[m]
    print(m, 'PS:', round(v['ps_qty'], 1), 'SS:', round(v['ss_qty'], 1), 'Stock:', round(v['stock'], 1), 'has_stock:', v['has_stock'])
