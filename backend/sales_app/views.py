from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProductMaster, DistributorInvoice, Order, StockLevel, MonthlySales
from .serializers import ProductMasterSerializer, DistributorInvoiceSerializer, OrderSerializer, StockLevelSerializer, MonthlySalesSerializer
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
def upload_orders(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No document provided for upload.'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    try:
        df = pd.read_excel(file)
        
        errors = []
        valid_orders = []
        
        # Load all product master names natively for lightning-fast robust validation
        valid_names = set(ProductMaster.objects.values_list('material_name', flat=True))
        
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
                    invoice_date=None,
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
                def get_val(key_options):
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

                material_name = get_val(['Material Name', 'Material', 'material_name'])
                
                if material_name and material_name not in valid_names:
                    errors.append(f"Row {line_no}: Material '{material_name}' is not matching any Product Master name.")
                    continue
                    
                qty = get_val(['qty(kg)', 'Qty(kg)', 'qty', 'Qty'])
                packsize = get_val(['Packsize(kg)', 'Packsize', 'packsize'])
                
                try:
                    numeric_qty = int(float(qty)) if qty else 0
                except ValueError:
                    numeric_qty = 0
                    
                try:
                    numeric_packsize = float(packsize) if packsize else 0
                except ValueError:
                    numeric_packsize = 0
                    
                invoice_date = get_val(['Invoice Date', 'Date', 'invoice_date'])
                
                if not invoice_date or str(invoice_date).strip() == '':
                    errors.append(f"Row {line_no}: Missing Invoice Date.")
                    continue
                    
                try:
                    if isinstance(row.get('Invoice Date'), pd.Timestamp):
                        invoice_date = row.get('Invoice Date').strftime('%Y-%m-%d')
                    else:
                        invoice_date = pd.to_datetime(invoice_date, format='mixed', dayfirst=True).strftime('%Y-%m-%d')
                except Exception:
                    errors.append(f"Row {line_no}: Unrecognized Invoice Date format '{invoice_date}'.")
                    continue
                     
                valid_orders.append(Order(
                    sold_to=get_val(['Sold To', 'sold_to']),
                    ship_to=get_val(['Ship To', 'ship_to']),
                    invoice_no=get_val(['Invoice No.', 'Invoice No', 'invoice_no']),
                    invoice_date=invoice_date,
                    customer=get_val(['Customer', 'Customer Name', 'customer_name']),
                    material_code=get_val(['Material Code', 'material_code']),
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
                    
            # Extract headers and data
            raw_headers = [str(v).strip() if pd.notna(v) else '' for v in raw_df.iloc[header_row_idx]]
            
            # Deduplicate headers to avoid pandas Series ambiguity on row.get()
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
            
            # Map dynamic months horizontally natively processing pandas .1 suffixing
            for col in df.columns:
                col_str = str(col)
                if 'Unnamed' in col_str: continue
                
                val = row.get(col)
                num_val = 0.0
                if not pd.isna(val):
                    try:
                        num_val = float(str(val).replace(',', ''))
                    except ValueError:
                        pass
                
                if col_str.endswith('.1'):
                    month_key = col_str.replace('.1', '').strip()
                    if 'Total' not in month_key:
                        values[month_key] = num_val
                else:
                    dimension_cols = ['Distributor Name', 'Ship To Code', 'Customer Name', 'Customer Classification (A+,A,B,C,D)', 'Product Code', 'Product Name', 'Product BD Group', 'Total Volume (kg)', 'Total Value (INR)']
                    if col_str not in dimension_cols and 'Total' not in col_str:
                        volumes[col_str.strip()] = num_val
            
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

@api_view(['GET'])
def dashboard_metrics(request):
    try:
        # Top 5 Products by Total Volume
        top_products_qs = MonthlySales.objects.values('product_name')\
                            .annotate(volume=Sum('total_volume'))\
                            .order_by('-volume')[:5]
        top_products = [{'name': item['product_name'] or 'Unknown', 'volume': item['volume'] or 0} for item in top_products_qs]

        # Top 5 Customers by Total Volume
        top_customers_qs = MonthlySales.objects.values('customer_name')\
                            .annotate(volume=Sum('total_volume'))\
                            .order_by('-volume')[:5]
        top_customers = [{'name': item['customer_name'] or 'Unknown', 'volume': item['volume'] or 0} for item in top_customers_qs]

        # Monthly Progression (Dynamic Parsing)
        monthly_progression_dict = {}
        for sale in MonthlySales.objects.all():
            for month, vol in sale.volumes.items():
                if month and month.strip():
                    try:
                        monthly_progression_dict[month] = monthly_progression_dict.get(month, 0) + float(vol)
                    except (ValueError, TypeError):
                        pass
        
        # We assume chronological ordering can be maintained loosely by insertion order, but better kept as simple array
        monthly_progression = [{'name': k, 'volume': v} for k, v in monthly_progression_dict.items()]

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
