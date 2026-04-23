from rest_framework import serializers
from .models import ProductMaster, DistributorInvoice, Order, StockLevel, MonthlySales, PrimarySales, ExceptionalPriceRequest, EPRLineItem, TraderTemplate
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

class MonthlySalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlySales
        fields = '__all__'

class PrimarySalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimarySales
        fields = '__all__'

class EPRLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EPRLineItem
        fields = '__all__'

class ExceptionalPriceRequestSerializer(serializers.ModelSerializer):
    line_items = EPRLineItemSerializer(many=True, required=False)

    class Meta:
        model = ExceptionalPriceRequest
        fields = '__all__'

    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        epr = ExceptionalPriceRequest.objects.create(**validated_data)
        for line_item_data in line_items_data:
            EPRLineItem.objects.create(epr=epr, **line_item_data)
        return epr

class TraderTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraderTemplate
        fields = '__all__'
