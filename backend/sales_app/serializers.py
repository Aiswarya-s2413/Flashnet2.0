from rest_framework import serializers
from .models import ProductMaster, DistributorInvoice, Order

class ProductMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMaster
        fields = '__all__'

class DistributorInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributorInvoice
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'
