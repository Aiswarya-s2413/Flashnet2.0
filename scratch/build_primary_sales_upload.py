import csv
import gzip
import os
import sys
import time
from datetime import date, datetime
from python_calamine import CalamineWorkbook

def clean_code(val):
    if val is None:
        return ""
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s

def clean_str(val):
    if val is None:
        return ""
    return str(val).strip()

def clean_float(val):
    if val is None or val == "":
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def clean_date(val):
    if val is None:
        return r"\N"
    if isinstance(val, (date, datetime)):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if not s:
        return r"\N"
    # Try parsing
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d.%m.%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s[:10], fmt).strftime("%Y-%m-%d")
        except:
            pass
    return r"\N"

def build():
    t_start = time.time()
    kna1_path = "/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX"
    vbrk_path = "/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX"
    vbrp_path = "/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx"
    out_csv_gz = "/Users/aiswarya/Documents/flash_2.0/scratch/primary_sales_upload.csv.gz"
    out_prod_csv = "/Users/aiswarya/Documents/flash_2.0/scratch/new_products.csv"

    print("Step 1: Reading KNA1 Customer master...")
    wb_kna1 = CalamineWorkbook.from_path(kna1_path)
    sheet_kna1 = wb_kna1.get_sheet_by_name(wb_kna1.sheet_names[0])
    rows_kna1 = iter(sheet_kna1.to_python())
    next(rows_kna1) # header

    customer_map = {}
    for r in rows_kna1:
        if r and len(r) > 2 and r[0] is not None:
            c_code = clean_code(r[0])
            c_name = clean_str(r[2])
            customer_map[c_code] = c_name
            customer_map[c_code.lstrip('0')] = c_name
    print(f"Loaded {len(customer_map)} customer mappings.")

    print("\nStep 2: Reading VBRK Billing Headers...")
    wb_vbrk = CalamineWorkbook.from_path(vbrk_path)
    sheet_vbrk = wb_vbrk.get_sheet_by_name(wb_vbrk.sheet_names[0])
    rows_vbrk = iter(sheet_vbrk.to_python())
    next(rows_vbrk) # header

    invoice_map = {}
    for r in rows_vbrk:
        if not r or len(r) < 52:
            continue
        inv_no = clean_code(r[0])
        inv_date = clean_date(r[48]) # Col AW
        cust_code = clean_code(r[51]) # Col AZ
        cust_name = customer_map.get(cust_code) or customer_map.get(cust_code.lstrip('0')) or ""
        
        invoice_map[inv_no] = (inv_date, cust_code, cust_name)
    print(f"Loaded {len(invoice_map):,} invoices from VBRK.")

    print("\nStep 3: Reading VBRP and streaming joined records to CSV...")
    wb_vbrp = CalamineWorkbook.from_path(vbrp_path)
    sheet_vbrp = wb_vbrp.get_sheet_by_name(wb_vbrp.sheet_names[0])
    rows_vbrp = iter(sheet_vbrp.to_python())
    next(rows_vbrp) # header

    products_seen = {}
    total_rows = 0

    # Fields order matching COPY statement:
    # billing_no, tax_invoice_no, sales_order, so_creation_date, division,
    # sold_to_party, sold_to_party_address, ship_to_party, ship_to_party_name,
    # material_code, material_desc, billing_date, plant, rate_per_unit,
    # billed_quantity, assessable_value, billing_item, country, region_dlv_plant,
    # sales_order_item, sales_unit, sales_exec

    with gzip.open(out_csv_gz, 'wt', newline='', encoding='utf-8') as f_out:
        writer = csv.writer(f_out, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        for r in rows_vbrp:
            total_rows += 1
            inv_no = clean_code(r[0]) # Col A
            line_no = clean_code(r[1]) # Col B
            qty = clean_float(r[3]) # Col D
            sales_unit = clean_str(r[4]) or "KG" # Col E
            net_val = clean_float(r[20]) if len(r) > 20 else 0.0 # Col U
            mat_code = clean_code(r[29]) if len(r) > 29 else "" # Col AD
            mat_desc = clean_str(r[30]) if len(r) > 30 else "" # Col AE
            plant = clean_str(r[41]) if len(r) > 41 else "" # Col AP
            region = clean_str(r[43]) if len(r) > 43 else "" # Col AR

            # Lookup invoice
            vbrk_info = invoice_map.get(inv_no)
            if vbrk_info:
                inv_date, cust_code, cust_name = vbrk_info
            else:
                # Fallback to VBRP col BS for date if available
                inv_date = clean_date(r[70]) if len(r) > 70 else r"\N"
                cust_code = ""
                cust_name = ""

            rate = (net_val / qty) if qty != 0 else 0.0

            if mat_code and mat_code not in products_seen:
                products_seen[mat_code] = mat_desc or mat_code

            row_data = [
                inv_no,                   # billing_no
                "",                       # tax_invoice_no
                "",                       # sales_order
                r"\N",                    # so_creation_date
                "",                       # division
                cust_code,                # sold_to_party
                cust_name,                # sold_to_party_address
                cust_code,                # ship_to_party
                cust_name,                # ship_to_party_name
                mat_code,                 # material_code
                mat_desc,                 # material_desc
                inv_date,                 # billing_date
                plant,                    # plant
                f"{rate:.4f}",            # rate_per_unit
                f"{qty:.4f}",             # billed_quantity
                f"{net_val:.2f}",         # assessable_value
                line_no,                  # billing_item
                "IN",                     # country
                region,                   # region_dlv_plant
                "",                       # sales_order_item
                sales_unit,               # sales_unit
                ""                        # sales_exec
            ]
            writer.writerow(row_data)

            if total_rows % 50000 == 0:
                print(f"Processed {total_rows:,} rows...")

    print(f"\nFinished processing {total_rows:,} records in {time.time() - t_start:.2f}s.")
    print(f"CSV.GZ size: {os.path.getsize(out_csv_gz):,} bytes.")

    # Write products
    with open(out_prod_csv, 'w', newline='', encoding='utf-8') as pf:
        pwriter = csv.writer(pf)
        for m_code, m_desc in products_seen.items():
            pwriter.writerow([m_code, m_desc])
    print(f"Unique products collected: {len(products_seen):,}.")

if __name__ == '__main__':
    build()
