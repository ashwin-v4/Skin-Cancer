from django.contrib import admin
from django.urls import path,include
from .views import *

urlpatterns = [
    path('chat/',chat),
    path('signup/',signup_view),
    path('login/',login_view),
    path('signout/',logout_view),
    path('post/', create_post),
    path('comment/', add_comment),
    path('upload/', upload_image, name='upload_image'),
    path('api/upload/', upload_image, name='upload_image_api'),
]
