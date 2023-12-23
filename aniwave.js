const index = 5;
const appId = "1187046060120621157";
var lastPlaying = false;
var lastTitle = "";
var lastEp = "";
var sentReset = false;

function refreshInfo()
{
    let playing = false,
        title = "",
        currentEp = "",
        link = "",
        cover = "";
    if (listening) {
        if (location.pathname.includes("/watch/")) {
            playing = document.querySelector("#player > iframe") != null;
            title = document.querySelector("#w-info > div.binfo > div.info > h1").innerText;
            var eps = document.querySelector("#w-episodes > div.body > div > ul").children;
            for (var element in eps) {
                if (Object.hasOwnProperty.call(eps, element)) {
                    var episode = eps[element];
                    if (episode.children[0].getAttribute("class").startsWith("active")) {
                        currentEp = "Ep " + episode.children[0].getAttribute("data-num") + " - " + episode.children[0].children[1].innerText;
                        link = episode.children[0].href;
                        break;
                    }
                }
            }
            cover = document.querySelector("#w-info > div.binfo > div.poster > span > img").src;
        }
    }
    if (lastPlaying !== playing || lastTitle !== title || lastEp !== currentEp) {
        lastPlaying = playing;
        lastTitle = title;
        lastEp = currentEp;
        if (playing) {
            data = {
                applicationId: appId,
                dontSave: true,
                type: ActivityType.Watching,
                name: "AniWave",
                details: title,
                state: currentEp,
                timeStart: Date.now(),
                largeImage: cover,
                button1Text: "Watch on AniWave",
                button1Url: link,
                button2Text: "Official AniWave site",
                button2Url: window.location.origin,
            };
            sentReset = false;
            setTimeout(() => {
                browser.runtime.sendMessage({
                    index,
                    status: data
                });
            }, 10);
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