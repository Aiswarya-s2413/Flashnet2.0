from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductMasterViewSet, DistributorInvoiceViewSet, OrderViewSet, StockLevelViewSet, MonthlySalesViewSet, upload_products, extract_orders, upload_orders, upload_stock, upload_monthly_sales, dashboard_metrics

router = DefaultRouter()
router.register(r'products', ProductMasterViewSet)
router.register(r'invoices', DistributorInvoiceViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'stocks', StockLevelViewSet)
router.register(r'monthly-sales', MonthlySalesViewSet)

urlpatterns = [
    path('products/upload/', upload_products, name='upload-products'),
    path('orders/extract/', extract_orders, name='extract-orders'),
    path('orders/upload/', upload_orders, name='upload-orders'),
    path('stocks/upload/', upload_stock, name='upload-stock'),
    path('monthly-sales/upload/', upload_monthly_sales, name='upload-monthly-sales'),
    path('dashboard/metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('', include(router.urls)),
]

