from python_calamine import CalamineWorkbook
import json

def parse_chemielink_csi():
    path = "/Users/aiswarya/Downloads/CSI File for JULY FY-26 (1).xlsx"
    wb = CalamineWorkbook.from_path(path)
    sheet = wb.get_sheet_by_name(" Sales to customers  - FY-26")
    rows = sheet.to_python()

    # row 2 has month dates
    # cols 7-18 are volume months:
    # 2025-10-01 -> '2025-10'
    months = [
        '2025-10', '2025-11', '2025-12',
        '2026-01', '2026-02', '2026-03',
        '2026-04', '2026-05', '2026-06',
        '2026-07', '2026-08', '2026-09'
    ]

    records = []
    total_val_sum = 0.0
    total_vol_sum = 0.0

    for r in rows[3:]:
        dist = str(r[0]).strip() if r[0] else ''
        if not dist or 'chemi' not in dist.lower():
            continue
        
        ship_to = str(r[1]).split('.')[0].strip() if r[1] else '438498'
        cust_name = str(r[2]).strip() if r[2] else ''
        cust_class = str(r[3]).strip() if r[3] else ''
        prod_code = str(r[4]).split('.')[0].strip() if r[4] else ''
        prod_name = str(r[5]).strip() if r[5] else ''
        bd_group = str(r[6]).strip() if r[6] else ''

        vol_dict = {}
        for m_idx, m_str in enumerate(months):
            col_idx = 7 + m_idx
            v = r[col_idx] if col_idx < len(r) and r[col_idx] not in (None, '') else 0.0
            try:
                vol_dict[m_str] = float(v)
            except:
                vol_dict[m_str] = 0.0

        tot_vol = float(r[19]) if len(r) > 19 and r[19] not in (None, '') else sum(vol_dict.values())

        val_dict = {}
        for m_idx, m_str in enumerate(months):
            col_idx = 20 + m_idx
            v = r[col_idx] if col_idx < len(r) and r[col_idx] not in (None, '') else 0.0
            try:
                val_dict[m_str] = float(v)
            except:
                val_dict[m_str] = 0.0

        tot_val = float(r[32]) if len(r) > 32 and r[32] not in (None, '') else sum(val_dict.values())

        total_val_sum += tot_val
        total_vol_sum += tot_vol

        records.append({
            'distributor_name': 'CHEMIELINK',
            'ship_to_code': ship_to,
            'customer_name': cust_name,
            'customer_classification': cust_class,
            'product_code': prod_code,
            'product_name': prod_name,
            'product_bd_group': bd_group,
            'volumes': vol_dict,
            'total_volume': tot_vol,
            'values': val_dict,
            'total_value': tot_val
        })

    print(f"Parsed {len(records)} CHEMIELINK secondary sales records.")
    print(f"Total secondary sales value: ₹{total_val_sum:,.2f}")
    print(f"Total secondary sales volume: {total_vol_sum:,.2f} kg")
    print(f"Sample record:")
    print(json.dumps(records[0], indent=2))
    return records

if __name__ == '__main__':
    parse_chemielink_csi()
