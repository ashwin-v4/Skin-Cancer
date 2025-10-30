from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, ImageUpload, Escalation

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
    user = UserSerializer(read_only=True)

    class Meta:
        model = ImageUpload
        fields = ['id', 'user', 'image', 'metadata', 'uploaded_at']


class EscalationSerializer(serializers.ModelSerializer):
    patient_username = serializers.CharField(source='patient.username', read_only=True)

    class Meta:
        model = Escalation
        fields = ['id', 'patient', 'patient_username', 'image', 'reason', 'status', 'submitted_at']
        read_only_fields = ['patient', 'status', 'submitted_at']