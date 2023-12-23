const index = 0;
const appId = "847682519214456862" //From https://github.com/XFG16/YouTubeDiscordPresence
var lastPlaying = false;
var lastTitle = "";
var lastchannelProfilePicture = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo() {
    let playing = false,
        title = "";
    if (listening) {
        if (location.pathname === "/watch" || location.pathname === "/embed/" || document.querySelector("#movie_player > div.ytp-miniplayer-ui") != null) {
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
    var channelProfilePicture = "";
    var videoOwner = document.querySelector("#owner > ytd-video-owner-renderer > a");
    if (videoOwner != null)
        channelProfilePicture = videoOwner.querySelector("#img").src;
    if (document.querySelector("#content > #page-manager> ytd-watch-flexy") == null)
        return;
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
                applicationId: appId,
                dontSave: true,
                type: ActivityType.Watching,
                name: "YouTube",
                details: title,
                state: "by " + document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a")?.innerText,
                timeEnd: timeEnd,
                timeStart: lastTimeStamp,
                largeImage: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
                smallImage: channelProfilePicture,
                smallText: document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a")?.innerText,
                button1Text: isLiveStreaming ? "Watch livestream on YouTube" : "Watch video on YouTube",
                button1Url: "https://www.youtube.com/watch?v=" + videoId,
                button2Text: "View channel",
                button2Url: document.querySelector("#upload-info > #channel-name > #container > #text-container > #text > a").href,
            };
            sentReset = false;
            setTimeout(() => {
                browser.runtime.sendMessage({
                    index,
                    status: data
                });
            }, 10);
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