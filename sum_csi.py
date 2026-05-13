import pandas as pd
import sys

def get_csi_total(file_path):
    print(f"Reading {file_path}...")
    try:
        raw_df = pd.read_excel(file_path, header=None)
        header_row_idx = 0
        for i, r in raw_df.head(6).iterrows():
            row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
            if any('product code' in v or 'customer name' in v or 'product name' in v for v in row_vals):
                header_row_idx = i
                break
        
        headers = []
        for v in raw_df.iloc[header_row_idx]:
            headers.append(str(v).strip().lower() if pd.notna(v) else '')
            
        df = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
        df.columns = headers
        
        total = 0.0
        val_col = next((c for c in headers if 'total value' in c), None)
        if val_col:
            for val in df[val_col]:
                if pd.notna(val) and str(val).strip() != '':
                    try:
                        num = float(str(val).replace(',', ''))
                        total += num
                    except ValueError:
                        pass
        return total
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return 0.0

files = ["CSI_ME MTD Feb. 26.xlsx", "CSI_VTC MTD FEB.  26.xlsx"]
total_sec_sales = 0.0
for f in files:
    val = get_csi_total(f)
    print(f"{f}: {val}")
    total_sec_sales += val

print(f"\nOverall Total Secondary Sales: {total_sec_sales}")
