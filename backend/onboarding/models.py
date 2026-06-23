from django.db import models
from users.models import DistributorUser

class OnboardingRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sales_approved', 'Sales Approved'),
        ('csd_approved', 'CSD Approved'),
        ('approved', 'Fully Approved'),
        ('rejected', 'Rejected'),
        ('clarification', 'Clarification Requested'),
    ]
    user = models.OneToOneField(DistributorUser, on_delete=models.CASCADE)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    distributor_code = models.CharField(max_length=100, blank=True)
    legal_entity = models.CharField(max_length=200, blank=True)
    territory = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request {self.id}: {self.user.upn} -> {self.status}"

class ApprovalLog(models.Model):
    onboarding_request = models.ForeignKey(OnboardingRequest, on_delete=models.CASCADE, related_name='logs')
    approver_role = models.CharField(max_length=50)  # 'sales', 'csd', 'it_admin'
    approver_upn = models.CharField(max_length=200)
    action = models.CharField(max_length=30)  # 'approved', 'rejected', 'clarification'
    comment = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.approver_role} {self.action} on {self.onboarding_request.id} by {self.approver_upn}"
