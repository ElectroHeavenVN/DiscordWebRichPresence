const id = 'soundcloud';
const appId = "890343617762304070"; //Official SoundCloud Discord application
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function convertTimeToTimestamp(timeString) {
    const timeComponents = timeString.split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    if (timeComponents.length === 2) {
        minutes = parseInt(timeComponents[0], 10);
        seconds = parseFloat(timeComponents[1]);
    } else if (timeComponents.length === 3) {
        hours = parseInt(timeComponents[0], 10);
        minutes = parseInt(timeComponents[1], 10);
        const secondsComponents = timeComponents[2].split('.');
        seconds = parseFloat(secondsComponents[0]);
        if (secondsComponents.length === 2) {
            const milliseconds = secondsComponents[1];
            seconds += parseFloat(`0.${milliseconds}`);
        }
    }
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds * 1000;
}

function refreshInfo()
{
    if (!listening)
        return;
    let playing = false,
        song = "",
        songLink = "",
        songAuthor = "",
        songAuthorLink = "",
        artworkLink = "";
    var elapsed = convertTimeToTimestamp(document.querySelector("div.playbackTimeline__timePassed > span:nth-child(2)").innerText);
    var totalText = document.querySelector("div.playbackTimeline__duration > span:nth-child(2)").innerText;
    if (totalText.startsWith('-'))
        var total = elapsed + convertTimeToTimestamp(totalText.replace('-', ''));
    else 
        var total = convertTimeToTimestamp(totalText);
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
    if (lastPlaying !== playing || lastSong !== song || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
        lastPlaying = playing;
        lastSong = song;
        lastTimeStamp = Date.now() - elapsed;
        if (playing) {
            data = {
                applicationId: appId,
                dontSave: true,
                type: ActivityType.Listening,
                name: "SoundCloud",
                details: song,
                state: "by " + songAuthor,
                largeImage: artworkLink,
                timeStart: lastTimeStamp,
                timeEnd: Date.now() - elapsed + total,
                button1Text: "Listen on SoundCloud",
                button1Url: songLink,
                button2Text: "View artist",
                button2Url: songAuthorLink,
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