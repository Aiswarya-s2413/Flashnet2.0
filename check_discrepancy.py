import pandas as pd

with open("codes_list.txt", "r") as f:
    valid_codes = set(f.read().split(","))

def process_csi_file(file_path):
    raw_df = pd.read_excel(file_path, header=None)
    header_row_idx = 0
    for i, r in raw_df.head(6).iterrows():
        row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
        if any('product name' in v or 'total value' in v for v in row_vals):
            header_row_idx = i
            break
    
    headers = [str(v).strip().lower() if pd.notna(v) else '' for v in raw_df.iloc[header_row_idx]]
    df = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
    df.columns = headers
    
    prod_code_col = next((c for c in headers if 'product code' in c), None)
    val_col = next((c for c in headers if 'total value' in c), None)
    
    total_val = 0.0
    valid_val = 0.0
    skipped_rows = []
    
    for idx, row in df.iterrows():
        try:
            val_str = str(row[val_col]).replace(',', '') if pd.notna(row[val_col]) else '0'
            val = float(val_str) if val_str.strip() != '' else 0.0
            
            p_code = str(row[prod_code_col]).strip() if prod_code_col and pd.notna(row[prod_code_col]) else ""
            if p_code.endswith('.0'): p_code = p_code[:-2]
            
            total_val += val
            
            # Condition for valid row in upload_monthly_sales:
            # if product_code and product_code not in valid_codes: -> continue
            
            if p_code == "" or p_code in valid_codes:
                valid_val += val
            else:
                skipped_rows.append((p_code, val))
        except:
            pass
            
    return total_val, valid_val, skipped_rows

files = ["CSI_ME MTD Feb. 26.xlsx", "CSI_VTC MTD FEB.  26.xlsx"]
grand_total = 0.0
grand_valid = 0.0
all_skipped = []

for f in files:
    t, v, s = process_csi_file(f)
    grand_total += t
    grand_valid += v
    all_skipped.extend(s)

print(f"Grand Total from Files: {grand_total}")
print(f"Total that should be in DB: {grand_valid}")
print(f"Difference: {grand_total - grand_valid}")
print("\nTop Skipped Rows (Product Code, Value):")
all_skipped.sort(key=lambda x: x[1], reverse=True)
for s in all_skipped[:10]:
    print(s)
