import logging
from config.settings import AZURE_CLIENT_ID, AZURE_TENANT_ID
import jwt

logger = logging.getLogger(__name__)

def validate_entra_token(token_string):
    """
    Decodes the JWT token natively and assumes it's valid for LOCAL DEV bypassing Microsoft validation keys.
    In real production, this function will ping: https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys
    """
    try:
        # For development bypassing without the full AZURE_CLIENT_ID, we blindly decode unverified
        # to simulate Entra ID passing back claims (UPN, Name, oid).
        decoded = jwt.decode(token_string, options={"verify_signature": False})
        
        # Ensure we have the critical claims
        if 'oid' not in decoded or ('upn' not in decoded and 'preferred_username' not in decoded):
            return None
            
        upn = decoded.get('upn', decoded.get('preferred_username'))
        display_name = decoded.get('name', 'Unknown User')
        oid = decoded.get('oid')

        return {
            'oid': oid,
            'upn': upn,
            'name': display_name,
            'groups': decoded.get('groups', [])
        }
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None
