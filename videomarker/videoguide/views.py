from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group, User
from django.core.files import File
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import timezone
from videoguide.forms import FileForm, UserLogonForm, UserRegisterForm
from videoguide.models import File, Question, TimeSet, Track
import json
import subprocess
import logging

logger = logging.getLogger('VIDEOMARKER')


def testLogger():
    logger.debug("this is a debug message!")

def testView(request):
    #q = Question(question_text="test", pub_date=timezone.now())
    #q.save()
    #quest = Question.objects.all()
    return render(request, 'test/test.html',{'quest':'test'})
  
# Create your views here.
@login_required    
def uploadFileForm(request):

	logger.debug('Entering uploadFileForm method')
	logger.debug(request.method)
	#fileFormSet = inlineformset_factory(File, User, form=FileForm)
	if request.method == 'POST':
		# create a form instance and populate it with data from the request:
		#form = FileForm(request.POST)		
		logger.debug("Inside post request")
		form = FileForm(request.POST, request.FILES)		
		# check whether it's valid:
		logger.debug(form)
		if form.is_valid():
			#form.save();
			file = form.save(commit=False)
			file.user = request.user
			logger.debug('owner name --> '+file.user.username)
			file.save()			
			iFileName = file.file.path
			oFileName = file.file.path +'.mp4'			
			cmd = 'ffmpeg -i '+iFileName+' '+oFileName
			logger.debug("ffmpeg command to be executed : ")
			logger.debug(cmd)
			subprocess.call(cmd) # check the ffmpeg command line :)									
			# process the data in form.cleaned_data as required
			# redirect to a new URL:			
			logger.debug('########################################### conversion done')
		
			return HttpResponseRedirect('/uploadform/')

	# if a GET (or any other method) we'll create a blank form
	else:
		form = FileForm()
	return render(request, 'test/fileForm.html', {'form': form})	
	    
       
def userRegister(request):
    if request.method=="POST":
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            username = request.POST['userName']
            password = request.POST['password']
            email = request.POST['email']
            firstName = request.POST['firstName']
            lastName = request.POST['lastName']
            user = User.objects.create_user(username, email, password)
            user.first_name = firstName            
            user.last_name = lastName
            user.save()    
            user = authenticate(username=username, password=password)
            login(request, user)
            g = Group.objects.get(name='registered_users')
            g.user_set.add(user)
            #login(request,user)
            return render(request, 'test/home.html')
            #return HttpResponseRedirect('/registerUserSuccess/')
    else:
        form = UserRegisterForm()
    return render(request, 'test/UserRegistrationForm.html', {'form':form})
       
       
def userLogin(request):
    if request.method=="POST":
        form = UserLogonForm(request.POST)
        if form.is_valid():
            username = request.POST['userName']
            password = request.POST['password']    
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return render(request, 'test/UserVideoList.html', {'user':user})
            # Redirect to a success page.
                else:
                    return render(request, 'test/UserLogonForm.html', {'form':form,'error':'User disabled'})
            else:
                return render(request, 'test/UserLogonForm.html', {'form':form,'error':'Invalid Login'})
               
            #return HttpResponseRedirect('/registerUserSuccess/')
    else:
        if request.user.is_authenticated():
            #return HttpResponse("<html> <h1>User already logged in</h1></html>")
            return render(request, 'test/UserVideoList.html', {'user':request.user})
        else:
            form = UserLogonForm()
    return render(request, 'test/UserLogonForm.html', {'form':form})
   
@login_required    
def editVideo(request):
    if request.method=="POST":
           
        data = json.loads(request.body.decode("utf-8"))        
        fileId = data['fileId']        
        f = File.objects.get(pk=fileId)
        tracks = data['tracks']
        for track in tracks:
            print(track['trackName'])
               
            trackEntity = Track(track_name=track['trackName'], file=f)
            #trackEntity.video = f
            trackEntity.save()
            print('track saved : ')
            print(trackEntity)
            timeSets = track['timeSets']
            for timeSet in timeSets:
                   
                timeSetEntity = TimeSet(start = timeSet['start'], end = timeSet['end'], track=trackEntity)                
                timeSetEntity.save()
                print('timeset saved ')
                print(timeSetEntity)
           
        print(f.track.all())
        return HttpResponse("<html>Bookmarks saved</html>")
    else:
        fileId = request.GET['fileId']        
        f = File.objects.get(pk=fileId)
        # for json data to display tracks
        tracksJson = []
        for track in f.track.all() :
            print(track)
            print(track.time_set.all())
            trackJson = {'trackName':track.track_name}
            timeSetsJson = []
            for timeSet in track.time_set.all() :
                timeSetJson = {'start':timeSet.start, 'end':timeSet.end}
                timeSetsJson.append(timeSetJson)
                print("time set =========")
                print(timeSet)
            trackJson['timeSets'] = timeSetsJson
            tracksJson.append(trackJson)
        jsonData = json.dumps(tracksJson)
        print(jsonData)
        return render(request, 'EditVideo.html', {'file':f, 'jsonData':jsonData})
           
       
def userLogout(request):
    if request.user.is_authenticated():
        logout(request)
    #return HttpResponse("<html> <h1>User logged out</h1></html>")
    return render(request, 'test/Home.html')
   
@login_required    
def watchVideo(request):
    fileId = request.GET['fileId']
    reqType = request.GET['type']
    f = File.objects.get(pk=fileId)    
    #tracks = json.dumps(f.video.all())    
    tracksJson = []
    for track in f.track.all() :
        print(track)
        print(track.time_set.all())
        trackJson = {'trackName':track.track_name}
        timeSetsJson = []
        for timeSet in track.time_set.all() :
            timeSetJson = {'start':timeSet.start, 'end':timeSet.end}
            timeSetsJson.append(timeSetJson)
            print("time set =========")
            print(timeSet)
        trackJson['timeSets'] = timeSetsJson
        tracksJson.append(trackJson)
    jsonData = json.dumps(tracksJson)
    print(jsonData)
    if reqType == 'json':
        return HttpResponse(jsonData, content_type="application/json")
    else :
        return render(request, 'test/WatchVideo.html', {'file':f, 'jsonData':jsonData})

def home(request):
    return render(request,'test/home.html',{'test':'test'})
