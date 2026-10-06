from django.contrib import admin
from .models import Opportunity, OpportunityShift, OpportunitySignup

class OpportunitySignupInline(admin.TabularInline):
    model = OpportunitySignup
    extra = 0
    raw_id_fields = ('volunteer', 'ended_by', 'visit')

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'recurrence', 'status')
    list_filter = ('status', 'recurrence')

@admin.register(OpportunityShift)
class OpportunityShiftAdmin(admin.ModelAdmin):
    list_display = ('opportunity', 'shift_date', 'start_time', 'end_time', 'is_cancelled')
    list_filter = ('is_cancelled', 'shift_date')
    inlines = [OpportunitySignupInline]
    
@admin.register(OpportunitySignup)
class OpportunitySignupAdmin(admin.ModelAdmin):
    list_display = ('shift', 'volunteer', 'status', 'accepted_at')
    list_filter = ('status',)
    raw_id_fields = ('shift', 'volunteer', 'visit', 'ended_by')
