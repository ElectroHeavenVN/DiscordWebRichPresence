const index = 4;
const appId = "1186960720424878132";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function refreshInfo()
{
    if (listening) {
        let playing = false,
            title = "",
            songLink = "",
            songAuthors = "",
            artworkLink = "";
        var audioPlayers = document.getElementsByTagName('audio');
        if (audioPlayers.length === 0)
            return;
        let elapsed = Math.round(audioPlayers[0].currentTime * 1000);
        let total = Math.round(audioPlayers[0].duration * 1000);
        playing = !audioPlayers[0].paused;
        var currentSong = getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[2]/div[1]');
        title = currentSong.childNodes[0].innerText;
        songLink = currentSong.childNodes[0].href;
        songAuthors = currentSong.childNodes[1].innerText;
        artworkLink =  getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[1]/div/div/div/img').src;
        if (lastPlaying !== playing || lastSong !== title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            lastPlaying = playing;
            lastSong = title;
            lastTimeStamp = Date.now() - elapsed;
            if (playing) {
                data = {
                    application_id: appId,
                    dontSave: true,
                    type: 2,
                    name: "NhacCuaTui",
                    details: title,
                    state: "bởi " + songAuthors,
                    large_image: artworkLink,
                    time_start: lastTimeStamp,
                    time_end: Date.now() - elapsed + total,
                    button1_text: "Nghe trên NhacCuaTui Beta",
                    button1_url: songLink,
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
}