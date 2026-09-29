from python_calamine import CalamineWorkbook
import time

def test_counts():
    t0 = time.time()
    print("Checking KNA1...")
    wb_kna1 = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/KNA1 Extract_INX1 & INX2.XLSX")
    sheet_kna1 = wb_kna1.get_sheet_by_name(wb_kna1.sheet_names[0])
    kna1_count = len(sheet_kna1.to_python()) - 1
    print(f"KNA1 rows: {kna1_count:,} ({time.time()-t0:.2f}s)")

    t0 = time.time()
    print("Checking VBRK...")
    wb_vbrk = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/VBRK Extract_INX1 & INX2.XLSX")
    sheet_vbrk = wb_vbrk.get_sheet_by_name(wb_vbrk.sheet_names[0])
    vbrk_count = len(sheet_vbrk.to_python()) - 1
    print(f"VBRK rows: {vbrk_count:,} ({time.time()-t0:.2f}s)")

    t0 = time.time()
    print("Checking VBRP...")
    wb_vbrp = CalamineWorkbook.from_path("/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx")
    sheet_vbrp = wb_vbrp.get_sheet_by_name(wb_vbrp.sheet_names[0])
    vbrp_count = len(sheet_vbrp.to_python()) - 1
    print(f"VBRP rows: {vbrp_count:,} ({time.time()-t0:.2f}s)")

if __name__ == '__main__':
    test_counts()
