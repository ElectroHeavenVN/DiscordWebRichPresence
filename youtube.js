var portName="youtube",
lastPlaying=false,
lastTitle="",
lastchannelProfilePicture = ""
lastTimeStamp = 0
const appId = "847682519214456862"	//From https://github.com/XFG16/YouTubeDiscordPresence

refreshInfo=()=>{
	if(listening)
	{
		let playing=false,title=""
		if(location.pathname=="/watch" || document.querySelector("#movie_player > div.ytp-miniplayer-ui") != null)
		{
			if(document.querySelector(".html5-video-player")!=null)
			{
				playing=document.querySelector(".html5-video-player").classList.contains("playing-mode")
			}
			if(document.querySelector("#info .title")!=null)
			{
				title=document.querySelector("#info .title").textContent
			}
		}
		var videoPlayer = document.getElementsByTagName('video')[0];
		if (videoPlayer == null)
			return;
		var elapsed = Math.round(videoPlayer.currentTime * 1000)
		var total = Math.round(videoPlayer.duration * 1000)
		if (total == NaN || elapsed == NaN)
			return;
		var channelProfilePicture = document.querySelector("#owner > ytd-video-owner-renderer > a").querySelector("#img").src;
		var video_id = document.querySelector("#content > #page-manager> ytd-watch-flexy").getAttribute("video-id")
		var ampersandPosition = video_id.indexOf('&')
		if(ampersandPosition != -1) {
			video_id = video_id.substring(0, ampersandPosition)
		}
		if(lastPlaying!=playing || lastTitle!=title || channelProfilePicture != lastchannelProfilePicture || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000)
		{
			lastPlaying=playing
			lastTitle=title
			lastchannelProfilePicture = channelProfilePicture;
			lastTimeStamp = Date.now() - elapsed
			if(playing)
			{
				data={
					application_id:appId,
					dontSave:true,
					type:3,
					name:"YouTube",
					streamurl:"",
					details:title,
					state:"by " + document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").innerText,
					partycur:"",
					partymax:"",
					large_image:"https://i.ytimg.com/vi/" + video_id + "/hqdefault.jpg",
					time_start: lastTimeStamp,
					time_end: Date.now() - elapsed + total,
					large_text:"",
					small_image:channelProfilePicture,
					//small_image:"https://cdn.rcd.gg/PreMiD/websites/Y/YouTube/assets/logo.png",
					small_text:document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").innerText,
					//small_text:"YouTube",
					button1_text:"Watch on YouTube",
					button1_url:"https://www.youtube.com/watch?v=" + video_id,
					button2_text:"View channel",
					//button2_url:document.querySelector("#owner > ytd-video-owner-renderer > a").href,
					button2_url:document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").href,
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
