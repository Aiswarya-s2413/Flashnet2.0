from rest_framework.views import APIView
from rest_framework.response import Response
from auth_flow.utils import validate_entra_token
from users.models import DistributorUser, NotificationEmail
from onboarding.models import OnboardingRequest
import secrets
import threading  # Temporarily mock Celery

def send_otp_mock(email, token):
    print(f"\n[MOCK EMAIL] To: {email} | Your OTP is: {token}\n")

class RegisterEmailView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get('id_token')
        emails = request.data.get('emails', [])
        
        if not token or not emails:
            return Response({'status': 'error', 'message': 'Missing token or emails'}, status=400)
            
        claims = validate_entra_token(token)
        if not claims:
            return Response({'status': 'error', 'message': 'Invalid token signature'}, status=401)
            
        # Domain validation
        blocked = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com']
        for email in emails:
            domain = email.split('@')[-1].lower()
            if domain in blocked:
                return Response({'status': 'error', 'message': f"Domain '{domain}' is not allowed for corporate registration. Use your company email."}, status=400)
                
        # Create User natively
        user, created = DistributorUser.objects.get_or_create(
            entra_object_id=claims['oid'],
            defaults={
                'upn': claims['upn'],
                'display_name': claims['name'],
                'is_active': False,
                'is_onboarded': False
            }
        )
        
        # Ensure request tracking
        OnboardingRequest.objects.get_or_create(
            user=user,
            defaults={'status': 'pending'}
        )
        
        # Send OTP
        for email in emails:
            otp = secrets.token_urlsafe(8)[:6].upper() # 6 char OTP
            NotificationEmail.objects.create(
                user=user, 
                email=email, 
                verification_token=otp
            )
            # In a real setup we run Celery: send_otp_email.delay(email, otp)
            threading.Thread(target=send_otp_mock, args=(email, otp)).start()
            
        return Response({'status': 'success', 'message': 'OTP sent securely to provided business emails.'}, status=200)

class VerifyEmailView(APIView):
    permission_classes = []
    
    def post(self, request):
        token = request.data.get('id_token')
        otp = request.data.get('otp')
        
        if not token or not otp:
            return Response({'status': 'error', 'message': 'Missing token or OTP'}, status=400)
            
        claims = validate_entra_token(token)
        if not claims:
            return Response({'status': 'error', 'message': 'Invalid token signature'}, status=401)
            
        try:
            user = DistributorUser.objects.get(entra_object_id=claims['oid'])
            email_record = NotificationEmail.objects.get(user=user, verification_token=otp, is_verified=False)
            
            email_record.is_verified = True
            email_record.verification_token = ''
            email_record.save()
            return Response({'status': 'success', 'message': 'Email natively verified.'}, status=200)
            
        except (DistributorUser.DoesNotExist, NotificationEmail.DoesNotExist):
            return Response({'status': 'error', 'message': 'Invalid OTP or User context.'}, status=400)

class OnboardingStatusView(APIView):
    permission_classes = []
    
    def post(self, request):
        # We use POST to securely pass the id_token since they don't have a JWT
        token = request.data.get('id_token')
        claims = validate_entra_token(token)
        if not claims:
            return Response({'status': 'error', 'message': 'Invalid token signature'}, status=401)
            
        try:
            user = DistributorUser.objects.get(entra_object_id=claims['oid'])
            onboarding = OnboardingRequest.objects.get(user=user)
            return Response({'status': 'success', 'data': {'status': onboarding.status}}, status=200)
        except (DistributorUser.DoesNotExist, OnboardingRequest.DoesNotExist):
            return Response({'status': 'error', 'message': 'No onboarding state found.'}, status=404)

def trigger_post_approval_email(request_obj):
    # Fetch verified emails of the user
    emails = request_obj.user.notification_emails.filter(is_verified=True).values_list('email', flat=True)
    emails_list = list(emails)
    if not emails_list:
        # Fallback to UPN if no verified notification emails exist
        emails_list = [request_obj.user.upn]
    
    subject = "FlashNet 2.0 Distributor Portal Access Activated"
    body = f"""
Dear {request_obj.user.display_name},

We are pleased to inform you that your distributor account on FlashNet 2.0 has been fully approved and activated.

Account Details:
- UPN / Login User: {request_obj.user.upn}
- Assigned Distributor Code: {request_obj.distributor_code}
- Legal Entity: {request_obj.legal_entity}
- Territory: {request_obj.territory}

Login Instructions:
1. Go to the Portal URL: https://flashnet.archroma.com
2. Click 'Sign in with Microsoft'
3. Use your corporate Microsoft credentials (MFA will be enforced by Entra ID)

Support Contact:
For any assistance, please contact: portal-support@archroma.com

[ATTACHED FILE]: distributor_training_manual.pdf
"""
    # Print to console logs
    print("\n" + "="*80)
    print(f"[MOCK SMTP EMAIL SENT]")
    print(f"To: {', '.join(emails_list)}")
    print(f"Subject: {subject}")
    print(body)
    print("="*80 + "\n")

from onboarding.models import ApprovalLog

class ListRequestsView(APIView):
    permission_classes = []
    
    def get(self, request):
        requests = OnboardingRequest.objects.all().order_by('-created_at')
        data = []
        for r in requests:
            logs = [{
                'approver_role': l.approver_role,
                'approver_upn': l.approver_upn,
                'action': l.action,
                'comment': l.comment,
                'timestamp': str(l.timestamp)
            } for l in r.logs.all().order_by('timestamp')]
            
            emails = list(r.user.notification_emails.filter(is_verified=True).values_list('email', flat=True))
            
            data.append({
                'id': r.id,
                'user': {
                    'upn': r.user.upn,
                    'display_name': r.user.display_name,
                    'entra_object_id': r.user.entra_object_id
                },
                'status': r.status,
                'distributor_code': r.distributor_code,
                'legal_entity': r.legal_entity,
                'territory': r.territory,
                'notes': r.notes,
                'verified_emails': emails,
                'logs': logs,
                'created_at': str(r.created_at)
            })
        return Response({'status': 'success', 'data': data})

class RequestActionView(APIView):
    permission_classes = []
    
    def post(self, request, pk):
        try:
            req_obj = OnboardingRequest.objects.get(pk=pk)
        except OnboardingRequest.DoesNotExist:
            return Response({'status': 'error', 'message': 'Onboarding request not found'}, status=404)
            
        action = request.data.get('action') # 'approve', 'reject', 'clarification'
        approver_role = request.data.get('approver_role') # 'sales', 'csd', 'it_admin'
        approver_upn = request.data.get('approver_upn', 'admin@archroma.com')
        comment = request.data.get('comment', '')
        
        distributor_code = request.data.get('distributor_code', req_obj.distributor_code)
        legal_entity = request.data.get('legal_entity', req_obj.legal_entity)
        territory = request.data.get('territory', req_obj.territory)
        
        if not action or not approver_role:
            return Response({'status': 'error', 'message': 'Missing action or approver_role'}, status=400)
            
        # Update distributor details if provided
        if distributor_code:
            req_obj.distributor_code = distributor_code
        if legal_entity:
            req_obj.legal_entity = legal_entity
        if territory:
            req_obj.territory = territory
            
        # Approval flow routing
        if action == 'approve':
            if approver_role == 'sales':
                req_obj.status = 'sales_approved'
            elif approver_role == 'csd':
                is_final = request.data.get('final_approval', False) or (request.data.get('final_approval') == 'true')
                if is_final:
                    req_obj.status = 'approved'
                else:
                    req_obj.status = 'csd_approved'
            elif approver_role == 'it_admin':
                req_obj.status = 'approved'
        elif action == 'reject':
            req_obj.status = 'rejected'
        elif action == 'clarification':
            req_obj.status = 'clarification'
        else:
            return Response({'status': 'error', 'message': f'Invalid action: {action}'}, status=400)
            
        req_obj.save()
        
        # Log approval log
        ApprovalLog.objects.create(
            onboarding_request=req_obj,
            approver_role=approver_role,
            approver_upn=approver_upn,
            action=action,
            comment=comment
        )
        
        # If final approved -> activate user and trigger email
        if req_obj.status == 'approved':
            user = req_obj.user
            user.is_active = True
            user.is_onboarded = True
            user.distributor_code = req_obj.distributor_code
            user.save()
            trigger_post_approval_email(req_obj)
            
        return Response({'status': 'success', 'message': f'Request updated to status {req_obj.status} successfully.'})
