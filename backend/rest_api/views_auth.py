from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

User = get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    users = User.objects.filter(email=email)

    if not users.exists():
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_obj = users.first()

    user = authenticate(request, username=user_obj.username, password=password)

    if user is not None:
        login(request, user)
        return Response({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        })

    return Response(
        {"error": "Invalid credentials"},
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"})

@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    return Response({"message": "CSRF cookie set"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        }
    })