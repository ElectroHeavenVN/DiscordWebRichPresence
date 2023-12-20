const index = 0;
const appId = "1187046060120621157";
var lastPlaying = false;
var lastTitle = "";
var lastEp = "";

refreshInfo = () => {
    let playing = false,
        title = "",
        currentEp = "",
        link = "",
        cover = "";
    if (listening) {
        playing = document.querySelector("#player > iframe") != null;
        title = document.querySelector("#w-info > div.binfo > div.info > h1").innerText;
        var eps = document.querySelector("#w-episodes > div.body > div > ul").children;
        for (var element in eps) {
            if (Object.hasOwnProperty.call(eps, element)) {
                var episode = eps[element];
                if (episode.children[0].getAttribute("class").startsWith("active"))
                {
                    currentEp = "Ep " + episode.children[0].getAttribute("data-num") + " - " + episode.children[0].children[1].innerText;
                    link = episode.children[0].href;
                    break;
                }
            }
        }
        cover = document.querySelector("#w-info > div.binfo > div.poster > span > img").src;
    }
    if (lastPlaying != playing || lastTitle != title || lastEp != currentEp) {
        lastPlaying = playing;
        lastTitle = title;
        lastEp = currentEp;
        if (playing) {
            data = {
                application_id: appId,
                dontSave: true,
                type: 3,
                name: "AniWave",
                streamurl: "",
                details: title,
                state: currentEp,
                partycur: "",
                partymax: "",
                time_start: Date.now(),
                large_image: cover,
                large_text: "",
                button1_text: "Watch on AniWave",
                button1_url: link,
                button2_text: "Official AniWave site",
                button2_url: window.location.origin,
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