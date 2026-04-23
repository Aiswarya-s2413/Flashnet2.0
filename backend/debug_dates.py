import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from sales_app.models import PrimarySales, MonthlySales
from django.db.models.functions import TruncMonth

ps_months = PrimarySales.objects.annotate(month=TruncMonth('billing_date')).values('month')
print("Primary Sales Months:", set([m['month'].strftime('%Y-%m') for m in ps_months if m['month']]))

ss_keys = set()
for ms in MonthlySales.objects.all():
    for key in ms.values.keys():
        ss_keys.add(key)
print("Secondary Sales Raw Keys:", ss_keys)

import dateutil.parser
parsed_ss_keys = set()
for key in ss_keys:
    try:
        parsed_ss_keys.add(dateutil.parser.parse(str(key).strip()).strftime('%Y-%m'))
    except Exception:
        parsed_ss_keys.add("FAILED_TO_PARSE")
print("Secondary Sales Parsed:", parsed_ss_keys)
