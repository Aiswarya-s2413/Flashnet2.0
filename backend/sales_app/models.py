from django.db import models

class ProductMaster(models.Model):
    material_code = models.CharField(max_length=100, unique=True)
    material_name = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)

    # New fields
    mat_div = models.CharField(max_length=50, blank=True, default='')
    prod_hierracy_code = models.CharField(max_length=100, blank=True, default='')
    pack_size = models.CharField(max_length=50, blank=True, default='')
    special_price = models.FloatField(blank=True, null=True)
    end_customer_code = models.CharField(max_length=100, blank=True, default='')
    from_date = models.DateField(blank=True, null=True)
    to_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.material_code} - {self.material_name}"

class DistributorInvoice(models.Model):
    invoice_no = models.CharField(max_length=100)
    invoice_date = models.DateField()
    material_code = models.CharField(max_length=100)
    material_name = models.CharField(max_length=255)
    packsize = models.CharField(max_length=100)
    qty = models.IntegerField()
    customer = models.CharField(max_length=255)
    ship_to = models.TextField()
    sold_to = models.TextField()
    value = models.FloatField(default=0, blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.invoice_no}: {self.material_name} ({self.qty})"

class Order(models.Model):
    invoice_no = models.CharField(max_length=100, blank=True, default='')
    invoice_date = models.DateField(null=True, blank=True)
    material_code = models.CharField(max_length=100)
    material_name = models.CharField(max_length=255)
    packsize = models.CharField(max_length=100)
    qty = models.IntegerField()
    customer = models.CharField(max_length=255, blank=True, default='')
    ship_to = models.TextField(blank=True, default='')
    sold_to = models.TextField(blank=True, default='')
    value = models.FloatField(default=0, blank=True, null=True)

    def __str__(self):
        return f"Order {self.invoice_no}: {self.material_name} ({self.qty})"

class StockLevel(models.Model):
    sold_to = models.CharField(max_length=100, blank=True, null=True)
    ship_to = models.CharField(max_length=100, blank=True, null=True)
    product_code = models.CharField(max_length=100)
    product_desc = models.CharField(max_length=255)
    avg_six_month_sales = models.FloatField(blank=True, null=True)
    month_end_inventory = models.FloatField(blank=True, null=True)
    mid_month_inventory = models.FloatField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    month = models.IntegerField(blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"Stock: {self.product_desc} ({self.month_end_inventory})"

class MonthlySales(models.Model):
    distributor_name = models.CharField(max_length=255, blank=True, null=True)
    ship_to_code = models.CharField(max_length=100, blank=True, null=True)
    customer_name = models.CharField(max_length=255, blank=True, null=True)
    customer_classification = models.CharField(max_length=50, blank=True, null=True)
    product_code = models.CharField(max_length=100)
    product_name = models.CharField(max_length=255)
    product_bd_group = models.CharField(max_length=100, blank=True, null=True)
    
    volumes = models.JSONField(default=dict)
    total_volume = models.FloatField(default=0, blank=True, null=True)
    
    values = models.JSONField(default=dict)
    total_value = models.FloatField(default=0, blank=True, null=True)

    def __str__(self):
        return f"Sales: {self.customer_name} - {self.product_name}"

class PrimarySales(models.Model):
    billing_no = models.CharField(max_length=100, blank=True, null=True)
    tax_invoice_no = models.CharField(max_length=100, blank=True, null=True)
    sales_order = models.CharField(max_length=100, blank=True, null=True)
    so_creation_date = models.DateField(blank=True, null=True)
    division = models.CharField(max_length=50, blank=True, null=True)
    sold_to_party = models.CharField(max_length=100, blank=True, null=True)
    sold_to_party_address = models.TextField(blank=True, null=True)
    ship_to_party = models.CharField(max_length=100, blank=True, null=True)
    ship_to_party_name = models.CharField(max_length=255, blank=True, null=True)
    material_code = models.CharField(max_length=100, blank=True, null=True)
    material_desc = models.CharField(max_length=255, blank=True, null=True)
    billing_date = models.DateField(blank=True, null=True)
    plant = models.CharField(max_length=100, blank=True, null=True)
    rate_per_unit = models.FloatField(blank=True, null=True)
    billed_quantity = models.FloatField(blank=True, null=True)
    assessable_value = models.FloatField(blank=True, null=True)

    def __str__(self):
        return f"Primary Sale: {self.billing_no} - {self.material_desc}"

class ExceptionalPriceRequest(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Pending Sales Exec Review', 'Pending Sales Exec Review'),
        ('Pending Pricing & BD Teams', 'Pending Pricing & BD Teams'),
        ('Pending Sales Director', 'Pending Sales Director'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected')
    ]
    legacy_organization = models.CharField(max_length=255, blank=True, null=True)
    soldto_code = models.CharField(max_length=100, blank=True, null=True)
    soldto_name = models.CharField(max_length=255, blank=True, null=True)
    shipto_code = models.CharField(max_length=100, blank=True, null=True)
    shipto_name = models.CharField(max_length=255, blank=True, null=True)
    end_customer_name = models.CharField(max_length=255, blank=True, null=True)
    additional_remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending Sales Exec Review')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"EPR #{self.id} - {self.soldto_name} ({self.status})"

class EPRLineItem(models.Model):
    epr = models.ForeignKey(ExceptionalPriceRequest, related_name='line_items', on_delete=models.CASCADE)
    business_proposal = models.CharField(max_length=100, blank=True, null=True)
    price_request_type = models.CharField(max_length=100, blank=True, null=True)
    material_code = models.CharField(max_length=100, blank=True, null=True)
    material_name = models.CharField(max_length=255, blank=True, null=True)
    existing_dist_price = models.FloatField(blank=True, null=True)
    existing_icp = models.FloatField(blank=True, null=True)
    existing_sale_volume = models.FloatField(blank=True, null=True)
    requested_dist_price = models.FloatField(blank=True, null=True)
    requested_icp = models.FloatField(blank=True, null=True)
    proposed_sale_volume = models.FloatField(blank=True, null=True)
    freight_charges = models.CharField(max_length=255, blank=True, null=True)
    distributor_payment_terms = models.CharField(max_length=100, blank=True, null=True)
    end_customer_payment_terms = models.CharField(max_length=100, blank=True, null=True)
    product_used_in_package = models.CharField(max_length=20, blank=True, null=True)
    other_products_details = models.CharField(max_length=255, blank=True, null=True)
    competition_running = models.CharField(max_length=20, blank=True, null=True)
    competition_product_name = models.CharField(max_length=255, blank=True, null=True)
    competition_price = models.FloatField(blank=True, null=True)
    competition_volume = models.FloatField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Line Item {self.material_name} for EPR #{self.epr_id}"

class TraderTemplate(models.Model):
    trader_name = models.CharField(max_length=255, unique=True)
    column_mapping = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.trader_name
