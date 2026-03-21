from django.urls import path

from . import views

urlpatterns = [
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("add_volunteer", views.add_volunteer, name="add_volunteer"),
    path("update_volunteer", views.update_volunteer, name="update_volunteer"),
    path("remove_volunteer", views.remove_volunteer, name="remove_volunteer"),
    path("view_volunteer", views.view_volunteer, name="view_volunteer"),
    path("view_volunteer_apt_by_date", views.view_volunteer_apt_by_date, name="add_volunteer_apt_by_date"),
    

]