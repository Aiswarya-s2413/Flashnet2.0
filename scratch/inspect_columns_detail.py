import os
from python_calamine import CalamineWorkbook

def col2idx(col_str):
    idx = 0
    for c in col_str.upper():
        idx = idx * 26 + (ord(c) - ord('A') + 1)
    return idx - 1

def inspect_columns():
    files = {
        'KNA1': "/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX",
        'VBRK': "/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX",
        'VBRP': "/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx"
    }

    for name, path in files.items():
        wb = CalamineWorkbook.from_path(path)
        sheet = wb.get_sheet_by_name(wb.sheet_names[0])
        rows = iter(sheet.to_python())
        header = next(rows)
        row1 = next(rows)
        print(f"\n=== {name} (total cols: {len(header)}) ===")
        # check specific columns
        if name == 'KNA1':
            check_cols = ['A', 'B', 'C', 'D', 'E']
        elif name == 'VBRK':
            check_cols = ['A', 'B', 'C', 'AW', 'AZ', 'BA']
        elif name == 'VBRP':
            check_cols = ['A', 'B', 'C', 'D', 'E', 'AD', 'AE', 'AF']
            
        for c in check_cols:
            idx = col2idx(c)
            h = header[idx] if idx < len(header) else "OUT_OF_BOUNDS"
            v = row1[idx] if idx < len(row1) else "N/A"
            print(f"  Col {c} (idx {idx}): Header = '{h}' | Sample = '{v}'")

        # Also let's search if there are columns with value, price, amount, net value, assessable, plant, etc.
        val_candidates = []
        for i, h in enumerate(header):
            hl = str(h).lower()
            if any(term in hl for term in ['value', 'amount', 'net', 'price', 'plant', 'assessable', 'billing date', 'sold-to', 'payer', 'tax']):
                val_candidates.append((i, h, row1[i] if i < len(row1) else ""))
        print(f"  Notable columns in {name}:")
        for idx, h, s in val_candidates[:20]:
            # find col letter
            col_letter = ""
            temp = idx + 1
            while temp > 0:
                temp, remainder = divmod(temp - 1, 26)
                col_letter = chr(65 + remainder) + col_letter
            print(f"    Col {col_letter} (idx {idx}): '{h}' (e.g. {s})")

if __name__ == '__main__':
    inspect_columns()
