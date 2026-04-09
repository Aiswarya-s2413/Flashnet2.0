from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductMasterViewSet, DistributorInvoiceViewSet, OrderViewSet, StockLevelViewSet, MonthlySalesViewSet, PrimarySalesViewSet, upload_products, extract_orders, upload_orders, upload_stock, upload_monthly_sales, upload_primary_sales, dashboard_metrics, primary_vs_secondary_analytics

router = DefaultRouter()
router.register(r'products', ProductMasterViewSet)
router.register(r'invoices', DistributorInvoiceViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'stocks', StockLevelViewSet)
router.register(r'monthly-sales', MonthlySalesViewSet)
router.register(r'primary-sales', PrimarySalesViewSet)

urlpatterns = [
    path('products/upload/', upload_products, name='upload-products'),
    path('orders/extract/', extract_orders, name='extract-orders'),
    path('orders/upload/', upload_orders, name='upload-orders'),
    path('stocks/upload/', upload_stock, name='upload-stock'),
    path('monthly-sales/upload/', upload_monthly_sales, name='upload-monthly-sales'),
    path('primary-sales/upload/', upload_primary_sales, name='upload-primary-sales'),
    path('dashboard/metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('dashboard/analytics-ps-ss/', primary_vs_secondary_analytics, name='dashboard-analytics'),
    path('', include(router.urls)),
]
