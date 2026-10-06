from rest_framework import permissions

class IsCoordinatorOrAdmin(permissions.BasePermission):
    """
    Allows access only to coordinators and admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['COORD', 'ADMIN']
        )
