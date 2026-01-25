# FILE: project_config/urls.py (or whatever your main folder is)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This points to the file above. 
    # It says: "Any URL starting with api/ goes to rest_api/urls.py"
    path('api/', include('rest_api.urls')), 
]

# Media serving belongs ONLY here
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)