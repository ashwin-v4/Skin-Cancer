from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from .models import Post, Comment, ImageUpload
from .serializers import PostSerializer, CommentSerializer, ImageUploadSerializer
from .gemini_api import get_gemini_response
from rest_framework.permissions import IsAuthenticated
from .models import Escalation
from .serializers import EscalationSerializer
from django.db.models import Count
from .serializers import PostSerializer, CommentSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "User already exists"}, status=400)

    User.objects.create_user(username=username, password=password)
    return Response({"message": "User created successfully"}, status=201)
@api_view(['GET'])
def hello(request):
    return Response({"message": "Hello, world!"})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Login successful"})
    return Response({"error": "Invalid credentials"}, status=401)


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out successfully"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_comment(request):
    serializer = CommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def upload_image(request):
    serializer = ImageUploadSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chat(request):
    val = request.data.get("message", "")
    response = get_gemini_response(
        f"You are a chatbot. If unrelated to medicine, respond generically. Else, give a medical response: {val}"
    )
    return Response({"message": response})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def escalate_image(request):
    image_id = request.data.get("image_id")
    reason = request.data.get("reason", "Possible cancer detected. Needs review.")

    try:
        image = ImageUpload.objects.get(id=image_id, user=request.user)
    except ImageUpload.DoesNotExist:
        return Response({"error": "Image not found or unauthorized."}, status=404)

    escalation = Escalation.objects.create(
        patient=request.user,
        image=image,
        reason=reason
    )
    return Response(EscalationSerializer(escalation).data, status=201)

@api_view(['GET'])
def list_posts(request):
    posts = Post.objects.all().order_by('-created_at')
    data = []

    for post in posts:
        data.append({
            "id": post.id,
            "user": {"username": post.user.username},
            "content": post.content,
            "created_at": post.created_at,
            "comments_count": post.comments.count(),
        })
    return Response(data)


@api_view(['GET'])
def post_detail(request, pk):
    post = Post.objects.get(pk=pk)
    comments = post.comments.all().order_by('-created_at')
    data = {
        "id": post.id,
        "user": post.user.username,
        "content": post.content,
        "created_at": post.created_at,
        "comments": [
            {
                "id": c.id,
                "comment": c.comment,
                "created_at": c.created_at,
                "user": c.user.username
            } for c in comments
        ]
    }
    return Response(data)



@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_post_details(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    post_data = {
        "id": post.id,
        "user": post.user.username,
        "content": post.content,
        "created_at": post.created_at,
        "comments": CommentSerializer(post.comments.all().order_by('-created_at'), many=True).data,
    }
    return Response(post_data, status=200)
