from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_api.serializers.core import (
    UserSerializer,
    MeSerializer,
    UpdateMeSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)
from rest_api.models.core import UserProfile

User = get_user_model()


# ── Auth ──────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    identity = request.data.get("email")
    password = request.data.get("password")

    if not identity or not password:
        return Response(
            {"error": "Identity and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user_query = User.objects.filter(
        Q(email__iexact=identity) | Q(username__iexact=identity)
    )

    if not user_query.exists():
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

    user_obj = user_query.first()
    user = authenticate(request, username=user_obj.username, password=password)

    if user is not None:
        remember = request.data.get("remember_me", False)

        refresh = RefreshToken.for_user(user)

        if remember:
            # long session
            refresh.set_exp(lifetime=timedelta(days=30))
            refresh.access_token.set_exp(lifetime=timedelta(days=1))
        else:
            # short session
            refresh.set_exp(lifetime=timedelta(hours=2))
            refresh.access_token.set_exp(lifetime=timedelta(minutes=15))

        UserProfile.objects.get_or_create(user=user)

        return Response({
            "refresh": str(refresh),
            "access":  str(refresh.access_token),
            "user":    MeSerializer(user).data,
        })

    return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


# ── /api/me/ ──────────────────────────────────────────────────────────────────

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if request.method == "GET":
        UserProfile.objects.get_or_create(user=user)
        return Response({"user": MeSerializer(user).data})

    serializer = UpdateMeSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"user": MeSerializer(user).data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def me_profile_view(request):
    """PATCH /api/me/profile/"""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"user": MeSerializer(request.user).data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def me_change_password_view(request):
    """POST /api/me/change-password/"""
    serializer = ChangePasswordSerializer(
        data=request.data, context={'request': request}
    )
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({"detail": "Password updated successfully."})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def me_delete_view(request):
    """DELETE /api/me/delete/"""
    request.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Admin: users list / detail ────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def users_list_view(request):
    if request.method == 'GET':
        serializer = UserSerializer(User.objects.all(), many=True)
        return Response(serializer.data)

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
        return Response(UserSerializer(user).data)

    if request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)