const index = 3;
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
const appId = "1163025400469934161";

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
        if (document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div") != null) {
            playing = !audioPlayers[0].paused;
            title = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a > div > span").innerText;
            songLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > div > div > span > a").href;
            songAuthor = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-content > h3").innerText;
            artworkLink = document.querySelector("#root > div.zm-section.zm-layout.has-player > div.zm-section.now-playing-bar > div > div > div.player-controls-left.level-left > div > div > div.media-left > a > div > div > figure > img").src;
        }
        if (lastPlaying != playing || lastSong != title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
            lastPlaying = playing
            lastSong = title
            lastTimeStamp = Date.now() - elapsed
            if (playing) {
                data = {
                    application_id: appId,
                    dontSave: true,
                    type: 2,
                    name: "Zing MP3",
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
                    button1_text: "Nghe trên Zing MP3",
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