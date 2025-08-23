const id = 'nhaccuatui';
const appId = "1186960720424878132";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function refreshInfo() {
    if (listening) {
        let playing = false,
            title = "",
            songLink = "",
            songAuthors = "",
            artworkLink = "";
        var audioPlayers = document.getElementsByTagName('audio');
        if (audioPlayers.length === 0) {
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
        let timePassed = Math.round(audioPlayers[0].currentTime * 1000);
        let duration = Math.round(audioPlayers[0].duration * 1000);
        playing = !audioPlayers[0].paused;
        var currentSong = getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[2]/div[1]');
        title = currentSong.childNodes[0].innerText;
        songLink = currentSong.childNodes[0].href;
        songAuthors = currentSong.childNodes[1].innerText;
        artworkLink = getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[1]/div/div/div/img').src;
        if (lastPlaying !== playing || lastSong !== title || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
            lastPlaying = playing;
            lastSong = title;
            lastTimeStamp = Date.now() - timePassed;
            var timeEnd = 0;
            if (playing)
                timeEnd = Date.now() - timePassed + duration;
            data = {
                applicationId: appId,
                type: ActivityType.Listening,
                name: "NhacCuaTui",
                details: title,
                state: songAuthors,
                largeImage: artworkLink,
                timeStart: lastTimeStamp,
                timeEnd: timeEnd,
                button1Text: "Nghe trên NhacCuaTui Beta",
                button1Url: songLink,
            };
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