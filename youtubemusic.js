var portName="youtubemusic",
lastPlaying=false,
lastTitle="",
lastTimeStamp = 0
const appId = "463151177836658699"	//From https://github.com/PreMiD/Presences/tree/main/websites/Y/YouTube%20Music

refreshInfo=()=>{
	if(listening)
	{
		let playing=false,title=""
		if(document.querySelector(".html5-video-player")!=null)
		{
			playing = document.querySelector(".html5-video-player").classList.contains("playing-mode")
			if(document.querySelector(".style-scope ytmusic-player-bar .title")!=null)
			{
				title = document.querySelector(".style-scope ytmusic-player-bar .title").textContent
			}
		}
		var videoPlayer = document.getElementsByTagName('video')[0];
		if (videoPlayer == null)
			return;
		var elapsed = Math.round(videoPlayer.currentTime * 1000)
		var total = Math.round(videoPlayer.duration * 1000)
		if (total == NaN || elapsed == NaN)
			return;
		var video_id = document.querySelector("div.thumbnail-image-wrapper.style-scope.ytmusic-player-bar > img").src.replace("https://i.ytimg.com/vi/", "").substring(0, 11)
		if(lastPlaying!=playing || lastTitle!=title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000)
		{
			lastPlaying=playing
			lastTitle=title
			lastTimeStamp = Date.now() - elapsed
			if(playing)
			{
				data={
					application_id:appId,
					dontSave:true,
					type:2,
					name:"YouTube Music",
					streamurl:"",
					details:title,
					state:"by " + document.querySelector(".style-scope ytmusic-player-bar .subtitle a").textContent,
					partycur:"",
					partymax:"",
					large_image:"https://i.ytimg.com/vi/" + video_id + "/hqdefault.jpg",
					time_start: lastTimeStamp,
					time_end: Date.now() - elapsed + total,
					large_text:"",
					small_image:"https://cdn.rcd.gg/PreMiD/websites/Y/YouTube%20Music/assets/logo.png",
					small_text:"YouTube Music",
					button1_text:"Listen on YouTube Music",
					button1_url:"https://music.youtube.com/watch?v=" + video_id,
					button2_text:"View channel",
					button2_url:document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string > a").href,
				}
				chrome.runtime.sendMessage(data)
			}
			else
			{
				data=false
				chrome.runtime.sendMessage({action:"reset"})
			}
		}
	}
}
