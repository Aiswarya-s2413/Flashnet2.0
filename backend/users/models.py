from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class DistributorUserManager(BaseUserManager):
    def create_user(self, upn, entra_object_id, display_name, **extra_fields):
        if not upn:
            raise ValueError('The UPN must be set')
        user = self.model(
            upn=self.normalize_email(upn),
            entra_object_id=entra_object_id,
            display_name=display_name,
            **extra_fields
        )
        # Authentication is purely via Microsoft Entra ID; we don't set local passwords.
        user.set_unusable_password()
        user.save(using=self._db)
        return user

class DistributorUser(AbstractBaseUser):
    entra_object_id = models.CharField(max_length=200, unique=True)
    upn = models.EmailField(unique=True)
    display_name = models.CharField(max_length=200)
    distributor_code = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # New SAP Attribute Fields
    partner_function = models.CharField(max_length=50, blank=True, default='')
    division = models.CharField(max_length=50, blank=True, default='')
    sub_code = models.CharField(max_length=100, blank=True, default='')
    transporter_code = models.CharField(max_length=100, blank=True, default='')
    price_type = models.CharField(max_length=50, blank=True, default='')
    city = models.CharField(max_length=200, blank=True, default='')
    region_code = models.CharField(max_length=50, blank=True, default='')
    trade_code = models.CharField(max_length=100, blank=True, default='')
    trade_code2 = models.CharField(max_length=100, blank=True, default='')
    
    ORGANISATION_CHOICES = [
        ('inx1', 'inx1'),
        ('inx2', 'inx2'),
    ]
    organisation = models.CharField(max_length=10, choices=ORGANISATION_CHOICES, blank=True, null=True)

    objects = DistributorUserManager()

    USERNAME_FIELD = 'upn'
    REQUIRED_FIELDS = ['entra_object_id', 'display_name']

    def __str__(self):
        return f"{self.display_name} ({self.upn})"

class NotificationEmail(models.Model):
    user = models.ForeignKey(DistributorUser, on_delete=models.CASCADE, related_name='notification_emails')
    email = models.EmailField()
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {'Verified' if self.is_verified else 'Pending'} ({self.user.upn})"
