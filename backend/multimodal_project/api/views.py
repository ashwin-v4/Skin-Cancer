import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from .models import Post, ImageUpload
from .serializers import EscalationDetailSerializer, PostSerializer, CommentSerializer, ImageUploadSerializer,UserSerializer
from .gemini_api import get_gemini_response
from rest_framework.permissions import IsAuthenticated
from .models import Escalation
from .serializers import EscalationSerializer
from .serializers import PostSerializer, CommentSerializer
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email")
    phone = request.data.get("phone_number")
    role = request.data.get("role", "patient")

    if not username or not password or not email:
        return Response({"error": "Username, email, and password are required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "User already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)

    if hasattr(user, "profile"):
        user.profile.role = role
        user.profile.phone_number = phone
        user.profile.email = email
        user.profile.save()
    else:
        from .models import Profile
        Profile.objects.create(user=user, role=role, phone_number=phone, email=email)

    return Response({
        "message": "User created successfully",
        "username": user.username,
        "email": user.email,
        "phone_number": phone,
        "role": role
    }, status=201)



@api_view(['GET'])
def hello(request):
    return Response({"message": "Hello, world!"})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    print("in login")
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        refresh = RefreshToken.for_user(user)
        role = user.profile.role
        print(role)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": role,
            "username": user.username,
            "message": "Login successful"
        })
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
@permission_classes([IsAuthenticated])
def upload_image(request):
    import requests
    import json
    from django.conf import settings

    try:
        logger.info(f"Upload request from user: {request.user.username}")

        serializer = ImageUploadSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=400)

        # Save uploaded image
        instance = serializer.save(user=request.user)
        logger.info(f"Upload successful: {instance.image.name}")

        image_path = instance.image.path
        logger.info(f"Local image path: {image_path}")

        # Parse metadata
        metadata_raw = request.data.get("metadata")
        try:
            metadata = json.loads(metadata_raw) if isinstance(metadata_raw, str) else metadata_raw
        except Exception:
            logger.warning("Invalid metadata format; using empty dict.")
            metadata = {}

        # Store metadata if applicable
        if hasattr(instance, "metadata"):
            instance.metadata = metadata
            instance.save(update_fields=["metadata"])

        # Send image + metadata to model API
        try:
            with open(image_path, "rb") as f:
                response = requests.post(
                    "http://127.0.0.1:8080/predict",
                    files={"image": f},
                    data={"metadata": json.dumps(metadata)},
                    timeout=60
                )
            response_data = response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            logger.error(f"Prediction API call failed: {e}")
            response_data = {"error": f"Prediction API call failed: {str(e)}"}

        # Try to get simplified explanation via Gemini
        try:
            prompt = (
                f"Explain this in very simple terms for a layperson in just one line and dont address as computer or system just start with 'The Results indicate that': {response_data}"
            )
            xai_response = get_gemini_response(prompt)
        except Exception as e:
            logger.error(f"Gemini explanation failed: {e}")
            xai_response = ""

        return Response({
            "message": "Image uploaded successfully",
            "image": serializer.data,
            "metadata": metadata,
            "prediction": response_data,
            "xai": xai_response or ""
        }, status=201)

    except Exception as e:
        logger.error(f"Upload exception: {str(e)}")
        return Response({
            "error": "Upload failed",
            "detail": str(e)
        }, status=500)


    except Exception as e:
        logger.error(f"Upload exception: {str(e)}")
        return Response({
            "error": "Upload failed",
            "detail": str(e)
        }, status=500)



@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chat(request):
    val = request.data.get("message", "")
    response = get_gemini_response(
        f"You are a chatbot. you dont show the user that you are a chatbot. Try to keep the convo crisp and minmized. If unrelated to medicine, respond generically. Else, give a medical response: {val}"
    )
    return Response({"message": response})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def escalate_image(request):
    image_id = request.data.get("image_id")
    reason = request.data.get("reason")

    try:
        image = ImageUpload.objects.get(id=image_id, user=request.user)
    except ImageUpload.DoesNotExist:
        return Response({"error": "Image not found or unauthorized."}, status=404)

    if not reason:
        try:
            metadata = json.loads(image.metadata)
            reason = metadata.get("notes", "No notes provided")
        except Exception:
            reason = "No notes provided"

    escalation = Escalation.objects.create(
        patient=request.user,
        image=image,
        reason=reason,
        status="pending"
    )

    return Response({
        "message": "Escalation created successfully.",
        "id": escalation.id,
        "reason": escalation.reason,
    }, status=201)



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
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


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


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.profile.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.profile.role
        data['username'] = self.user.username
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_escalations(request):
    """
    Get all escalations with patient, image, reason, contact number, and status.
    """
    escalations = Escalation.objects.select_related('patient', 'image').order_by('-submitted_at')
    serializer = EscalationDetailSerializer(escalations, many=True, context={'request': request})
    return Response(serializer.data, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_escalation_detail(request, escalation_id):
    """
    Get details of a specific escalation.
    """
    try:
        escalation = Escalation.objects.select_related('patient', 'image').get(id=escalation_id)
    except Escalation.DoesNotExist:
        return Response({"error": "Escalation not found"}, status=404)

    serializer = EscalationDetailSerializer(escalation, context={'request': request})
    return Response(serializer.data, status=200)
