import os
import sys
from python_calamine import CalamineWorkbook

def inspect_file(path, max_cols=30):
    print(f"\n==========================================")
    print(f"Inspecting: {path}")
    print(f"Size: {os.path.getsize(path):,} bytes")
    
    wb = CalamineWorkbook.from_path(path)
    sheet_names = wb.sheet_names
    print(f"Sheet names: {sheet_names}")
    
    first_sheet = sheet_names[0]
    sheet = wb.get_sheet_by_name(first_sheet)
    rows = iter(sheet.to_python())
    
    for i in range(5):
        try:
            row = next(rows)
            # print up to max_cols items
            print(f"Row {i} (len={len(row)}): {[str(x)[:25] for x in row[:max_cols]]}")
        except StopIteration:
            break

if __name__ == '__main__':
    files = [
        "/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX",
        "/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX",
        "/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx"
    ]
    for f in files:
        if os.path.exists(f):
            inspect_file(f, max_cols=10)
        else:
            print(f"File not found: {f}")
