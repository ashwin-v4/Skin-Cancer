from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import os

def user_image_path(instance, filename):
    # Get file extension
    ext = filename.split('.')[-1]
    
    # Count existing images for this user to get next ID
    user_image_count = ImageUpload.objects.filter(user=instance.user).count()
    next_id = user_image_count + 1
    
    # Create filename: username_id.extension
    new_filename = f"{instance.user.username}_{next_id}.{ext}"
    
    # Return path: uploads/username/username_id.extension
    return os.path.join('uploads', instance.user.username, new_filename)



def image_upload_path(instance, filename):
    folder = 'images'
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, filename)

class ImageUpload(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=user_image_path)  # Custom path function
    metadata = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']  # Latest first
    
    def __str__(self):
        return f"{self.user.username} - Image {self.id} - {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def image_name(self):
        """Get just the filename without path"""
        return os.path.basename(self.image.name)
    

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post {self.id} by {self.user.username}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment {self.id} on Post {self.post.id} by {self.user.username}"

class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')

    def __str__(self):
        return f"{self.user.username} - {self.role}"
    

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()


class Escalation(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="escalations")
    image = models.ForeignKey(ImageUpload, on_delete=models.CASCADE, related_name="escalations")
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('closed', 'Closed')
    ], default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Escalation by {self.patient.username} for {self.image.image.name}"
