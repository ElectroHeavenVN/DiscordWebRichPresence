const id = 'soundcloud';
const appId = "890343617762304070"; //Official SoundCloud Discord application
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo() {
    if (!listening)
        return;
    let playing = false,
        song = "",
        songLink = "",
        songAuthor = "",
        songAuthorLink = "",
        artworkLink = "";
    try {
        var timePassed = Number(document.querySelector("div.playbackTimeline__progressWrapper.sc-mx-1x").getAttribute("aria-valuenow")) * 1000;
        var duration = Number(document.querySelector("div.playbackTimeline__progressWrapper.sc-mx-1x").getAttribute("aria-valuemax")) * 1000;
        if (document.querySelector(".playControls__play") != null) {
            playing = document.querySelector(".playControls__play").classList.contains("playing");
        }
        if (document.querySelector(".playbackSoundBadge__title > a[href][title]") != null) {
            song = document.querySelector(".playbackSoundBadge__title > a[href][title]").getAttribute("title");
            songLink = "https://soundcloud.com" + document.querySelector(".playbackSoundBadge__title a[href][title]").getAttribute("href").split("?in=")[0];
            songAuthor = document.querySelector(".playbackSoundBadge__titleContextContainer.sc-mr-3x > a").getAttribute("title");
            songAuthorLink = document.querySelector(".playbackSoundBadge__titleContextContainer.sc-mr-3x > a").href;
            artworkLink = window.getComputedStyle(document.querySelector(".playControls__elements > div.playControls__soundBadge.sc-ml-3x > div > a > div > span"), false).backgroundImage.slice(4, -1).replace(/"/g, "");
        }
        if (lastPlaying !== playing || lastSong !== song || Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000) {
            lastPlaying = playing;
            lastSong = song;
            lastTimeStamp = Date.now() - timePassed;
            var timeEnd = 0;
            if (playing)
                timeEnd = Date.now() - timePassed + duration;
            data = {
                applicationId: appId,
                type: ActivityType.Listening,
                name: "SoundCloud",
                details: song,
                state: "by " + songAuthor,
                largeImage: artworkLink,
                timeStart: lastTimeStamp,
                timeEnd: timeEnd,
                button1Text: "Listen on SoundCloud",
                button1Url: songLink,
                button2Text: "View artist",
                button2Url: songAuthorLink,
            };
            if (!playing) {
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
    } catch (e) {
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
    }
}