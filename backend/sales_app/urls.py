from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductMasterViewSet, DistributorInvoiceViewSet, OrderViewSet, upload_products, extract_orders

router = DefaultRouter()
router.register(r'products', ProductMasterViewSet)
router.register(r'invoices', DistributorInvoiceViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('products/upload/', upload_products, name='upload-products'),
    path('orders/extract/', extract_orders, name='extract-orders'),
    path('', include(router.urls)),
]

