import zipfile
import xml.etree.ElementTree as ET

path = "/Users/aiswarya/Downloads/VBRP Extract_INX1 & INX2 (2).xlsx"

with zipfile.ZipFile(path, 'r') as z:
    # Read styles
    styles_root = ET.fromstring(z.read('xl/styles.xml'))
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    
    # Find yellow fill indices
    yellow_fill_indices = set()
    fills = styles_root.find('main:fills', ns)
    if fills is not None:
        for idx, fill in enumerate(fills.findall('main:fill', ns)):
            pattern = fill.find('main:patternFill', ns)
            if pattern is not None:
                fg = pattern.find('main:fgColor', ns)
                if fg is not None:
                    rgb = fg.attrib.get('rgb')
                    if rgb and 'FFFF00' in rgb:
                        yellow_fill_indices.add(idx)
                        print(f"Fill index {idx} is yellow: {rgb}")

    # Find xf indices that use this fill
    cell_xfs = styles_root.find('main:cellXfs', ns)
    yellow_style_indices = set()
    if cell_xfs is not None:
        for idx, xf in enumerate(cell_xfs.findall('main:xf', ns)):
            fill_id = int(xf.attrib.get('fillId', 0))
            if fill_id in yellow_fill_indices:
                yellow_style_indices.add(idx)
                print(f"Style index {idx} uses yellow fill")

    # Read shared strings if needed, or check row 1 and 2 of sheet1
    # Read sheet1.xml
    with z.open('xl/worksheets/sheet1.xml') as f:
        # iterate tags
        context = ET.iterparse(f, events=('start', 'end'))
        _, root = next(context)
        yellow_cells = []
        for event, elem in context:
            if event == 'end' and elem.tag.endswith('row'):
                row_num = int(elem.attrib.get('r', 0))
                if row_num in (1, 2):
                    for c in elem.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        s = int(c.attrib.get('s', 0))
                        r = c.attrib.get('r')
                        if s in yellow_style_indices:
                            yellow_cells.append(r)
                if row_num > 2:
                    break
                root.clear()
        print(f"Yellow cells in row 1/2 of VBRP: {yellow_cells}")

