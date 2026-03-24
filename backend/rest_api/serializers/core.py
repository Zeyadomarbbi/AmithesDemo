from rest_framework import serializers
from django.contrib.auth.models import User

from ..models.core import *
from ..models.core import Timeframe
from ..models.reference import Currency, Country

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 
            'email', 'password', 'is_active', 'is_staff', 
            'is_superuser', 'date_joined'
        ]
        extra_kwargs = {
            'password':    {'write_only': True, 'required': False},
            'username':    {'required': True},
            'email':       {'required': True},
            'date_joined': {'read_only': True}
        }

    def validate_username(self, value):
        user_id = self.instance.id if self.instance else None
        if User.objects.filter(username__iexact=value).exclude(id=user_id).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        user_id = self.instance.id if self.instance else None
        if User.objects.filter(email__iexact=value).exclude(id=user_id).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    
class UserProfileSerializer(serializers.ModelSerializer):
    country_id   = serializers.IntegerField(source='country.country_id', read_only=True)
    country_name = serializers.CharField(source='country.country_name', read_only=True)
    country_iso2 = serializers.CharField(source='country.iso2_code', read_only=True)

    country = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(),
        allow_null=True,
        required=False,
        write_only=True,   # ← add this
    )

    class Meta:
        model = UserProfile
        fields = [
            'title',
            'birthday',
            'country',        # write-only — accepts PK on input
            'country_id',     # read-only — returns PK on output
            'country_name',   # read-only
            'country_iso2',   # read-only
            'timezone',
            'phone',
            'two_fa_enabled',
        ]
 
class MeSerializer(serializers.ModelSerializer):
    """Full read serializer — merges User + UserProfile."""
    profile = UserProfileSerializer(read_only=True)
 
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_staff',
            'is_superuser',
            'date_joined',
            'profile',
        ]
 
class UpdateMeSerializer(serializers.ModelSerializer):
    """PATCH /api/me/ — User fields only."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'username']
        extra_kwargs = {
            'email':    {'required': False},
            'username': {'required': False},
        }
 
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
 
    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value
 
 
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password     = serializers.CharField(required=True, min_length=8)
 
    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

class FundSerializer(serializers.ModelSerializer):
    # Explicitly map currency_id for the incoming payload
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(), 
        source='currency'
    )

    class Meta:
        model = Fund
        fields = [
            'fund_id',
            'legal_name',
            'short_name',
            'fund_strategy',
            'legal_form',
            'management_company',
            'formation_date',
            'phase_name',
            'currency_id',
            'created_at',
            'updated_at',
            'is_deleted',
        ]
        read_only_fields = ['fund_id', 'created_at', 'updated_at', 'is_deleted']

class TimeframeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timeframe
        fields = [
            "timeframe_id",
            "name",
            "date",
            "quarter",
            "year",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["fund", "timeframe_id", "quarter", "year", "created_at"]

class ShareClassSerializer(serializers.ModelSerializer):
    fund_id = serializers.IntegerField(source="fund.fund_id", read_only=True)

    # Accept uploaded file
    document_file = serializers.FileField(write_only=True, required=False)
    # Read-only URL for frontend
    document_url = serializers.SerializerMethodField()
    clear_document = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = ShareClass
        fields = [
            "share_class_id",
            "fund_id",
            "share_class_name",
            "isin_code",
            "nominal_value",
            "issuance_method",
            "distribution_method",
            "ppm_description",
            "document_link",    
            "document_file",    
            "document_url",     
            "document_name", 
            "document_mime_type", 
            "document_size", 
            "clear_document", # 2. Register field
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = ["share_class_id", "created_at", "updated_at", "created_by", "document_url"]

    def get_document_url(self, obj):
        if obj.document_link:
            request = self.context.get('request')
            if request:
                # Return absolute URL for frontend
                return request.build_absolute_uri(obj.document_link)
            return obj.document_link
        return None

    def create(self, validated_data):
        file_obj = validated_data.pop("document_file", None)
        if file_obj:
            # Save file to MEDIA_ROOT/share_class_docs/
            from django.core.files.storage import default_storage
            path = default_storage.save(f"share_class_docs/{file_obj.name}", file_obj)
            validated_data["document_link"] = default_storage.url(path)
            validated_data["document_name"] = file_obj.name
            validated_data["document_mime_type"] = file_obj.content_type  # Mime Type
            validated_data["document_size"] = file_obj.size
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # 3. Intercept clear flag
        clear_doc = validated_data.pop("clear_document", False)
        file_obj = validated_data.pop("document_file", None)
        
        if clear_doc:
            validated_data["document_link"] = None
            validated_data["document_name"] = None
            validated_data["document_mime_type"] = None
            validated_data["document_size"] = None
        elif file_obj:
            from django.core.files.storage import default_storage
            path = default_storage.save(f"share_class_docs/{file_obj.name}", file_obj)
            validated_data["document_link"] = default_storage.url(path)
            validated_data["document_name"] = file_obj.name
            validated_data["document_mime_type"] = getattr(file_obj, 'content_type', None)
            validated_data["document_size"] = file_obj.size
            
        return super().update(instance, validated_data)
    
class FundManFeeCommitmentYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundManFeeCommitmentYear
        fields = [
            'fund_id',
            'commitment_from',
            'commitment_from_year',
            'commitment_from_year_start',
            'commitment_from_year_end',
            'commitment_until',
            'commitment_until_year',
            'commitment_until_year_start',
            'commitment_until_year_end'
        ]