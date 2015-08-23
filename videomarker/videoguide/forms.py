from django.forms import ModelForm
from videoguide.models import File
from django import forms
class FileForm(ModelForm):
	class Meta:
		model = File
		fields = ['file_name','file']
		exclude=('user',)
	#file_name=forms.CharField(label='File Name')
	#file = forms.FileField()
	
class UserRegisterForm(forms.Form):
	userName = forms.CharField(max_length=100)
	password = forms.CharField(widget=forms.PasswordInput())
	email = forms.EmailField()
	firstName = forms.CharField(max_length=100)
	lastName = forms.CharField(max_length=100)
	
class UserLogonForm(forms.Form):
	userName = forms.CharField(max_length=100)
	password = forms.CharField(widget=forms.PasswordInput())