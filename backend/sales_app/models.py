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
