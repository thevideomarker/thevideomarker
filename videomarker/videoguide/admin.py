from django.contrib import admin
from videoguide.models import Question, File, Track, Answers, TimeSet
# Register your models here.
admin.site.register(Question)
admin.site.register(File)
admin.site.register(Track)
admin.site.register(Answers)
admin.site.register(TimeSet)