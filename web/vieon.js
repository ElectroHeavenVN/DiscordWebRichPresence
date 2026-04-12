const id = 'vieon';
const appId = "1492902332772647005";
var lastPlaying = false;
var lastTitle = "";
var lastEp = "";
var lastState = "";
var sentReset = false;
var lastTimeStamp = 0;

function refreshInfo() {
    if (!location.pathname.endsWith(".html")) {
        sendReset(id);
        return;
    }
    let playing = false,
        title = "",
        currentEp = "",
        link = "",
        currentState = "",
        cover = "",
        timePassed = 0,
        total = 0;
    if (listening) {
        let videoPlayer = document.querySelector("#VIE_PLAYER");
        playing = !videoPlayer.paused;
        title = document.querySelector("#PLAYER_CONTROL .player__title").innerText;
        let currentEpText = document.querySelector("#PLAYER_CONTROL .player__title.player__title-sub").innerText;
        let match = currentEpText.match(/(?:Phần\s+(\d+)\s*:\s*)?Tập\s+(\d+)[\.:]\s*(.+)$/i);
        if (!match) {
            sendReset(id);
            return;
        }
        if (match[1])
            currentEp = 'Season ' + match[1] + ', Episode ' + match[2];
        else
            currentEp = 'Season 1, Episode ' + match[2];
        currentState = match[3].trim();
        link = window.location.href;

        cover = document.querySelector("#PLAYER_CONTAINER span img").src;
        if (currentState === "") {
            currentState = currentEp;
            currentEp = "";
        }
        var timeEnd = 0;
        if (playing) {
            timePassed = Math.round(videoPlayer.currentTime * 1000);
            total = Math.round(videoPlayer.duration * 1000);
            if (total == NaN || timePassed == NaN)
                return;
            timeEnd = Date.now() - timePassed + total;
        }
    }
    if (lastPlaying !== playing || lastTitle !== title || lastEp !== currentEp || lastState !== currentState || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
        lastPlaying = playing;
        lastTitle = title;
        lastEp = currentEp;
        lastState = currentState;
        lastTimeStamp = Date.now() - timePassed;
        data = {
            applicationId: appId,
            type: ActivityType.Watching,
            name: "VieON",
            details: title,
            detailsUrl: link,
            state: currentState,
            timeStart: lastTimeStamp,
            timeEnd: timeEnd,
            largeImage: cover,
            largeText: currentEp,
            largeUrl: link,
            smallImage: 'https://cdn.discordapp.com/app-icons/1492902332772647005/f0c13a6321c2f226e0740e7d8c085b1e.png',
            smallText: 'VieON',
            smallUrl: window.location.origin,
            button1Text: "Watch on VieON",
            button1Url: link
        };
        if (!playing) {
            data.smallImage = SmallIcons.paused;
            data.smallText = "Paused";
            data.timeStart = undefined;
            data.timeEnd = undefined;
            data.smallUrl = undefined;
        }
        // else {
        //     data.smallImage = SmallIcons.playing;
        //     data.smallText = "Playing";
        // }
        sendStatus(id);
    }
}