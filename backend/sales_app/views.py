from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProductMaster, DistributorInvoice, Order, StockLevel, MonthlySales, PrimarySales, ExceptionalPriceRequest, EPRLineItem, TraderTemplate
from .serializers import ProductMasterSerializer, DistributorInvoiceSerializer, OrderSerializer, StockLevelSerializer, MonthlySalesSerializer, PrimarySalesSerializer, ExceptionalPriceRequestSerializer, TraderTemplateSerializer
from django.db.models import Sum
import pandas as pd

class ProductMasterViewSet(viewsets.ModelViewSet):
    queryset = ProductMaster.objects.all()
    serializer_class = ProductMasterSerializer

class DistributorInvoiceViewSet(viewsets.ModelViewSet):
    queryset = DistributorInvoice.objects.all()
    serializer_class = DistributorInvoiceSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class StockLevelViewSet(viewsets.ModelViewSet):
    queryset = StockLevel.objects.all()
    serializer_class = StockLevelSerializer

class MonthlySalesViewSet(viewsets.ModelViewSet):
    queryset = MonthlySales.objects.all()
    serializer_class = MonthlySalesSerializer

class PrimarySalesViewSet(viewsets.ModelViewSet):
    queryset = PrimarySales.objects.all()
    serializer_class = PrimarySalesSerializer

class EPRViewSet(viewsets.ModelViewSet):
    queryset = ExceptionalPriceRequest.objects.all()
    serializer_class = ExceptionalPriceRequestSerializer

class TraderTemplateViewSet(viewsets.ModelViewSet):
    queryset = TraderTemplate.objects.all()
    serializer_class = TraderTemplateSerializer

@api_view(['POST'])
def upload_products(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        df = pd.read_excel(file)
        success_count = 0
        for index, row in df.iterrows():
            if pd.notna(row.get('Material Code')) and pd.notna(row.get('Material Name')):
                material_code = str(row['Material Code']).replace('.0', '')
                ProductMaster.objects.update_or_create(
                    material_code=material_code,
                    defaults={'material_name': str(row['Material Name'])}
                )
                success_count += 1
        return Response({'message': f'Successfully uploaded {success_count} products.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def extract_orders(request):
    invoices = DistributorInvoice.objects.all()
    extracted_count = 0
    errors = []

    for invoice in invoices:
        product_exists = ProductMaster.objects.filter(material_name=invoice.material_name).exists()
        
        if product_exists:
            Order.objects.update_or_create(
                invoice_no=invoice.invoice_no,
                material_code=invoice.material_code,
                defaults={
                    'invoice_date': invoice.invoice_date,
                    'material_name': invoice.material_name,
                    'packsize': invoice.packsize,
                    'qty': invoice.qty,
                    'customer': invoice.customer,
                    'ship_to': invoice.ship_to,
                    'sold_to': invoice.sold_to
                }
            )
            extracted_count += 1
        else:
            errors.append(f"Validation failed for Invoice {invoice.invoice_no}: Material '{invoice.material_name}' not found in Product Master.")
    
    if errors:
        return Response({'message': f'Extracted {extracted_count} orders with errors.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({'message': f'Successfully extracted {extracted_count} orders.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def extract_headers(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        df = pd.read_excel(file, header=None, nrows=10)
        # Scan first few rows to dynamically detect header row if it's pushed down
        header_row_idx = 0
        for i, r in df.iterrows():
            row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
            if len([v for v in row_vals if len(v) > 0]) > 2: # At least 3 columns to be safe
                header_row_idx = i
                break
                
        raw_headers = [str(v).strip() if pd.notna(v) else f'Column_{i}' for i, v in enumerate(df.iloc[header_row_idx])]
        # Remove consecutive unnamed columns
        headers = []
        for x in raw_headers:
            if not x.startswith('Column_') or (x not in headers):
                headers.append(x)
        return Response({'headers': list(dict.fromkeys(headers))}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f"Failed to extract headers: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_orders(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No document provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    mapping_str = request.POST.get('mapping')
    import json
    custom_mapping = {}
    if mapping_str:
        try:
            custom_mapping = json.loads(mapping_str)
        except:
            pass

    try:
        df = pd.read_excel(file)
        
        errors = []
        valid_orders = []
        
        # Load all product master names natively for lightning-fast robust validation
        valid_names = set(ProductMaster.objects.values_list('material_name', flat=True))
        
        # If mapping is provided, force standard format logic and bypass raw format detection
        if custom_mapping:
            has_standard_cols = True
            has_raw_sales_cols = False
        else:
            # --- FORMAT DETECTION ---
            col_names_lower = [str(c).lower().strip() for c in df.columns]
            has_standard_cols = any('material' in c or 'invoice' in c for c in col_names_lower)
            
            # Detect "Vikram Trading" raw sales format: columns like Sr, Code, Name, Nos, Quantity
            # Sometimes these headers are pushed to the second row (df.iloc[0]) because of a title row
            has_raw_sales_cols = any('code' in c for c in col_names_lower) and any('name' in c for c in col_names_lower)
            
            if not has_raw_sales_cols and len(df) > 0:
                first_row_vals = [str(v).lower().strip() for v in df.iloc[0].tolist()]
                if any('code' in v for v in first_row_vals) and any('name' in v for v in first_row_vals):
                    has_raw_sales_cols = True
        
        if not has_standard_cols and has_raw_sales_cols:
            # --- VIKRAM TRADING / RAW SALES FORMAT ---
            # Try scraping the implicit date from the report header column dynamically
            import re
            import datetime
            extracted_date = None
            
            header_text = " ".join([str(c) for c in df.columns[:5]])
            date_match = re.search(r'(\d{2}/\d{2}/\d{4})', header_text)
            if date_match:
                try:
                    extracted_date = datetime.datetime.strptime(date_match.group(1), "%d/%m/%Y").date()
                except ValueError:
                    pass

            # Re-read with header=None to get raw rows, then find the header row
            file.seek(0)
            raw_df = pd.read_excel(file, header=None)
            
            # Find the header row (contains 'Code' and 'Name')
            header_row_idx = None
            for i, row in raw_df.iterrows():
                vals = [str(v).strip().lower() if pd.notna(v) else '' for v in row]
                if 'code' in vals and 'name' in vals:
                    header_row_idx = i
                    break
            
            if header_row_idx is None:
                return Response({'error': 'Could not detect column headers in raw sales file.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse data rows after header
            data_rows = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
            headers = [str(v).strip() if pd.notna(v) else '' for v in raw_df.iloc[header_row_idx]]
            
            # Find column indices
            code_idx = next((i for i, h in enumerate(headers) if h.lower() == 'code'), 1)
            name_idx = next((i for i, h in enumerate(headers) if h.lower() == 'name'), 2)
            qty_idx = next((i for i, h in enumerate(headers) if h.lower() in ('quantity', 'qty')), len(headers) - 1)
            
            current_customer = ''
            
            for i, row in data_rows.iterrows():
                vals = [str(v).strip() if pd.notna(v) else '' for v in row]
                
                # Skip completely empty rows
                if all(v == '' or v == 'nan' for v in vals):
                    continue
                
                col0 = vals[0] if len(vals) > 0 else ''
                code_val = vals[code_idx] if len(vals) > code_idx else ''
                name_val = vals[name_idx] if len(vals) > name_idx else ''
                qty_val = vals[qty_idx] if len(vals) > qty_idx else ''
                
                # Clean up 'nan' strings
                if code_val.lower() == 'nan': code_val = ''
                if name_val.lower() == 'nan': name_val = ''
                if qty_val.lower() == 'nan': qty_val = ''
                
                # Detect CUSTOMER HEADER ROW:
                # Has text in col0 that is NOT a pure number AND has a code+name on the same row
                is_serial = col0.replace('.', '').isdigit() and len(col0) < 5
                
                # Total/summary row: col0 is a number, code and name are empty
                if is_serial and not code_val and not name_val:
                    continue  # Skip total rows
                
                # Customer header row: col0 is NOT a serial number (it's a long text / customer name)
                if col0 and not is_serial and code_val and name_val:
                    current_customer = col0.strip()
                    # This row also contains the first product for this customer
                    # Fall through to process it as a product row
                elif col0 and not is_serial and not code_val:
                    # Customer name only row (no product on this row)
                    current_customer = col0.strip()
                    continue
                
                # Skip rows without a product code or name
                if not code_val or not name_val:
                    continue
                
                # Parse quantity
                try:
                    numeric_qty = int(float(qty_val)) if qty_val else 0
                except ValueError:
                    numeric_qty = 0
                
                # Validate against Product Master with robust fuzzy matching for Raw Sales
                actual_material_name = name_val
                if name_val:
                    if name_val not in valid_names:
                        # Try fuzzy matching: check if DB name starts with raw name or vice versa
                        # Case insensitive match
                        name_lower = name_val.lower()
                        fuzzy_match = next((v for v in valid_names if v.lower().startswith(name_lower) or name_lower.startswith(v.lower())), None)
                        
                        if fuzzy_match:
                            actual_material_name = fuzzy_match
                        else:
                            errors.append(f"Row {header_row_idx + i + 2}: Material '{name_val}' not found in Product Master (even with fuzzy matching).")
                            continue
                
                valid_orders.append(Order(
                    sold_to='',
                    ship_to='',
                    invoice_no='',
                    invoice_date=extracted_date,
                    customer=current_customer,
                    material_code=code_val,
                    material_name=actual_material_name,
                    packsize=0,
                    qty=numeric_qty
                ))
        else:
            # --- STANDARD FORMAT ---
            for index, row in df.iterrows():
                line_no = index + 2 # Excel row number (header is historically row 1)
                
                # Safely fetch and stringify allowing missing empty fields gracefully
                def get_val(key_options, internal_key=None):
                    if internal_key and custom_mapping.get(internal_key):
                        key_options = [custom_mapping[internal_key]] + key_options
                    
                    for k in key_options:
                        if k in df.columns:
                            val = row.get(k)
                            if pd.isna(val) or str(val).strip() == 'nan':
                                return ''
                            
                            # Handle trailing .0 cleanly for ids
                            string_val = str(val).strip()
                            if string_val.endswith('.0'):
                                return string_val[:-2]
                            return string_val
                    return ''

                material_name = get_val(['Material Name', 'Material', 'material_name'], 'material_name')
                
                if material_name and material_name not in valid_names:
                    errors.append(f"Row {line_no}: Material '{material_name}' is not matching any Product Master name.")
                    continue
                    
                qty = get_val(['qty(kg)', 'Qty(kg)', 'qty', 'Qty'], 'qty')
                packsize = get_val(['Packsize(kg)', 'Packsize', 'packsize'], 'packsize')
                
                try:
                    numeric_qty = int(float(qty)) if qty else 0
                except ValueError:
                    numeric_qty = 0
                    
                try:
                    numeric_packsize = float(packsize) if packsize else 0
                except ValueError:
                    numeric_packsize = 0
                    
                invoice_date_key = [custom_mapping['invoice_date']] if custom_mapping.get('invoice_date') else ['Invoice Date', 'Date', 'invoice_date']
                invoice_date = None
                for k in invoice_date_key:
                    if k in df.columns:
                        val = row.get(k)
                        if pd.notna(val) and str(val).strip() != 'nan':
                            invoice_date = val
                            break
                
                if not invoice_date or str(invoice_date).strip() == '':
                    errors.append(f"Row {line_no}: Missing Invoice Date.")
                    continue
                    
                try:
                    if isinstance(invoice_date, pd.Timestamp):
                        invoice_date = invoice_date.strftime('%Y-%m-%d')
                    else:
                        invoice_date = pd.to_datetime(invoice_date, format='mixed', dayfirst=True).strftime('%Y-%m-%d')
                except Exception:
                    errors.append(f"Row {line_no}: Unrecognized Invoice Date format '{invoice_date}'.")
                    continue
                     
                valid_orders.append(Order(
                    sold_to=get_val(['Sold To', 'sold_to'], 'sold_to'),
                    ship_to=get_val(['Ship To', 'ship_to'], 'ship_to'),
                    invoice_no=get_val(['Invoice No.', 'Invoice No', 'invoice_no'], 'invoice_no'),
                    invoice_date=invoice_date,
                    customer=get_val(['Customer', 'Customer Name', 'customer_name'], 'customer'),
                    material_code=get_val(['Material Code', 'material_code'], 'material_code'),
                    material_name=material_name,
                    packsize=numeric_packsize,
                    qty=numeric_qty
                ))
            
        ignore_errors = request.POST.get('ignore_errors', 'false').lower() == 'true'
        
        if errors and not ignore_errors:
            return Response({'message': 'Document validation immediately failed.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        Order.objects.bulk_create(valid_orders)
        
        msg = f'Successfully verified and securely uploaded {len(valid_orders)} direct orders.'
        if errors and ignore_errors:
            msg += f' (Ignored {len(errors)} structurally conflicting rows).'
            
        return Response({'message': msg}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f"Document extraction failed completely: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_stock(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No document provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    filename = file.name.lower()
    
    try:
        # Dynamically support PDF extraction as requested
        if filename.endswith('.pdf'):
            try:
                import pdfplumber
            except ImportError:
                return Response({'error': 'PDF parser not installed natively on server.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            with pdfplumber.open(file) as pdf:
                all_rows = []
                for page in pdf.pages:
                    table = page.extract_table()
                    if table:
                        all_rows.extend(table)
                        
            if not all_rows or len(all_rows) < 2:
                return Response({'error': 'No tabular data could be structurally extracted from the PDF.'}, status=status.HTTP_400_BAD_REQUEST)
                
            headers = [str(h).replace('\n', ' ').strip() if h else '' for h in all_rows[0]]
            df = pd.DataFrame(all_rows[1:], columns=headers)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return Response({'error': 'Unsupported file format. Please upload Excel or PDF.'}, status=status.HTTP_400_BAD_REQUEST)
            
        errors = []
        valid_stocks = []
        
        valid_codes = set(ProductMaster.objects.values_list('material_code', flat=True))
        
        for index, row in df.iterrows():
            line_no = index + 2 
            
            def get_val(key_options):
                for k in key_options:
                    if k in df.columns:
                        val = row.get(k)
                        if pd.isna(val) or str(val).strip() == 'nan' or val is None:
                            return ''
                        string_val = str(val).strip()
                        if string_val.endswith('.0'):
                            return string_val[:-2]
                        return string_val
                return ''

            product_code = get_val(['Product Code', 'product_code'])
            product_desc = get_val(['Prod Desc', 'product_desc', 'Product Desc'])
            
            # Skip genuinely empty rows safely
            if not product_code and not product_desc:
                continue
            
            if product_code and product_code not in valid_codes:
                errors.append(f"Row {line_no}: Product Code '{product_code}' is not matching any verified Product Master code.")
                continue 
                
            def get_float(key_options):
                val = get_val(key_options)
                try:
                    return float(val) if val else None
                except ValueError:
                    return None
            
            valid_stocks.append(StockLevel(
                sold_to=get_val(['Sold To', 'sold_to']),
                ship_to=get_val(['Ship To', 'ship_to']),
                product_code=product_code,
                product_desc=product_desc,
                avg_six_month_sales=get_float(['Avg Last six month sales in kg', 'Avg Last six month']),
                month_end_inventory=get_float(['Month End Inventory', 'month_end_inventory']),
                mid_month_inventory=get_float(['Mid Month Inventory', 'mid_month_inventory']),
                remarks=get_val(['Remarks/Comments', 'Remarks', 'comments'])
            ))
            
        ignore_errors = request.POST.get('ignore_errors', 'false').lower() == 'true'
        if errors and not ignore_errors:
            return Response({'message': 'Document validation failed.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        StockLevel.objects.bulk_create(valid_stocks)
        msg = f'Successfully verified and uploaded {len(valid_stocks)} stock records natively.'
        if errors and ignore_errors:
            msg += f' (Ignored {len(errors)} structurally conflicting rows).'
        return Response({'message': msg}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f"Document extraction failed completely: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_monthly_sales(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No document provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    filename = file.name.lower()
    
    try:
        # Dynamically support PDF extraction as requested
        if filename.endswith('.pdf'):
            try:
                import pdfplumber
            except ImportError:
                return Response({'error': 'PDF parser not installed natively.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            with pdfplumber.open(file) as pdf:
                all_rows = []
                for page in pdf.pages:
                    table = page.extract_table()
                    if table:
                        all_rows.extend(table)
                        
            if not all_rows or len(all_rows) < 4:
                return Response({'error': 'No tabular data could be structurally extracted.'}, status=status.HTTP_400_BAD_REQUEST)
                
            headers = [str(h).replace('\n', ' ').strip() if h else '' for h in all_rows[2]] # Assuming headers are mostly row 3
            df = pd.DataFrame(all_rows[3:], columns=headers)
        elif filename.endswith(('.xls', '.xlsx')):
            # Dynamically detect header row by scanning first 5 rows
            raw_df = pd.read_excel(file, header=None)
            header_row_idx = 0
            
            for i, r in raw_df.head(6).iterrows():
                row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
                if any('product code' in v or 'customer name' in v or 'product name' in v for v in row_vals):
                    header_row_idx = i
                    break
                    
            # Extract headers and data, gracefully handling datetime headers
            import datetime
            raw_headers = []
            for v in raw_df.iloc[header_row_idx]:
                if pd.isna(v):
                    raw_headers.append('')
                elif isinstance(v, (pd.Timestamp, datetime.datetime)):
                    raw_headers.append(v.strftime('%b %Y'))
                else:
                    s = str(v).strip()
                    if s.endswith('00:00:00'):
                        s = s.replace('00:00:00', '').strip()
                    raw_headers.append(s)
            
            # Deduplicate headers to avoid pandas Series ambiguity on row.get()
            # Value columns are typically next to Volume columns, receiving a duplicated header
            headers = []
            seen = set()
            for h in raw_headers:
                new_h = h
                idx = 1
                while new_h and new_h in seen:
                    new_h = f"{h}_{idx}"
                    idx += 1
                headers.append(new_h)
                if new_h:
                    seen.add(new_h)
                
            df = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
            df.columns = headers
        else:
            return Response({'error': 'Unsupported file.'}, status=status.HTTP_400_BAD_REQUEST)
            
        errors = []
        valid_records = []
        
        valid_codes = set(ProductMaster.objects.values_list('material_code', flat=True))
        
        for index, row in df.iterrows():
            line_no = header_row_idx + index + 2 
            
            def get_val(key_name):
                # Try exact match first
                if key_name in df.columns:
                    val = row.get(key_name)
                    # Handle if there are STILL duplicate columns and row.get returned a Series
                    if isinstance(val, pd.Series):
                        val = val.iloc[0]
                    
                    if pd.isna(val) or str(val).strip() == 'nan' or val is None:
                        return ''
                    string_val = str(val).strip()
                    if string_val.endswith('.0') and not key_name.startswith('Total'):
                        return string_val[:-2]
                    return string_val
                
                # Try case insensitive match if exact fails
                lower_key = key_name.lower()
                for c in df.columns:
                    if str(c).lower().strip() == lower_key:
                        val = row.get(c)
                        if isinstance(val, pd.Series):
                            val = val.iloc[0]
                            
                        if pd.isna(val) or str(val).strip() == 'nan' or val is None:
                            return ''
                        string_val = str(val).strip()
                        if string_val.endswith('.0') and not key_name.startswith('Total'):
                            return string_val[:-2]
                        return string_val
                return ''

            product_code = get_val('Product Code')
            product_name = get_val('Product Name')
            customer_name = get_val('Customer Name')
            
            if not product_code and not product_name and not customer_name:
                continue 
            
            if product_code and product_code not in valid_codes:
                errors.append(f"Row {line_no}: Product Code '{product_code}' is disconnected from explicit Product Master registries.")
                continue 
                
            volumes = {}
            values = {}
            
            # Map dynamic months horizontally natively processing pandas suffixing
            import dateutil.parser
            for col in df.columns:
                col_str = str(col)
                if 'Unnamed' in col_str or not col_str.strip(): continue
                
                val = row.get(col)
                num_val = 0.0
                if not pd.isna(val):
                    try:
                        num_val = float(str(val).replace(',', ''))
                    except ValueError:
                        pass
                
                if col_str.endswith('_1') or col_str.endswith('.1'):
                    month_key = col_str.replace('_1', '').replace('.1', '').strip()
                    if 'Total' not in month_key:
                        try:
                            month_key = dateutil.parser.parse(month_key).strftime('%Y-%m')
                        except Exception:
                            pass
                        values[month_key] = num_val
                else:
                    dimension_cols = ['distributor name', 'ship to code', 'customer name', 'customer classification (a+,a,b,c,d)', 'product code', 'product name', 'product bd group', 'total volume (kg)', 'total value (inr)']
                    if col_str.lower() not in dimension_cols and 'Total' not in col_str:
                        month_key = col_str.strip()
                        try:
                            month_key = dateutil.parser.parse(month_key).strftime('%Y-%m')
                        except Exception:
                            pass
                        volumes[month_key] = num_val
            
            total_vol_raw = get_val('Total Volume (kg)')
            total_val_raw = get_val('Total Value (INR)')
            
            try:
                total_vol = float(total_vol_raw.replace(',', '')) if total_vol_raw else 0.0
                total_val = float(total_val_raw.replace(',', '')) if total_val_raw else 0.0
            except ValueError:
                total_vol = 0.0
                total_val = 0.0
            
            valid_records.append(MonthlySales(
                distributor_name=get_val('Distributor Name'),
                ship_to_code=get_val('Ship To Code'),
                customer_name=customer_name,
                customer_classification=get_val('Customer Classification (A+,A,B,C,D)'),
                product_code=product_code,
                product_name=product_name,
                product_bd_group=get_val('Product BD Group'),
                volumes=volumes,
                total_volume=total_vol,
                values=values,
                total_value=total_val
            ))
            
        ignore_errors = request.POST.get('ignore_errors', 'false').lower() == 'true'
        if errors and not ignore_errors:
            return Response({'message': 'Document validation failed.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        MonthlySales.objects.bulk_create(valid_records)
        msg = f'Successfully ingested {len(valid_records)} robust Monthly Sales records.'
        if errors and ignore_errors:
            msg += f' (Ignored {len(errors)} structurally conflicting rows).'
        return Response({'message': msg}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f"Document pipeline failed natively: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_primary_sales(request):
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
            
        filename = file.name.lower()
        if filename.endswith(('.xls', '.xlsx')):
            raw_df = pd.read_excel(file, header=None)
            header_row_idx = 0
            
            for i, r in raw_df.head(6).iterrows():
                row_vals = [str(v).strip().lower() if pd.notna(v) else '' for v in r]
                if any('billing no' in v or 'tax invoice' in v or 'assessable' in v for v in row_vals):
                    header_row_idx = i
                    break
                    
            raw_headers = [str(v).strip() if pd.notna(v) else '' for v in raw_df.iloc[header_row_idx]]
            headers = []
            seen = set()
            for h in raw_headers:
                new_h = h
                idx = 1
                while new_h in seen:
                    new_h = f"{h}_{idx}"
                    idx += 1
                headers.append(new_h)
                seen.add(new_h)
                
            df = raw_df.iloc[header_row_idx + 1:].reset_index(drop=True)
            df.columns = headers
        else:
            return Response({'error': 'Unsupported file.'}, status=status.HTTP_400_BAD_REQUEST)
            
        errors = []
        valid_records = []
        ignore_errors = request.POST.get('ignore_errors', 'false').lower() == 'true'
        
        valid_codes = set(ProductMaster.objects.values_list('material_code', flat=True))
        
        for index, row in df.iterrows():
            line_no = header_row_idx + index + 2 
            
            def get_val(key_name):
                import re
                lower_key = re.sub(r'[\s\n\r_]', '', key_name.lower())
                for c in df.columns:
                    header_str = re.sub(r'[\s\n\r_]', '', str(c).lower())
                    if lower_key in header_str:
                        val = row.get(c)
                        if isinstance(val, pd.Series):
                            val = val.iloc[0]
                        if pd.isna(val) or str(val).strip() == 'nan' or val is None:
                            return ''
                        string_val = str(val).strip()
                        if string_val.endswith('.0'):
                            return string_val[:-2]
                        return string_val
                return ''

            billing_no = get_val('Billing No')
            material_code = get_val('Material Code')
            
            if not billing_no and not material_code:
                continue
                
            if material_code and material_code not in valid_codes:
                errors.append(f"Row {line_no}: Material Code '{material_code}' not perfectly recognized in Product Master.")
                continue
                
            so_date_raw = get_val('SO Creation Date')
            so_date = None
            if so_date_raw:
                try:
                    so_date = pd.to_datetime(so_date_raw).date()
                except Exception:
                    errors.append(f"Row {line_no}: Invalid SO Date.")
                    continue
                    
            bill_date_raw = get_val('Billing Date')
            bill_date = None
            if bill_date_raw:
                try:
                    bill_date = pd.to_datetime(bill_date_raw).date()
                except Exception:
                    errors.append(f"Row {line_no}: Invalid Billing Date.")
                    continue
                    
            def get_float(name):
                val = get_val(name)
                if val:
                    try:
                        import re
                        clean_val = re.sub(r'[^\d.-]', '', str(val))
                        return float(clean_val)
                    except Exception: return 0.0
                return 0.0

            valid_records.append(PrimarySales(
                billing_no=billing_no,
                tax_invoice_no=get_val('Tax Invoice No'),
                sales_order=get_val('Sales Order'),
                so_creation_date=so_date,
                division=get_val('Division'),
                sold_to_party=get_val('Sold to party'),
                sold_to_party_address=get_val('Sold to party Address'),
                ship_to_party=get_val('Ship to Party'),
                ship_to_party_name=get_val('Ship to Party Name'),
                material_code=material_code,
                material_desc=get_val('Material Desc'),
                billing_date=bill_date,
                plant=get_val('Plant'),
                rate_per_unit=get_float('Rate Per Unit'),
                billed_quantity=get_float('Billed Quantity'),
                assessable_value=get_float('Assessable Value') or get_float('Assesable Value')
            ))
            
        if errors and not ignore_errors:
            return Response({'message': 'Validation failed heavily.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        PrimarySales.objects.bulk_create(valid_records)
        msg = f'Successfully secured {len(valid_records)} Primary Sales extractions.'
        if errors and ignore_errors:
            msg += f' (Ignored {len(errors)} format conflicts).'
        return Response({'message': msg}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f"Primary Sales parser totally failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def dashboard_metrics(request):
    try:
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth

        # Top 5 Products by Total Volume
        top_products_qs = Order.objects.values('material_name')\
                            .annotate(volume=Sum('qty'))\
                            .order_by('-volume')[:5]
        top_products = [{'name': item['material_name'] or 'Unknown', 'volume': item['volume'] or 0} for item in top_products_qs]

        # Top 5 Customers by Total Volume
        top_customers_qs = Order.objects.values('customer')\
                            .annotate(volume=Sum('qty'))\
                            .order_by('-volume')[:5]
        top_customers = [{'name': item['customer'] or 'Unknown', 'volume': item['volume'] or 0} for item in top_customers_qs]

        # Monthly Progression extracted dynamically from genuine invoice dates
        monthly_progression_qs = Order.objects.annotate(month=TruncMonth('invoice_date'))\
                                    .values('month')\
                                    .annotate(volume=Sum('qty'))\
                                    .order_by('month')
        
        monthly_progression = []
        for item in monthly_progression_qs:
            if item['month']:
                month_str = item['month'].strftime('%Y-%m')
                monthly_progression.append({'name': month_str, 'volume': item['volume'] or 0})

        # Top 5 Stock Levels by Month End Inventory
        stock_qs = StockLevel.objects.values('product_desc')\
                    .annotate(stock=Sum('month_end_inventory'))\
                    .order_by('-stock')[:5]
        stock_levels = [{'name': item['product_desc'] or 'Unknown', 'stock': item['stock'] or 0} for item in stock_qs]

        return Response({
            'top_products': top_products,
            'top_customers': top_customers,
            'monthly_progression': monthly_progression,
            'stock_levels': stock_levels
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def primary_vs_secondary_analytics(request):
    try:
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        from collections import defaultdict
        import datetime

        # 1. KPI EXTRACTION (Strictly Volume based matching)
        ps_agg = PrimarySales.objects.aggregate(total=Sum('billed_quantity'))
        ss_agg = Order.objects.aggregate(total=Sum('qty'))
        
        total_ps = ps_agg['total'] or 0.0
        total_ss = ss_agg['total'] or 0.0

        # 2. MONTHLY TRENDS MATCHING
        trend_map = defaultdict(lambda: {'ps': 0, 'ss': 0})
        
        # Primary Sales Months
        ps_months = PrimarySales.objects.annotate(month=TruncMonth('billing_date')).values('month').annotate(total=Sum('billed_quantity'))
        for pm in ps_months:
            if pm['month']:
                month_str = pm['month'].strftime('%Y-%m')
                trend_map[month_str]['ps'] += pm['total']

        # Secondary Sales Months (Raw Invoice Dates mapped cleanly)
        ss_months = Order.objects.annotate(month=TruncMonth('invoice_date')).values('month').annotate(total=Sum('qty'))
        for sm in ss_months:
            if sm['month']:
                month_str = sm['month'].strftime('%Y-%m')
                trend_map[month_str]['ss'] += sm['total']

        # Intersection-based Global KPI Efficiency Calculation
        shared_months = [m for m, v in trend_map.items() if v['ps'] > 0 and v['ss'] > 0]
        if shared_months:
            ps_shared_total = sum(trend_map[m]['ps'] for m in shared_months)
            ss_shared_total = sum(trend_map[m]['ss'] for m in shared_months)
            channel_efficiency = (ss_shared_total / ps_shared_total * 100) if ps_shared_total > 0 else 0
        else:
            channel_efficiency = (total_ss / total_ps * 100) if total_ps > 0 else 0

        # Build Trend Array intelligently
        trend_array = []
        for k, v in trend_map.items():
            if v['ps'] > 0 and v['ss'] > 0:
                eff = (v['ss'] / v['ps'] * 100) if v['ps'] > 0 else 0
                trend_array.append({
                    'month': k,
                    'Primary Sales': round(v['ps'], 2),
                    'Secondary Sales': round(v['ss'], 2),
                    'Efficiency %': round(eff, 2)
                })
        
        def parse_my(my_str):
            try:
                import dateutil.parser
                return dateutil.parser.parse(my_str)
            except:
                return datetime.datetime.min

        trend_array.sort(key=lambda x: parse_my(x['month']))

        # 3. DISTRIBUTOR COMPARISONS
        dist_map = defaultdict(lambda: {'ps': 0, 'ss': 0, 'zone': 'All', 'sold_to': set(), 'ship_to': set()})
        
        import re
        def get_group_name(raw_name):
            n = raw_name.upper()
            if 'VIKRAM' in n: return 'VIKRAM TRADING'
            if 'JAKHARIA' in n: return 'JAKHARIA INDUSTRIES'
            n = re.sub(r'\s+(CO\.|COMPANY|LTD\.|PVT\.|PRIVATE|LIMITED)$', '', n).strip()
            return n

        for ps in PrimarySales.objects.all():
            sold = ps.sold_to_party_address or ps.sold_to_party or ''
            ship = ps.ship_to_party_name or ps.ship_to_party or ''
            raw_name = ship if ship else sold
            if raw_name:
                group = get_group_name(raw_name)
                dist_map[group]['ps'] += (ps.billed_quantity or 0)
                if ps.division: dist_map[group]['zone'] = ps.division
                if sold: dist_map[group]['sold_to'].add(str(sold).strip().title())
                if ship: dist_map[group]['ship_to'].add(str(ship).strip().title())
                
        for ms in Order.objects.all():
            raw_name = str(ms.customer).strip() or str(ms.ship_to).strip() or str(ms.sold_to).strip()
            if raw_name:
                group = get_group_name(raw_name)
                dist_map[group]['ss'] += (ms.qty or 0)
                if ms.sold_to: dist_map[group]['sold_to'].add(str(ms.sold_to).title())
                if ms.ship_to: dist_map[group]['ship_to'].add(str(ms.ship_to).title())

        distributor_array = []
        for k, v in dist_map.items():
            if v['ps'] == 0 and v['ss'] == 0: continue
            eff = (v['ss'] / v['ps'] * 100) if v['ps'] > 0 else 0
            distributor_array.append({
                'group': k,
                'sold_to': ', '.join(list(v['sold_to']))[:100],
                'ship_to': ', '.join(list(v['ship_to']))[:100],
                'primary': round(v['ps'], 2),
                'secondary': round(v['ss'], 2),
                'efficiency': round(eff, 2)
            })
        
        # Top 10 by Primary Sales
        distributor_array.sort(key=lambda x: x['primary'], reverse=True)
        
        # 4. PRODUCT GROUP BREAKDOWN
        prod_map = defaultdict(lambda: {'ps': 0, 'ss': 0})
        
        for ps in PrimarySales.objects.all():
            group = ps.material_desc or 'Unknown Product'
            group = group.split(' ')[0] if group != 'Unknown Product' else 'Unknown Product'
            prod_map[group]['ps'] += (ps.billed_quantity or 0)

        for ms in Order.objects.all():
            group = ms.material_name or 'Unknown Product'
            group = group.split(' ')[0] if group != 'Unknown Product' else 'Unknown Product'
            prod_map[group]['ss'] += (ms.qty or 0)

        product_array = [{'group': k, 'Primary Sales': round(v['ps'], 2), 'Secondary Sales': round(v['ss'], 2)} 
                         for k, v in prod_map.items() if (v['ps'] > 0 or v['ss'] > 0)]
        product_array.sort(key=lambda x: x['Primary Sales'] + x['Secondary Sales'], reverse=True)

        return Response({
            'kpis': {
                'total_primary': round(total_ps, 2),
                'total_secondary': round(total_ss, 2),
                'channel_efficiency': round(channel_efficiency, 2),
            },
            'monthly_trend': trend_array,
            'distributor_performance': distributor_array[:50],
            'product_group': product_array[:15]
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
