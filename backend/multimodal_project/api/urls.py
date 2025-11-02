from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('chat/', views.chat),
    path('post/', views.create_post),
    path('comment/', views.add_comment),
    path('upload/', views.upload_image),
    path('escalate/', views.escalate_image),
    path('hello/', views.hello),
    path("posts/", views.list_posts),
    path("posts/<int:post_id>/", views.get_post_details),
]
