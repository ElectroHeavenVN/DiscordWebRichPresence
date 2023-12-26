const id = 'youtubemusic';
const appId = "463151177836658699" //From https://github.com/PreMiD/Presences/tree/main/websites/Y/YouTube%20Music
var lastPlaying = false;
var lastTitle = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo()
{
    if (listening) {
        let playing = false,
            title = ""
        if (document.querySelector(".html5-video-player") != null) {
            playing = document.querySelector(".html5-video-player").classList.contains("playing-mode");
            if (document.querySelector(".style-scope ytmusic-player-bar .title") != null) {
                title = document.querySelector(".style-scope ytmusic-player-bar .title").innerText;
            }
        }
        var videoPlayer = document.getElementsByTagName('video')[0];
        if (videoPlayer == null)
            return;
        var elapsed = Math.round(videoPlayer.currentTime * 1000)
        var total = Math.round(videoPlayer.duration * 1000)
        if (total == NaN || elapsed == NaN)
            return;
        var author = document.querySelector(".style-scope ytmusic-player-bar .subtitle a");
        if (author == null)
            return;
        author = author.innerText;
        var videoId = document.querySelector("div.thumbnail-image-wrapper.style-scope.ytmusic-player-bar > img").src.replace("https://i.ytimg.com/vi/", "").substring(0, 11);
        if (lastPlaying !== playing || lastTitle !== title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            lastPlaying = playing;
            lastTitle = title;
            lastTimeStamp = Date.now() - elapsed;
            if (playing) {
                data = {
                    applicationId: appId,
                    dontSave: true,
                    type: ActivityType.Listening,
                    name: "YouTube Music",
                    details: title,
                    state: "by " + author,
                    largeImage: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
                    timeStart: lastTimeStamp,
                    timeEnd: Date.now() - elapsed + total,
                    button1Text: "Listen on YouTube Music",
                    button1Url: "https://music.youtube.com/watch?v=" + videoId,
                    button2Text: "View channel",
                    button2Url: document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string > a").href,
                };
                sentReset = false;
                setTimeout(() => {
                    browser.runtime.sendMessage({
                        id,
                        status: data
                    });
                }, 10);
            } else if (!sentReset) {
                data = false;
                try {
                    browser.runtime.sendMessage({
                        id,
                        action: "reset"
                    });
                    sentReset = true;
                } catch (e) { }
            }
        }
    }
}