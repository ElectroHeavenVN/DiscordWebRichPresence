const id = 'aniwave';
const appId = "1187046060120621157";
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
        if (location.pathname.includes("/watch/")) {
            playing = document.querySelector("#player > iframe") != null;
            title = document.querySelector("#anime-info > div.data > h1").innerText;
            var eps = document.querySelector("#episodes").children;
            var epsRange = null;
            for (var key in eps) {
                if (Object.hasOwnProperty.call(eps, key)) {
                    if (eps[key].className !== 'range' || eps[key].style.display === 'none')
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
            var seasons = document.querySelector("#seasons");
            if (seasons != null) {
                for (var element in seasons.children[0].children) {
                    if (!Object.hasOwnProperty.call(seasons.children[0].children, element))
                        continue;
                    var season = seasons.children[0].children[element];
                    if (season.children[0].className.endsWith(' active')) {
                        currentEp = season.children[0].children[1].children[0].innerText.replace('SEASON', 'Season') + ", " + currentEp;
                        break;
                    }
                }
            }
            cover = document.querySelector("#anime-info > div.poster-wrap > div > span > img").src;
        }
        if (currentState === "") {
            currentState = currentEp;
            currentEp = "";
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
                type: ActivityType.Watching,
                name: "AniWave",
                details: title,
                state: currentState,
                timeStart: Date.now(),
                largeImage: cover,
                largeText: currentEp,
                smallImage: 'https://cdn.discordapp.com/app-icons/1187046060120621157/50eaca32405aec391cc2f8ce8769fb62.png',
                smallText: 'AniWave',
                button1Text: "Watch on AniWave Lite",
                button1Url: link,
                button2Text: "Official AniWave Lite site",
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