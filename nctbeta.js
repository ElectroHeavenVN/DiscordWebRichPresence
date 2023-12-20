const index = 4;
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
const appId = "1186960720424878132";

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

refreshInfo = () => {
    if (listening) {
        let playing = false,
            title = "",
            songLink = "",
            songAuthor = "",
            artworkLink = "";
        var audioPlayers = document.getElementsByTagName('audio');
        if (audioPlayers.length == 0)
            return;
        let elapsed = Math.round(audioPlayers[0].currentTime * 1000);
        let total = Math.round(audioPlayers[0].duration * 1000);
        playing = !audioPlayers[0].paused;
        //var currentSong = document.querySelector("#root > div.sc-LENkF.cPFjEH").querySelector("div > div.sc-jaBfpI.gYCdDf > div").childNodes[0].childNodes[1].childNodes[0];
        var currentSong = getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[2]/div[1]');
        title = currentSong.childNodes[0].innerText;
        songLink = currentSong.childNodes[0].href;
        songAuthor = currentSong.childNodes[1].innerText;
        //artworkLink =  document.querySelector("#root > div.sc-LENkF.cPFjEH").querySelector("div > div.sc-jaBfpI.gYCdDf > div").childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].src
        artworkLink =  getElementByXpath('/html/body/div/div[5]/div/div[1]/div/div[1]/div[1]/div/div/div/img').src;
        if (lastPlaying != playing || lastSong != title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            lastPlaying = playing;
            lastSong = title;
            lastTimeStamp = Date.now() - elapsed;
            if (playing) {
                data = {
                    application_id: appId,
                    dontSave: true,
                    type: 2,
                    name: "NhacCuaTui",
                    streamurl: "",
                    details: title,
                    state: "bởi " + songAuthor,
                    partycur: "",
                    partymax: "",
                    large_image: artworkLink,
                    time_start: lastTimeStamp,
                    time_end: Date.now() - elapsed + total,
                    large_text: "",
                    small_image: "",
                    small_text: "",
                    button1_text: "Nghe trên NhacCuaTui Beta",
                    button1_url: songLink,
                    button2_text: "",
                    button2_url: "",
                }
                setTimeout(() => {
                    browser.runtime.sendMessage({
                        index,
                        status: data
                    });
                }, 1000);
            } else {
                data = false;
                try {
                    browser.runtime.sendMessage({
                        action: "reset"
                    });
                } catch (e) { }
            }
        }
    }
}