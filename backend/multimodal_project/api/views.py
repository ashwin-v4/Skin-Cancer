import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import Post, Comment, User
from django.contrib.auth import authenticate,login,logout
from .gemini_api import get_gemini_response
from .forms import ImageUploadForm
from django.shortcuts import render, redirect

@csrf_exempt
def chat(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            val = data.get("message", "not provided")
            response = get_gemini_response("You are a chat bot and answer this questions if u feel like this is not related to medical or inappropriate please tell a generic reponsose to not answer and if not give apt medical repsonse.: "+val)
            return JsonResponse({"message": response})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)


@csrf_exempt
def signup_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            if not username or not password:
                return JsonResponse({"error": "Username and password required"}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "User already exists"}, status=400)

            User.objects.create_user(username=username, password=password)
            return JsonResponse({"message": "User created successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)


@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({"message": "Login successful"})
            else:
                return JsonResponse({"error": "Invalid credentials"}, status=401)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)


@csrf_exempt
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"message": "Logged out successfully"})
    return JsonResponse({"error": "Only POST allowed"}, status=405)

@csrf_exempt
@login_required
def create_post(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            content = data.get("content")
            if not content:
                return JsonResponse({"error": "Content is required"}, status=400)

            post = Post.objects.create(user=request.user, content=content)
            return JsonResponse({"message": "Post created", "post_id": post.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)


@csrf_exempt
@login_required
def add_comment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            post_id = data.get("post_id")
            comment_text = data.get("comment")

            if not post_id or not comment_text:
                return JsonResponse({"error": "post_id and comment required"}, status=400)

            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                return JsonResponse({"error": "Post not found"}, status=404)

            comment = Comment.objects.create(post=post, user=request.user, comment=comment_text)
            return JsonResponse({"message": "Comment added", "comment_id": comment.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)


@login_required
def upload_image(request):
    if request.method == 'POST':
        form = ImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            image_upload = form.save(commit=False)
            image_upload.user = request.user
            image_upload.save()
            return redirect('upload_success')
    else:
        form = ImageUploadForm()
    return render(request, 'upload_image.html', {'form': form})