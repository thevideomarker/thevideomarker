from django.db import models
from django.contrib.auth.models import User


def content_file_name(instance, filename):
	#print ('forming file name --> '&filename & instance.user.username)
	return '/'.join(['uploads', instance.user.username, filename])

# Create your models here.
class Question(models.Model):
	question_text=models.CharField(max_length=200)
	pub_date=models.DateTimeField('date published')
	
	def __str__(self):             
		# __unicode__ on Python 2
		return self.question_text
		
		
class File(models.Model):
	
	file_name=models.CharField(max_length=200)
	file_type=models.CharField(max_length=10)
	user = models.ForeignKey(User, related_name='owner')
	file=models.FileField(upload_to=content_file_name)
	#file=models.FileField(upload_to='uploads')
	
	def __str__(self):             
		# __unicode__ on Python 2
		return self.file_name

class Track(models.Model):
	
	track_name=models.CharField(max_length=200)	
	file = models.ForeignKey(File, related_name='track')	
	
	def __str__(self):             
		# __unicode__ on Python 2
		return self.track_name

class TimeSet(models.Model):
	
	start = models.CharField(max_length=10)
	end = models.CharField(max_length=10)
	track = models.ForeignKey(Track, related_name='time_set')
	
	def __str__(self):             
		# __unicode__ on Python 2		
		return self.start+"-"+self.end
		
# Create your models here.
class Answers(models.Model):
	question_text=models.CharField(max_length=200)
	pub_date=models.DateTimeField('date published')
	
	def __str__(self):             
		# __unicode__ on Python 2
		return self.question_text		