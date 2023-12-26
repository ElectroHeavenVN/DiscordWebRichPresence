const id = 'anix';
const appId = "1189179106928107593";
var lastPlaying = false;
var lastTitle = "";
var lastEp = "";
var lastState = "";
var sentReset = false;

function refreshInfo() {
    let playing = false,
        title = "",
        currentEp = "",
        link = "",
        currentState = "",
        cover = "";
    if (listening) {
        if (location.pathname.includes("/anime/")) {
            playing = document.querySelector("#player > iframe") != null;
            title = document.querySelector("#ani-detail-info > div.ani-data > div.maindata > h1").innerText;
            var eps = document.querySelector("#ani-episode > div.range-wrap").children;
            var epsRange = null;
            for (var key in eps) {
                if (Object.hasOwnProperty.call(eps, key)) {
                    if (eps[key].style.display === 'none')
                        continue;
                    epsRange = eps[key].children;
                    break;
                }
            }
            if (epsRange !== null)
                for (var element in epsRange) {
                    if (Object.hasOwnProperty.call(epsRange, element)) {
                        var episode = epsRange[element];
                    if (episode.children[0].className === "active") {
                        currentEp = "Episode " + episode.children[0].getAttribute("data-num");
                        currentState = episode.children[0].title;
                        link = episode.children[0].href;
                        break;
                    }
                }
            }
            var seasons = document.querySelector("div.ani-season-body.swiper.swiper-container.swiper-container-initialized.swiper-container-horizontal > div");
            if (seasons != null) {
                for (var element in seasons.children) {
                    if (!Object.hasOwnProperty.call(seasons.children, element))
                        continue;
                    var season = seasons.children[element];
                    if (season.className.includes(' active ')) {
                        currentEp = season.innerText.replace('SEASON', 'Season') + ", " + currentEp;
                        break;
                    }
                }
            }
            cover = document.querySelector("div.poster-wrap > div > span > img").src;
        }
    }
    if (lastPlaying !== playing || lastTitle !== title || lastEp !== currentEp || lastState !== currentState) {
        lastPlaying = playing;
        lastTitle = title;
        lastEp = currentEp;
        lastState = currentState;
        if (playing) {
            data = {
                applicationId: appId,
                dontSave: true,
                type: ActivityType.Watching,
                name: "Anix",
                details: title,
                state: currentState,
                timeStart: Date.now(),
                largeImage: cover,
                largeText: currentEp,
                smallImage: 'https://cdn.discordapp.com/app-icons/1189179106928107593/e669d08fd31ac08caf7cf47749b91e4d.png',
                smallText: 'Anix',
                button1Text: "Watch on Anix",
                button1Url: link,
                button2Text: "Official Anix site",
                button2Url: window.location.origin,
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