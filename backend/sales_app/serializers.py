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
    id = serializers.IntegerField(required=False)

    class Meta:
        model = EPRLineItem
        fields = '__all__'
        extra_kwargs = {'epr': {'read_only': True}}

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

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)

        # Update parent fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if line_items_data is not None:
            existing_items = {item.id: item for item in instance.line_items.all()}
            existing_items_list = list(instance.line_items.all())

            for idx, item_data in enumerate(line_items_data):
                item_id = item_data.get('id')
                line_item = None
                if item_id and item_id in existing_items:
                    line_item = existing_items[item_id]
                elif idx < len(existing_items_list):
                    line_item = existing_items_list[idx]

                if line_item:
                    for attr, value in item_data.items():
                        if attr != 'id':
                            setattr(line_item, attr, value)
                    line_item.save()
        return instance

class TraderTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraderTemplate
        fields = '__all__'
