from django.conf.urls import include, url
from django.contrib import admin

from django.conf import settings
admin.autodiscover()
urlpatterns = [
     url(r'^$', 'videoguide.views.home', name='home'),
    url(r'^test/', 'videoguide.views.testView', name='test'),
    # url(r'^$', 'openshift.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^uploadform/', 'videoguide.views.uploadFileForm'),
    url(r'^registeruser/', 'videoguide.views.userRegister'),
    url(r'^loginuser/', 'videoguide.views.userLogin'),
    url(r'^logout/', 'videoguide.views.userLogout'),
    url(r'^watchvideo/', 'videoguide.views.watchVideo'),
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT,}),
    url(r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT,}),
]
