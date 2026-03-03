from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q # Add this import
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_api.serializers.core import UserSerializer

User = get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    # 'email' now acts as a general 'identity' identifier
    identity = request.data.get("email") 
    password = request.data.get("password")

    if not identity or not password:
        return Response(
            {"error": "Identity and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Filter by either username OR email, case-insensitively
    user_query = User.objects.filter(
        Q(email__iexact=identity) | Q(username__iexact=identity)
    )

    if not user_query.exists():
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_obj = user_query.first()

    # Pass the exact username found in the DB to the authenticate function
    user = authenticate(request, username=user_obj.username, password=password)

    if user is not None:
        login(request, user)
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,       # Add this
                "is_superuser": user.is_superuser # Add this
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
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser
        }
    })

@api_view(['GET', 'POST']) # <--- Add 'POST' here
@permission_classes([IsAuthenticated])
def users_list_view(request):
    if request.method == 'GET':
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_detail_view(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)