const id = 'youtubemusic';
const appId = "463151177836658699" //From https://github.com/PreMiD/Presences/tree/main/websites/Y/YouTube%20Music
var lastPlaying = false;
var lastTitle = "";
var lastTimeStamp = 0;

function refreshInfo() {
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
        if (videoPlayer == null) {
            sendReset(id);
            return;
        }
        var timePassed = Math.round(videoPlayer.currentTime * 1000)
        var total = Math.round(videoPlayer.duration * 1000)
        if (total == NaN || timePassed == NaN)
            return;
        var authors = document.querySelectorAll(".style-scope ytmusic-player-bar .subtitle a");
        if (authors.length == 0)
            return;
        var videoId = document.querySelector("div.ytp-title a").href;
        if (videoId === "")
            return;
        videoId = videoId.substring(videoId.indexOf("v=") + 2, videoId.indexOf("v=") + 13);
        var album = '';
        var authorsText = Array.from(authors).filter(a => !a.href.includes('browse/')).map(a => a.innerText).join(', ');
        if (authorsText === '')
            authorsText = document.querySelector(".style-scope ytmusic-player-bar .subtitle span").innerText;
        var albumElement = document.querySelector('.style-scope ytmusic-player-bar .subtitle a[href*="browse/"]');
        if (albumElement != null)
            album = albumElement.innerText;
        var thumbnailLink = document.querySelector(".ytmusic-player-bar img").src;
        var timeEnd = 0;
        if (playing)
            timeEnd = Date.now() - timePassed + total;
        if (lastPlaying !== playing || lastTitle !== title || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
            lastPlaying = playing;
            lastTitle = title;
            lastTimeStamp = Date.now() - timePassed;
            let songLink = "https://music.youtube.com/watch?v=" + videoId;
            data = {
                applicationId: appId,
                type: ActivityType.Listening,
                name: "YouTube Music",
                details: title,
                detailsUrl: songLink,
                state: authorsText,
                stateUrl: authors.length > 0 ? authors[0].href : undefined,
                largeImage: thumbnailLink,
                timeStart: lastTimeStamp,
                timeEnd: timeEnd,
                button1Text: "Listen on YouTube Music",
                button1Url: songLink,
            };
            if (album !== '') {
                data.largeText = album;
                data.largeUrl = albumElement.href;
                data.button2Text = "View album";
                data.button2Url = albumElement.href;
            }
            else {
                data.button2Text = "View channel";
                data.button2Url = document.querySelector("span.subtitle.style-scope.ytmusic-player-bar a").href;
            }
            if (!playing) {
                data.smallImage = SmallIcons.paused;
                data.smallText = "Paused";
                data.timeStart = undefined;
                data.timeEnd = undefined;
            }
            else {
                data.smallImage = SmallIcons.playing;
                data.smallText = "Playing";
            }
            sendStatus(id);
        }
    }
}