from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'volunteers',views.VolunteerViewSet)
router.register(r'skills',views.SkillViewSet)
router.register(r'recognitions',views.RecognitionViewSet)
router.register(r'languages',views.LanguageViewSet)
router.register(r'preferences',views.PreferenceViewSet)
router.register(r'availability', views.VolunteerAvailabilityViewSet)
router.register(r'schedules', views.VolunteerScheduleViewSet)
router.register(r'absences', views.VolunteerAbsenceViewSet)
router.register(r'visits', views.VisitViewSet)
# Route for AI matching feature
router.register(r'matchingbeta', views.MatchingBetaViewSet, 'matchingbeta')


urlpatterns = [
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path('password-reset-request/', views.password_reset_request, name='password_reset_request'),
    path('confirm-password-reset/', views.confirm_password_reset, name='confirm_password_reset'),
]
