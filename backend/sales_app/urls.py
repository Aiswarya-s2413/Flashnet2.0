from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductMasterViewSet, DistributorInvoiceViewSet, OrderViewSet, StockLevelViewSet, upload_products, extract_orders, upload_orders, upload_stock

router = DefaultRouter()
router.register(r'products', ProductMasterViewSet)
router.register(r'invoices', DistributorInvoiceViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'stocks', StockLevelViewSet)

urlpatterns = [
    path('products/upload/', upload_products, name='upload-products'),
    path('orders/extract/', extract_orders, name='extract-orders'),
    path('orders/upload/', upload_orders, name='upload-orders'),
    path('stocks/upload/', upload_stock, name='upload-stock'),
    path('', include(router.urls)),
]

