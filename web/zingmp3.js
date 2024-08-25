const id = 'zingmp3';
const appId = "1163025400469934161";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;
var lastMVLink = "";
var lastTimeEndEqualZero = true;

function refreshInfo() {
    if (listening) {
        let playing = false,
            title = "",
            songLink = "",
            songAuthors = "",
            artworkLink = "";
        var audioPlayers = document.getElementsByTagName('audio');
        var videoPlayers = document.getElementsByTagName('video');
        if (audioPlayers.length == 0 && videoPlayers.length == 0) {
            if (!sentReset) {
                data = false;
                try {
                    browser.runtime.sendMessage({
                        id,
                        action: "reset"
                    });
                    sentReset = true;
                } catch (e) { }
            }
            return;
        }
        let timePassed = 0;
        let total = 0;
        if (videoPlayers.length > 0) {
            timePassed = Math.round(videoPlayers[0].currentTime * 1000);
            total = Math.round(videoPlayers[0].duration * 1000);
            playing = !videoPlayers[0].paused;
            title = document.querySelector("#video-scroll .media-content .title").innerText;
            songLink = window.location.href;
            if (songLink.startsWith("https://zingmp3.vn/video-clip/"))
                lastMVLink = songLink;
            else 
                songLink = lastMVLink;
            songAuthors = document.querySelector("#video-scroll .media-content .subtitle.is-one-line").innerText;
            artworkLink = document.querySelector("#video-queue-scroll .video-active img").src;
            var artistArtworkLink = document.querySelector("#video-scroll .media-left img").src;
            var mainSongAuthor = document.querySelector("#video-scroll .media-content .subtitle.is-one-line a").innerText;
        }
        else if (audioPlayers.length > 0) {
            timePassed = Math.round(audioPlayers[0].currentTime * 1000);
            total = Math.round(audioPlayers[0].duration * 1000);
            if (document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div") != null) {
                playing = !audioPlayers[0].paused;
                title = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a > div > span").innerText;
                songLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a").href;
                songAuthors = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > h3").innerText;
                artworkLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-left > a > div > div > figure > img").src;
            }
        }
        var timeEnd = 0;
        if (playing)
            timeEnd = Date.now() - timePassed + total;
        if (lastPlaying !== playing || lastSong !== title || lastTimeEndEqualZero != (timeEnd == 0) || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
            lastPlaying = playing;
            lastSong = title;
            lastTimeEndEqualZero = timeEnd == 0;
            lastTimeStamp = Date.now() - timePassed;
            data = {
                applicationId: appId,
                type: ActivityType.Listening,
                name: "Zing MP3",
                details: title,
                state: "by " + songAuthors,
                largeImage: artworkLink,
                timeStart: lastTimeStamp,
                timeEnd: timeEnd,
                button1Text: "Nghe trên Zing MP3",
                button1Url: songLink,
            };
            if (artistArtworkLink && playing) {
                data.smallImage = artistArtworkLink;
                data.smallText = mainSongAuthor;
                data.type = ActivityType.Watching;
                data.name = "Zing MP3 MV";
                data.button1Text = "Xem MV trên Zing MP3";
            }
            else if (!playing) {
                data.smallImage = SmallIcons.paused;
                data.smallText = "Paused";
            }
            else {
                data.smallImage = SmallIcons.playing;
                data.smallText = "Playing";
            }
            sentReset = false;
            setTimeout(() => {
                browser.runtime.sendMessage({
                    id,
                    status: data
                });
            }, 10);
        }
    }
}