import os
import sys
import django
import jwt
import datetime

# 1. Setup Django Environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from onboarding.models import OnboardingRequest, ApprovalLog
from users.models import NotificationEmail
from sales_app.models import Order, ProductMaster, MonthlySales
from rest_framework.test import APIClient

User = get_user_model()

def run_test_pipeline():
    print("="*80)
    print("STARTING DISTRIBUTOR PORTAL AUTHENTICATION & ONBOARDING INTEGRATION TEST")
    print("="*80)

    client = APIClient()
    
    # 2. Cleanup existing test data for clean state
    test_upn = "test_distributor@archroma.com"
    test_oid = "entra-oid-9999-mock"
    User.objects.filter(upn=test_upn).delete()
    Order.objects.filter(sold_to__in=['DIST_MOCK', 'DIST_OTHER']).delete()
    
    print("\n[Step 1] Seed mock product master for orders")
    ProductMaster.objects.update_or_create(
        material_code="MAT_001",
        defaults={"material_name": "TEST CHEMICAL COMPOUND A"}
    )
    print("Product seeded successfully.")

    # 3. Generate Mock Entra ID Token
    print("\n[Step 2] Generate mock Microsoft Entra ID Token")
    payload = {
        'oid': test_oid,
        'upn': test_upn,
        'name': 'Archroma Mock Distributor Ltd',
        'groups': ['DistributorGroup'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    # Encode with any dummy secret key since local dev decodes with verify_signature = False
    mock_token = jwt.encode(payload, 'secret', algorithm='HS256')
    print("Mock ID Token generated.")

    # 4. Trigger First-Time Login Callback
    print("\n[Step 3] Call entra-callback endpoint (Simulated first login)")
    response = client.post('/api/auth/entra-callback/', {'id_token': mock_token}, format='json')
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    assert response.json()['status'] == 'onboarding_required', "Should require onboarding"

    # 5. Register Business Email
    print("\n[Step 4] Call register-email endpoint (Onboarding Step 1)")
    email_payload = {
        'id_token': mock_token,
        'emails': ['contact@mockdistributor.com', 'billing@mockdistributor.com']
    }
    response = client.post('/api/onboarding/register-email/', email_payload, format='json')
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    assert response.json()['status'] == 'success', "Registration email mapping failed"

    # 6. Retrieve Generated OTP from Database
    user_obj = User.objects.get(entra_object_id=test_oid)
    email_record = NotificationEmail.objects.filter(user=user_obj, is_verified=False).first()
    otp_code = email_record.verification_token
    print(f"Retrieved verification OTP from database: {otp_code}")

    # 7. Verify OTP
    print("\n[Step 5] Call verify-email endpoint (Onboarding Step 2)")
    verify_payload = {
        'id_token': mock_token,
        'otp': otp_code
    }
    response = client.post('/api/onboarding/verify-email/', verify_payload, format='json')
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    assert response.json()['status'] == 'success', "Email verification failed"

    # 8. Check Onboarding Status
    print("\n[Step 6] Verify onboarding status is Pending Approval")
    status_payload = {'id_token': mock_token}
    response = client.post('/api/onboarding/status/', status_payload, format='json')
    print(f"Status: {response.json()['data']['status']}")
    assert response.json()['data']['status'] == 'pending'

    # Retrieve onboarding request ID
    onboarding_req = OnboardingRequest.objects.get(user=user_obj)
    req_id = onboarding_req.id

    # 9. Perform Onboarding Approvals (Sales -> CSD -> IT Admin)
    print("\n[Step 7] Perform multi-level approvals")
    
    # Sales Executive Approval
    print("-> Submitting Sales Executive approval...")
    sales_payload = {
        'action': 'approve',
        'approver_role': 'sales',
        'approver_upn': 'sales_manager@archroma.com',
        'comment': 'Sales validation completed. distributor profiles align.',
        'distributor_code': 'DIST_MOCK',
        'legal_entity': 'Mock Distributor Corp Ltd',
        'territory': 'Western Region'
    }
    response = client.post(f'/api/onboarding/requests/{req_id}/action/', sales_payload, format='json')
    print(f"Sales Approval Response: {response.json()}")
    
    # Verify status
    onboarding_req.refresh_from_db()
    print(f"Current Status: {onboarding_req.status}")
    assert onboarding_req.status == 'sales_approved'

    # CSD Approval
    print("-> Submitting CSD approval (routing to IT Admin)...")
    csd_payload = {
        'action': 'approve',
        'approver_role': 'csd',
        'approver_upn': 'csd_officer@archroma.com',
        'comment': 'Legal entity details verified. Proceeding to IT configuration.',
        'final_approval': False
    }
    response = client.post(f'/api/onboarding/requests/{req_id}/action/', csd_payload, format='json')
    print(f"CSD Approval Response: {response.json()}")
    
    # Verify status
    onboarding_req.refresh_from_db()
    print(f"Current Status: {onboarding_req.status}")
    assert onboarding_req.status == 'csd_approved'

    # IT Admin Approval (Final Approval & Activation)
    print("-> Submitting IT Admin final approval & account activation...")
    it_payload = {
        'action': 'approve',
        'approver_role': 'it_admin',
        'approver_upn': 'it_admin@archroma.com',
        'comment': 'Distributor AD profile configured. Authentication active.'
    }
    response = client.post(f'/api/onboarding/requests/{req_id}/action/', it_payload, format='json')
    print(f"IT Admin Approval Response: {response.json()}")
    
    # Verify status and activation
    onboarding_req.refresh_from_db()
    user_obj.refresh_from_db()
    print(f"Final Request Status: {onboarding_req.status}")
    print(f"User is_active: {user_obj.is_active}")
    print(f"User distributor_code: {user_obj.distributor_code}")
    assert onboarding_req.status == 'approved'
    assert user_obj.is_active is True
    assert user_obj.distributor_code == 'DIST_MOCK'

    # 10. Login again (Authenticated)
    print("\n[Step 8] Call entra-callback endpoint after activation (Success Auth)")
    response = client.post('/api/auth/entra-callback/', {'id_token': mock_token}, format='json')
    print(f"Status Code: {response.status_code}")
    auth_data = response.json()
    print(f"Response Body: {auth_data}")
    assert auth_data['status'] == 'authenticated'
    
    jwt_access_token = auth_data['data']['access']
    print("Obtained JWT Access Token successfully.")

    # 11. Test Row-Level Access Control (RLAC) on Orders
    print("\n[Step 9] Test Row-Level Access Control (RLAC) on /api/orders/")
    
    # Seed orders: one for DIST_MOCK, one for DIST_OTHER
    Order.objects.create(
        sold_to="DIST_MOCK",
        ship_to="DIST_MOCK",
        material_code="MAT_001",
        material_name="TEST CHEMICAL COMPOUND A",
        packsize="25 KG",
        qty=100,
        invoice_no="INV-999-MOCK",
        value=50000.0
    )
    Order.objects.create(
        sold_to="DIST_OTHER",
        ship_to="DIST_OTHER",
        material_code="MAT_001",
        material_name="TEST CHEMICAL COMPOUND A",
        packsize="25 KG",
        qty=200,
        invoice_no="INV-999-OTHER",
        value=120000.0
    )
    print("Seeded test orders: 1 for 'DIST_MOCK' and 1 for 'DIST_OTHER'.")

    # Call /api/orders/ without JWT (unauthenticated) -> Should return all orders since DRF defaults to AllowAny if no auth is enforced, or we can check behavior
    client.credentials() # Clear headers
    response = client.get('/api/orders/')
    print(f"Unauthenticated request returns {len(response.json())} orders.")

    # Call /api/orders/ WITH JWT (authenticated as distributor DIST_MOCK)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {jwt_access_token}')
    response = client.get('/api/orders/')
    orders = response.json()
    print(f"Authenticated request returns {len(orders)} orders.")
    print("Returned Orders:")
    for o in orders:
        print(f"  - Invoice No: {o['invoice_no']} | Sold To: {o['sold_to']}")
        assert o['sold_to'] == 'DIST_MOCK', "Should only return orders belonging to DIST_MOCK"

    # 12. Test RLAC on Dashboard Metrics
    print("\n[Step 10] Test Row-Level Access Control (RLAC) on Dashboard Metrics")
    
    # Seed monthly sales for DIST_MOCK and DIST_OTHER
    MonthlySales.objects.filter(distributor_name__in=['DIST_MOCK', 'DIST_OTHER']).delete()
    MonthlySales.objects.create(
        distributor_name="DIST_MOCK",
        ship_to_code="DIST_MOCK",
        customer_name="Customer A",
        product_code="MAT_001",
        product_name="TEST CHEMICAL COMPOUND A",
        total_volume=500.0,
        total_value=250000.0,
        volumes={"2026-06": 500},
        values={"2026-06": 250000}
    )
    MonthlySales.objects.create(
        distributor_name="DIST_OTHER",
        ship_to_code="DIST_OTHER",
        customer_name="Customer B",
        product_code="MAT_001",
        product_name="TEST CHEMICAL COMPOUND A",
        total_volume=1000.0,
        total_value=500000.0,
        volumes={"2026-06": 1000},
        values={"2026-06": 500000}
    )
    
    # Call dashboard metrics with JWT
    response = client.get('/api/dashboard/metrics/')
    metrics = response.json()
    print(f"Authenticated metrics top products: {metrics['top_products']}")
    # The monthly progression volume should only sum DIST_MOCK (500), not include DIST_OTHER (1000)
    monthly_volume = metrics['monthly_progression'][0]['volume']
    print(f"Authenticated monthly volume progression: {monthly_volume}")
    assert monthly_volume == 500.0, "Monthly progression should only reflect DIST_MOCK volume (500 kg)"

    # Clean up test user & data
    User.objects.filter(upn=test_upn).delete()
    Order.objects.filter(sold_to__in=['DIST_MOCK', 'DIST_OTHER']).delete()
    MonthlySales.objects.filter(distributor_name__in=['DIST_MOCK', 'DIST_OTHER']).delete()
    print("\nCleanup completed.")
    print("="*80)
    print("INTEGRATION TEST PASSED SUCCESSFULLY!")
    print("="*80)

if __name__ == '__main__':
    run_test_pipeline()
