from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from auth_flow.utils import validate_entra_token
from users.models import DistributorUser
from onboarding.models import OnboardingRequest

class EntraCallbackView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'status': 'error', 'message': 'Missing id_token'}, status=400)
            
        claims = validate_entra_token(token)
        if not claims:
            return Response({'status': 'error', 'message': 'Invalid token signature or missing claims'}, status=401)
            
        oid = claims['oid']
        upn = claims['upn']
        display_name = claims['name']
        
        try:
            user = DistributorUser.objects.get(entra_object_id=oid)
        except DistributorUser.DoesNotExist:
            return Response({
                'status': 'onboarding_required',
                'data': {'oid': oid, 'upn': upn, 'name': display_name},
                'message': 'User not found. Onboarding required.'
            }, status=200)
            
        if not user.is_active:
            # Check if pending approval exists
            try:
                onboarding = OnboardingRequest.objects.get(user=user)
                return Response({
                    'status': 'pending_approval',
                    'data': {'status': onboarding.status},
                    'message': 'Account is pending administrator approval.'
                }, status=200)
            except OnboardingRequest.DoesNotExist:
                return Response({
                    'status': 'onboarding_required',
                    'data': {'oid': oid, 'upn': upn, 'name': display_name},
                    'message': 'Account inactive and no onboarding request found.'
                }, status=200)
                
        # User is active and onboarded -> Generate generic JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'status': 'authenticated',
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'upn': user.upn,
                'name': user.display_name,
                'distributor_code': user.distributor_code
            },
            'message': 'Login successful'
        }, status=200)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'status': 'success',
            'data': {
                'upn': user.upn,
                'name': user.display_name,
                'distributor_code': user.distributor_code,
                'is_active': user.is_active
            },
            'message': 'Profile retrieved'
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'status': 'success', 'message': 'Logged out successfully'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)
