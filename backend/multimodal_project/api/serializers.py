from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, ImageUpload, Escalation
import json


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'user', 'content', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'comment', 'created_at']

class ImageUploadSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ImageUpload
        fields = ['id', 'image', 'image_url', 'image_name', 'metadata', 'uploaded_at', 'username']
        read_only_fields = ['id', 'uploaded_at', 'image_url', 'image_name', 'username']
    
    def get_image_url(self, obj):
        """Return full URL of the image"""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
    
    def get_image_name(self, obj):
        """Return just the filename"""
        return obj.image_name
    
    def validate_metadata(self, value):
        """Validate and parse metadata"""
        if not value:
            return "{}"
        
        if isinstance(value, dict):
            return json.dumps(value)
        
        if isinstance(value, str):
            try:
                # Validate it's proper JSON
                json.loads(value)
                return value
            except json.JSONDecodeError:
                # If not JSON, wrap it
                return json.dumps({"notes": value})
        
        return "{}"

class EscalationSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source='patient.username', read_only=True)

    class Meta:
        model = Escalation
        fields = ['id', 'patient', 'patient_username', 'image', 'reason', 'contact_number', 'status', 'submitted_at']
        read_only_fields = ['patient', 'status', 'submitted_at']


class EscalationDetailSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    image = ImageUploadSerializer(read_only=True)

    class Meta:
        model = Escalation
        fields = [
            'id',
            'patient',
            'image',
            'reason',
            'contact_number',
            'status',
            'submitted_at'
        ]



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

