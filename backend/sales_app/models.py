from django.db import models

class ProductMaster(models.Model):
    material_code = models.CharField(max_length=100, unique=True)
    material_name = models.CharField(max_length=255)

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

    def __str__(self):
        return f"Invoice {self.invoice_no}: {self.material_name} ({self.qty})"

class Order(models.Model):
    invoice_no = models.CharField(max_length=100)
    invoice_date = models.DateField()
    material_code = models.CharField(max_length=100)
    material_name = models.CharField(max_length=255)
    packsize = models.CharField(max_length=100)
    qty = models.IntegerField()
    customer = models.CharField(max_length=255)
    ship_to = models.TextField()
    sold_to = models.TextField()

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
