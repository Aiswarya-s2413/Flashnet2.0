from python_calamine import CalamineWorkbook
import datetime

def test_join():
    print("Loading KNA1...")
    wb_kna1 = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX")
    sheet_kna1 = wb_kna1.get_sheet_by_name(wb_kna1.sheet_names[0])
    rows_kna1 = iter(sheet_kna1.to_python())
    next(rows_kna1) # skip header
    
    # customer_code -> customer_name
    customer_map = {}
    for r in rows_kna1:
        if len(r) > 2 and r[0] is not None:
            c_code = str(r[0]).strip().lstrip('0')
            c_name = str(r[2]).strip() if r[2] is not None else ""
            customer_map[c_code] = c_name
            # also keep unstripped
            customer_map[str(r[0]).strip()] = c_name

    print(f"Loaded {len(customer_map)} customer mappings.")
    sample_kna1_keys = list(customer_map.keys())[:5]
    print(f"Sample KNA1 keys: {[(k, customer_map[k]) for k in sample_kna1_keys]}")

    print("\nLoading VBRK...")
    wb_vbrk = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX")
    sheet_vbrk = wb_vbrk.get_sheet_by_name(wb_vbrk.sheet_names[0])
    rows_vbrk = iter(sheet_vbrk.to_python())
    next(rows_vbrk)
    
    # invoice_no -> (invoice_date, customer_code, customer_name)
    invoice_map = {}
    matched_customers = 0
    unmatched_customers = set()
    sample_dates = []

    for r in rows_vbrk:
        if not r or len(r) < 52:
            continue
        inv_no = str(r[0]).strip()
        inv_date = r[48] # Col AW is idx 48
        cust_code = str(r[51]).strip() if r[51] is not None else ""
        
        if len(sample_dates) < 5:
            sample_dates.append((inv_no, inv_date, type(inv_date), cust_code))

        cust_code_clean = cust_code.lstrip('0')
        cust_name = customer_map.get(cust_code) or customer_map.get(cust_code_clean) or ""
        if cust_name:
            matched_customers += 1
        else:
            if cust_code:
                unmatched_customers.add(cust_code)
                
        invoice_map[inv_no] = {
            'date': inv_date,
            'cust_code': cust_code,
            'cust_name': cust_name
        }

    print(f"Loaded {len(invoice_map):,} invoices from VBRK.")
    print(f"Matched customer names for {matched_customers:,} invoices.")
    print(f"Unmatched unique customer codes: {len(unmatched_customers)}")
    if unmatched_customers:
        print(f"Sample unmatched customer codes: {list(unmatched_customers)[:5]}")
    print(f"Sample dates: {sample_dates}")

    print("\nChecking first 10 rows of VBRP join...")
    wb_vbrp = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx")
    sheet_vbrp = wb_vbrp.get_sheet_by_name(wb_vbrp.sheet_names[0])
    rows_vbrp = iter(sheet_vbrp.to_python())
    next(rows_vbrp)

    for i in range(10):
        r = next(rows_vbrp)
        inv_no = str(r[0]).strip()
        line_no = str(r[1]).strip()
        qty = r[3]
        unit = r[4]
        net_val = r[20]
        mat_code = str(r[29]).strip() if r[29] is not None else ""
        mat_desc = str(r[30]).strip() if r[30] is not None else ""
        
        vbrk_info = invoice_map.get(inv_no, {})
        print(f"Row {i}: Inv={inv_no}, Line={line_no}, Date={vbrk_info.get('date')}, CustCode={vbrk_info.get('cust_code')}, CustName={vbrk_info.get('cust_name')}, Mat={mat_code}, Desc={mat_desc[:20]}, Qty={qty}, NetVal={net_val}")

if __name__ == '__main__':
    test_join()
