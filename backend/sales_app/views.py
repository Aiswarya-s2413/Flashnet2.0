from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProductMaster, DistributorInvoice, Order
from .serializers import ProductMasterSerializer, DistributorInvoiceSerializer, OrderSerializer
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
                continue # Skip processing this row mathematically, but keep capturing errors
                
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
            # Attempt parsing ISO back to DD-MM-YYYY if pandas parsed it as native datetime
            if isinstance(row.get('Invoice Date'), pd.Timestamp):
                 invoice_date = row.get('Invoice Date').strftime('%d-%m-%Y')
                 
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
            
        if errors:
            # Rejects entire upload actively indicating N-th line violations
            return Response({'message': 'Document validation immediately failed.', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        # Bulk save cleanly populated objects leaving untraced fields blank without crashing
        Order.objects.bulk_create(valid_orders)
        
        return Response({'message': f'Successfully verified and securely uploaded {len(valid_orders)} direct orders.'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f"Document extraction failed completely: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
