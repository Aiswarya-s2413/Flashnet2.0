from rest_framework import serializers
from .models import ProductMaster, DistributorInvoice, Order, StockLevel
from django.utils import timezone

class ProductMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMaster
        fields = '__all__'

class DistributorInvoiceSerializer(serializers.ModelSerializer):
    invoice_date = serializers.DateField(format="%d-%m-%Y", input_formats=["%d-%m-%Y"])

    class Meta:
        model = DistributorInvoice
        fields = '__all__'

    def validate_invoice_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Invoice date cannot be in the future.")
        return value

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class StockLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLevel
        fields = '__all__'
