import openpyxl

files = {
    'KNA1': "/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX",
    'VBRK': "/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX",
}

for name, path in files.items():
    print(f"\nChecking yellow columns in {name}...")
    wb = openpyxl.load_workbook(path, read_only=False, data_only=True)
    ws = wb.active
    yellow_cols = []
    # check first 2 rows
    for col_idx in range(1, ws.max_column + 1):
        cell1 = ws.cell(row=1, column=col_idx)
        cell2 = ws.cell(row=2, column=col_idx)
        
        # Check fill
        f1 = cell1.fill
        f2 = cell2.fill
        
        color1 = getattr(f1.start_color, 'rgb', None) if f1 else None
        color2 = getattr(f2.start_color, 'rgb', None) if f2 else None
        
        # Check if yellow-ish (usually FFFF00 or contains yellow)
        if (color1 and color1 != '00000000' and color1 != 'FFFFFFFF') or (color2 and color2 != '00000000' and color2 != 'FFFFFFFF'):
            yellow_cols.append((cell1.column_letter, col_idx, cell1.value, color1, color2))
            
    print(f"Yellow/highlighted columns in {name}:")
    for letter, idx, val, c1, c2 in yellow_cols:
        print(f"  Col {letter} (idx {idx}): '{val}' (colors: {c1}, {c2})")
    wb.close()
