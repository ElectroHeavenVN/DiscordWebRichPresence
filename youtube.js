const index = 0;
const appId = "847682519214456862" //From https://github.com/XFG16/YouTubeDiscordPresence
var lastPlaying = false;
var lastTitle = "";
var lastchannelProfilePicture = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo()
{
    let playing = false,
        title = "";
    if (listening) {
        if (location.pathname === "/watch" || document.querySelector("#movie_player > div.ytp-miniplayer-ui") != null) {
            if (document.querySelector(".html5-video-player") != null) {
                playing = document.querySelector(".html5-video-player").classList.contains("playing-mode");
            }
            if (document.querySelector("#info .title") != null) {
                title = document.querySelector("#info .title").innerText;
            }
        }
    }
    var videoPlayer = document.getElementsByTagName('video')[0];
    if (videoPlayer == null)
        return;
    var isLiveStreaming = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate.ytp-live > button") != null;
    if (!isLiveStreaming) {
        var elapsed = Math.round(videoPlayer.currentTime * 1000);
        var total = Math.round(videoPlayer.duration * 1000);
        if (total == NaN || elapsed == NaN)
            return;
    }
    var channelProfilePicture = document.querySelector("#owner > ytd-video-owner-renderer > a").querySelector("#img").src;
    var videoId = document.querySelector("#content > #page-manager> ytd-watch-flexy").getAttribute("video-id");
    if (lastPlaying !== playing || lastTitle !== title || channelProfilePicture !== lastchannelProfilePicture || (!isLiveStreaming && Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000)) {
        lastPlaying = playing;
        lastTitle = title;
        lastchannelProfilePicture = channelProfilePicture;
        var timeEnd = 0;
        if (!isLiveStreaming && Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            timeEnd = Date.now() - elapsed + total;
            lastTimeStamp = Date.now() - elapsed;
        }
        else {
            lastTimeStamp = Date.now();
        }
        if (playing) {
            data = {
                application_id: appId,
                dontSave: true,
                type: 3,
                name: "YouTube",
                details: title,
                state: "by " + document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").innerText,
                time_end: timeEnd,
                time_start: lastTimeStamp,
                large_image: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
                small_image: channelProfilePicture,
                small_text: document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").innerText,
                button1_text: isLiveStreaming ? "Watch livestream on YouTube" : "Watch video on YouTube",
                button1_url: "https://www.youtube.com/watch?v=" + videoId,
                button2_text: "View channel",
                button2_url: document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").href,
            };
            sentReset = false;
            setTimeout(() => {
                browser.runtime.sendMessage({
                    index,
                    status: data
                });
            }, 1000);
        } else if (!sentReset) {
            data = false;
            try {
                browser.runtime.sendMessage({
                    index,
                    action: "reset"
                });
                sentReset = true;
            } catch (e) { }
        }
    }
}