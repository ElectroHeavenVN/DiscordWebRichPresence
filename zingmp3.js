const index = 3;
const appId = "1163025400469934161";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo()
{
    if (listening) {
        let playing = false,
            title = "",
            songLink = "",
            songAuthors = "",
            artworkLink = "";
        var audioPlayers = document.getElementsByTagName('audio');
        if (audioPlayers.length == 0)
            return;
        let elapsed = Math.round(audioPlayers[0].currentTime * 1000);
        let total = Math.round(audioPlayers[0].duration * 1000);
        if (document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div") != null) {
            playing = !audioPlayers[0].paused;
            title = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a > div > span").innerText;
            songLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a").href;
            songAuthors = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > h3").innerText;
            artworkLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-left > a > div > div > figure > img").src;
        }
        if (lastPlaying !== playing || lastSong !== title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            lastPlaying = playing;
            lastSong = title;
            lastTimeStamp = Date.now() - elapsed;
            if (playing) {
                data = {
                    application_id: appId,
                    dontSave: true,
                    type: 2,
                    name: "Zing MP3",
                    details: title,
                    state: "bởi " + songAuthors,
                    large_image: artworkLink,
                    time_start: lastTimeStamp,
                    time_end: Date.now() - elapsed + total,
                    button1_text: "Nghe trên Zing MP3",
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