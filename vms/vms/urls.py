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
    path("add_user", views.add_user, name="add_user"),
    path("update_user", views.update_user, name="update_user"),
    path("remove_user", views.remove_user, name="remove_user"),
    path("view_user", views.view_user, name="view_user"),    

]