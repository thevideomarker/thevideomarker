////////////////////////////// 
//watch video

var vm_server_url = 'http://videomarker-markmyvideos.rhcloud.com/rest/vm/';

//var vm_server_url = 'http://localhost:8080/videomarker/rest/vm/';

var vm_create_url = vm_server_url+'create';

var vm_video_url = vm_server_url+'video';

var vm_video_for_page_url = vm_server_url+'videoforpage';

var vm_div_in_page_url = vm_server_url+'divforpageandclient';

var vm_pages_for_client_url = vm_server_url+'pagesForClient';

var vm_divIds_in_page;

var vm_is_update = 0;

var tracksForVideos = [];

var editVideoTrackCountForVideos = [];

var currentClipForVideos = [];

var intervalsForVideos = [];

/* Variables used for tracking current playing video and position*/
var vm_playingVideoId;
var intervals = [];
var i = 0;	
var startTime;	
var currentClip;

var vm_editTrackCount = 0;
	
$( document ).ready(function() {
//////////////////////////////////////////////////////////////
/*
1. Make call to find all the video divs in server for this page
2. For each div id returned by servers, check if the same div is available in the page
3. If available,
	a. Form the generic HTML for the video - HTML for wrapper divs, view tracks button and edit tracks button
	b. Call server to get details of that video.
*/
//code for view video.
	if(($("#vm_client_id").val() != null) && ($("#vm_page_name").val() != null) ) {

		//get the basic paramters - client Id, page name and user Id
		var vm_client_id = $("#vm_client_id").val();
		var vm_page_name = $("#vm_page_name").val();
		var vm_user_id = $("#vm_user_id").val();		
		
		console.log('client id = '+vm_client_id);
		console.log('page name  = '+vm_page_name);
		
		//make a call to get all the video ids in that page
		$.ajax({
				type: 'GET',
				url: vm_div_in_page_url+'?clientId='+vm_client_id+'&pageName='+vm_page_name,			
				success: function(data) { 
						vm_divIds_in_page = data;
						console.log(vm_divIds_in_page); 
						//hook up videos in the page
						hookupVideos();
						}			
			});		
			
	}

	/**
	* Method to get data for each videos and hook up with video marker
	*/
	function hookupVideos() {
		
		var vid_found = false;
		
		//iterate through all the videos for the page stored in server
		for(var i=0; i<vm_divIds_in_page.length;i++) {
			
			//check if any video by Id stored in server exists in the page
			var video = document.getElementById(vm_divIds_in_page[i]);			
			if(video != null) {
				console.log('found a matching video for Id - '+vm_divIds_in_page[i]);
				vid_found = true;
				//form general html elements for the video
				//form video specific html around each video
				attachVideoHtml(vm_divIds_in_page[i]);
				//get meta data for that video
				getDataForVideo(vm_divIds_in_page[i]);
			}
		}
		
		if(!vid_found) {
			// no existing videos found. Attach edit functions for existing videos in the page
				console.log('no videos in server. Bind edit functions for existing videos');
				$('.vm_editable_video').each(function() { 
					attachVideoHtml((this).id);
				});
		}
	}
	
	/**
	Attaches basic HTML around the video - HTML for wrapper divs for tracks, view tracks button and edit tracks button
	*/
	function attachVideoHtml(videoId) {
		console.log('attaching common html for --'+videoId);
		var videoHtmlString = '<div class="vm_controls" id="vm_controls_'+videoId+'">'
			+'<input type="button" class="vm_btn_display_tracks" id="vm_btn_display_tracks_'+videoId+'" value="View Tracks"/><br/>' +
			'<input type="button" class="vm_btn_edit_tracks" id="vm_btn_edit_tracks_'+videoId+'" value="Edit Tracks"/>'+
			'<div id="vm_edit_video_tracks_div_'+videoId+'"></div><div id="vm_view_video_tracks_div_'+videoId+'"></div></div>';
		
		$('#'+videoId).after(videoHtmlString);		
		
		//hide the view track container, edit track container and view track button. Button should be shown if there are existing tracks
		$('#vm_view_video_tracks_div_'+videoId).hide();	
		$('#vm_edit_video_tracks_div_'+videoId).hide();		
		$('#vm_btn_display_tracks_'+videoId).hide();	
		
		
		//add click functions for view and edit buttons for each video
		$('#vm_btn_display_tracks_'+videoId).bind("click",function() {
		//display track button is clicked. Hide edit div, mark the video clicked and mark the operation as view
			var tempId = $(this).attr('id');
			vm_playingVideoId = tempId.replace('vm_btn_display_tracks_','');
			$('#vm_view_video_tracks_div_'+videoId).toggle();	
			$('#vm_edit_video_tracks_div_'+videoId).hide();
			vm_is_update = 0;
		});
		
		//form common part of html - text box to enter track name, button to add track
		var editHtmlString = '<div class="controlsWrapper" id="controlsWrapper_'+videoId+'"><input type="text" class="addTrackText" id="addTrackText_'+videoId+'"/>'+
				'<input type="button" class="addTrack" value="Add Track" id="addTrack_'+videoId+'" disabled="true"/>'+				
				'<div class="trackHolder" id="trackHolder_'+videoId+'"></div><div>';
		//append it to edit holder div
		$("#vm_edit_video_tracks_div_"+videoId).html(editHtmlString);
		
		//html for submit button
		$("#vm_edit_video_tracks_div_"+videoId).append('<input type="button" id="vm_edit_video_submit_'+videoId+'" class="vm_edit_video_submit" value="Submit Tracks">');
		
		//attach click funtion for edit button
		$('#vm_btn_edit_tracks_'+videoId).bind("click",function() {
			var tempId = $(this).attr('id');
			vm_playingVideoId = tempId.replace('vm_btn_edit_tracks_','');
			$('#vm_edit_video_tracks_div_'+videoId).toggle();			
			$('#vm_view_video_tracks_div_'+videoId).hide();
			vm_is_update = 1;
			bindEditControls(videoId);
		});
		
		//attach click for submit
		$("#vm_edit_video_submit_"+videoId).bind("click", function() {					
				var tracks = [];
				console.log("Submit clicked");
				$(this).parent().find(".trackWrapper").each(function() {			
					
					var timeSets = [];
					var trackName;			
					$(this).find(".timeSetDiv").each(function() {
						console.log(this.id);
						var timeSet;
						var id=this.id.substr(8);
						var startTime;
						var endTime;
						
						startTime = $(this).find("#startTimeDiv_"+id).text();
						endTime = $(this).find("#endTimeDiv_"+id).text();
						timeSet = {"start":startTime,"end":endTime}
						timeSets.push(timeSet);
					});
					var track = {"trackName":$(this).find(".trackLabel").text(), "timeSets":timeSets};
					tracks.push(track);			
					});
					
					
					var updateRequest = {"videoId":"", "clientId":vm_client_id, "pageName":vm_page_name, "userId":vm_user_id, "divId":vm_playingVideoId, "tracks":tracks};
				console.log(updateRequest);
				$.ajax({
					type: 'POST',
					url: vm_create_url,
					dataType: 'json',
					data: JSON.stringify(updateRequest),
					contentType: 'application/json; charset=utf-8',
					success: function(data) { alert('data: ' + data); }
				});
			});
		
	}
		
	/**
	* getting data for a video
	*/
	function getDataForVideo(videoId) {
		
		//make ajax call to the server to get data for that video
		$.ajax({
				type: 'GET',
				url: vm_video_for_page_url+'?clientId='+vm_client_id+'&pageName='+vm_page_name+'&divId='+videoId+'&userId='+vm_user_id,			
				success: function(data) { 
						
						//populate a centralized JS variable to store tracks for all of the videos
						tracksForVideos.push({"videoId":videoId,"tracks":data.tracks});
						
						//for track relate html - attach the necessary functions also
						attachTracksForVideo(videoId, data);
						
					}			
			});
	}	
	
	
	/**
	* function to attach html content for each track around a video
	*/
	function attachTracksForVideo(videoId, data) {
		
		var video = document.getElementById(videoId);
		var tracks = data.tracks;
		
		var trackHtmlString = "";
		
		//if there are tracks, enable the display track button
		if(tracks.length>0) {
			$('#vm_btn_display_tracks_'+videoId).show();
		}
		
		for(var i=0;i<tracks.length;i++) {
			
			console.log('adding tracks');
			trackHtmlString = trackHtmlString+('<br/>'+tracks[i].trackName+' <input type="button" class="vm_playTrack" id="vm_view_track_'+videoId+'_'+tracks[i].trackName+'" value="play"></input><br/>');
		}		
		
		$('#vm_view_video_tracks_div_'+videoId).append(trackHtmlString);
				
		//forming track html for edit
			var editHtmlString;			
			//iterate through tracks to form track html for edit
				for(var i=0;i<tracks.length;i++) {
			
					$('#trackHolder_'+videoId).append('<div class="trackWrapper" id="trackWrapperDiv_'+videoId+'_'+i+'"><div id="trackLabel_'+videoId+'_'+i+'" class="trackLabel">'+tracks[i].trackName+'</div><div class="trackName" id="track_'+videoId+'_'+tracks[i].trackName+'"></div><!--<input type="button" id="btnStart_'+videoId+'_'+i+'" value="Start" class="startButton"/>--><div id="timeWrapperDiv_'+videoId+'_'+i+'" class="timeWrapper"></div></div>');
					
					
					console.log('adding tracks');
					editHtmlString = editHtmlString+'<br/>'+tracks[i].trackName+':';
					
					//form the html for time sets
					var timeSets = tracks[i].timeSets;
					var timeSetDiv;
					for(var j=0;j<timeSets.length;j++) {
												
						timeSetDiv = document.createElement('div');
						timeSetDiv.className = "timeSetDiv";
						
						timeSetDiv.id = "timeSet_"+j;			
						timeSetDiv.innerHTML = timeSetDiv.innerHTML + '<div class="startTimeDiv" id="startTimeDiv_'+j+'">'+timeSets[j].start+'</div> - <div class="endTimeDiv" id="endTimeDiv_'+j+'">'+timeSets[j].end+'</div>';
						$('#timeWrapperDiv_'+videoId+'_'+i).append(timeSetDiv);
					}
					
					hookStartButtons();
				}
				
				//set number of tracks
				vm_editTrackCount = tracks.length;
				
				//attach controls to edit buttons
				//bindEditControls(videoId);
		
		
		//below statement is required for controlling videos in html5
		video.addEventListener('loadedmetadata', function() {
			//currentClip = intervals[i];
			//startTime = currentClip["start"];	 
			//video.currentTime=startTime;	 
		}, false);	
		
		//for each track button add the click function
		$(".vm_playTrack").bind("click",function() {
			
			//get the video Id
			//var currentVideoId = $(this).parent().attr('id');
			//currentVideoId = currentVideoId.replace('vm_view_video_tracks_div_','');
			var trackName = (this).id;
			trackName = trackName.replace('vm_view_track_'+vm_playingVideoId+'_','');
			//get the clicked track details for video
			var track = getTrack(trackName, vm_playingVideoId);			
			//store the videoId for which track is playing
			//below parameters are global transient. Changes based on video and track played.
			//vm_playingVideoId = currentVideoId;
			intervals = track.timeSets;
			console.log(intervals);
			video.currentTime = intervals[0].start;
			currentClip = intervals[0];
			video.play();
		});
				
		video.ontimeupdate = function() {if(vm_is_update == 0) {checkAndUpdate()}};
	}	
	
	//video.play();
	/**
	* Function to get track data
	*/
	function getTrack(trackName, currentVideoId) {
		console.log('getting tracks for track name - '+trackName+' and video - '+currentVideoId);
		//get the track data from local repository stored against video Id
		var data = getTracksForVideoId(currentVideoId);
		console.log(data);
		for(var i=0; i<data.length; i++) {
			if(data[i].trackName == trackName) {
				return data[i];
			}
		}
	}
		
	/**
	* Function that monitors the video pointer and changes the position based on time sets
	*/
	function checkAndUpdate() {
		console.log('playing video'+vm_playingVideoId);
		var video = document.getElementById(vm_playingVideoId);
		console.log(currentClip["end"]);
		if(video.currentTime > currentClip["end"]) {
		
			if(i < intervals.length-1) {
				i = i+1;
				currentClip = intervals[i];			
				startTime = currentClip["start"];
				video.currentTime = startTime;						
			} else {
				video.pause();
			}
		}
	}
	
	function setCurrentClipForVideo(currentClip, videoId) {
		for(var i=0;i<currentClipForVideos.length;i++) {
			if(currentClipForVideos[i].videoId == videoId) {
				currentClipForVideos.splice(i,(i-1));
				currentClipForVideos.push(currentClip);
			}
		}
	}
	
	function getTracksForVideoId(videoId) {
		for(var i=0;i<tracksForVideos.length;i++) {
			if(tracksForVideos[i].videoId == videoId) {
				return tracksForVideos[i].tracks;
			}
		}
	}
	
	function getCurrentClipForVideo(videoId) {
		console.log('method getCurrentClipForVideo for video '+videoId);
		for(var i=0;i<currentClipForVideos.length;i++) {
			if(currentClipForVideos[i].videoId == videoId) {
				console.log('returning - '+currentClipForVideos[i].currentClip);
				return currentClipForVideos[i].currentClip;
			}
		}
	}
	
	function getIntervalsForVideo(videoId) {
		for(var i=0;i<intervalsForVideos.length;i++) {
			if(intervalsForVideos[i].videoId == videoId) {
				return intervalsForVideos[i].intervals;
			}
		}
	}
	
	////////////////////////////
	//edit video starts	
	function bindEditControls (videoId) {
		$(".addTrackText").bind("keypress",function() {
			$('#addTrack_'+videoId).removeAttr("disabled");
		});
				
		$('#addTrack_'+videoId).bind("click",function() {
			
			var trackName = $(this).parent().find(".addTrackText").val();
			//var trackDiv = $("#"+trackName);
			//if(trackDiv != undefined) {
				//alert('duplicate');
			//}
			
			$("#trackHolder_"+videoId).append('<div class="trackWrapper" id="trackWrapperDiv_'+videoId+'_'+vm_editTrackCount+'"><div id="trackLabel_'+videoId+'_'+vm_editTrackCount+'" class="trackLabel"></div><div id="track_'+videoId+'_'+vm_editTrackCount+'"></div><input type="button" id="btnStart_'+videoId+'_'+vm_editTrackCount+'" value="Start" class="startButton"/><div id="timeWrapperDiv_'+videoId+'_'+vm_editTrackCount+'" class="timeWrapper"></div></div>');
			$('#trackLabel_'+videoId+'_'+vm_editTrackCount).html(trackName);
			hookStartButtons(videoId);
			
			vm_editTrackCount = vm_editTrackCount+1;
		});
	}
	
	var timesetId = 0;
	
	function hookStartButtons (videoId) {
	$(".startButton").bind("click",function() {		
		
		var id = this.id;
		id = id.replace('btnStart_'+videoId+'_','');		
		console.log(vm_playingVideoId);
		var video = document.getElementById(vm_playingVideoId);
		var currentTime = video.currentTime;		
		//$("#timeWrapperDiv_"+id).append('<div class="timeSet"></div>');
		if($(this).hasClass("endButton")) {
			video.pause();
			$('#timeWrapperDiv_'+videoId+'_'+id).find('#timeSet_'+timesetId).append('<div class="endTimeDiv" id="endTimeDiv_'+timesetId+'">'+currentTime+'</div>');
			//$("#timeSet_"+timesetId).append('<div class="endTimeDiv" id="endTimeDiv_'+timesetId+'">'+currentTime+'</div>');
			//$("#"+id).addClass("startButton");
			$(this).removeClass("endButton");
			this.value = "Start";
		} else {
			var timeSetDiv = document.createElement('div');
			timeSetDiv.className = "timeSetDiv";
			timesetId = timesetId+1;
			timeSetDiv.id = "timeSet_"+timesetId;			
			timeSetDiv.innerHTML = timeSetDiv.innerHTML + '<div class="startTimeDiv" id="startTimeDiv_'+timesetId+'">'+currentTime+'</div> - ';
			$('#timeWrapperDiv_'+videoId+'_'+id).append(timeSetDiv);
			$(this).addClass("endButton");
			//$("#"+id).removeClass("startButton");
			this.value = "End";
			video.play();
		}
		
		//hookEndButtons();
	});	
	}
	
});

var tracks = [];

//////////////////////////////////////
//edit video

function enableTrackBtn() {
	$("#addTrack").enabled;
}

///////////////////////
//cut

//////////////////////

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            // Only send the token to relative URLs i.e. locally.
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        }
    }
});
