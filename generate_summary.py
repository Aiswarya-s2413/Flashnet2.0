import pandas as pd
import glob
import sys

def process_csi_file(file_path):
    print(f"Reading {file_path}...")
    try:
        raw_df = pd.read_excel(file_path, header=None)
        header_row_idx = 0
        for i, r in raw_df.head(6).iterrows():
            row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
            if any('product name' in v or 'total value' in v for v in row_vals):
                header_row_idx = i
                break
        
        headers = []
        for v in raw_df.iloc[header_row_idx]:
            headers.append(str(v).strip().lower() if pd.notna(v) else '')
            
        df = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
        df.columns = headers
        
        # Find columns
        cust_col = next((c for c in headers if 'customer name' in c), None)
        prod_col = next((c for c in headers if 'product name' in c), None)
        vol_col = next((c for c in headers if 'total volume' in c), None)
        val_col = next((c for c in headers if 'total value' in c), None)
        
        rows = []
        if val_col and vol_col:
            for idx, row in df.iterrows():
                try:
                    cust = str(row[cust_col]) if cust_col and pd.notna(row[cust_col]) else "Unknown"
                    prod = str(row[prod_col]) if prod_col and pd.notna(row[prod_col]) else "Unknown"
                    
                    vol_str = str(row[vol_col]).replace(',', '') if pd.notna(row[vol_col]) else '0'
                    val_str = str(row[val_col]).replace(',', '') if pd.notna(row[val_col]) else '0'
                    
                    if vol_str.strip() == '' or val_str.strip() == '':
                        continue
                        
                    vol = float(vol_str)
                    val = float(val_str)
                    
                    if val > 0:
                        cost_per_unit = val / vol if vol > 0 else 0
                        rows.append({
                            'Customer Name': cust,
                            'Product Name': prod,
                            'Quantity (kg)': vol,
                            'Cost of Product (INR/kg)': round(cost_per_unit, 2),
                            'Total Value (INR)': val
                        })
                except Exception as e:
                    pass
        return rows
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return []

files = ["CSI_ME MTD Feb. 26.xlsx", "CSI_VTC MTD FEB.  26.xlsx"]
all_data = []
for f in files:
    all_data.extend(process_csi_file(f))

summary_df = pd.DataFrame(all_data)

# Sort by Total Value
summary_df = summary_df.sort_values(by='Total Value (INR)', ascending=False).reset_index(drop=True)

# Add Grand Total row
total_vol = summary_df['Quantity (kg)'].sum()
total_val = summary_df['Total Value (INR)'].sum()
avg_cost = total_val / total_vol if total_vol > 0 else 0

grand_total = pd.DataFrame([{
    'Customer Name': 'GRAND TOTAL',
    'Product Name': '',
    'Quantity (kg)': total_vol,
    'Cost of Product (INR/kg)': round(avg_cost, 2),
    'Total Value (INR)': total_val
}])

summary_df = pd.concat([summary_df, grand_total], ignore_index=True)

output_file = "Secondary_Sales_Summary.xlsx"
summary_df.to_excel(output_file, index=False)
print(f"Successfully generated {output_file}")
