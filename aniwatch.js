const id = 'aniwatch';
const appId = "1189153680201633823";
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
            playing = document.querySelector("#iframe-embed") != null;
            title = document.querySelector("div.anisc-detail > h2 > a").innerText;
            var eps = document.querySelector("#detail-ss-list > div").children;
            var epsRange = null;
            for (var key in eps) {
                if (Object.hasOwnProperty.call(eps, key)) {
                    if (eps[key].className.startsWith("ss-choice") || eps[key].style.display === 'none')
                        continue;
                    epsRange = eps[key].children;
                    break;
                }
            }
            if (epsRange !== null)
                for (var element in epsRange) {
                    if (Object.hasOwnProperty.call(epsRange, element)) {
                        var episode = epsRange[element];
                    if (episode.className.endsWith(" active")) {
                        currentEp = "Episode " + episode.getAttribute("data-number");
                        currentState = episode.title;
                        link = episode.href;
                        break;
                    }
                }
            }
            var seasons = document.querySelector("div.os-list");
            if (seasons != null) {
                for (var element in seasons.children) {
                    if (!Object.hasOwnProperty.call(seasons.children, element))
                        continue;
                    var season = seasons.children[element];
                    if (season.className.endsWith(' active')) {
                        currentEp = season.innerText.replace('SEASON', 'Season') + ", " + currentEp;
                        break;
                    }
                }
            }
            cover = document.querySelector("div.anisc-poster > div > img").src;
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
                name: "AniWatch",
                details: title,
                state: currentState,
                timeStart: Date.now(),
                largeImage: cover,
                largeText: currentEp,
                smallImage: 'https://cdn.discordapp.com/app-icons/1189153680201633823/cde7116ffd71b28035065317d54b24e3.png',
                smallText: 'AniWatch',
                button1Text: "Watch on AniWatch",
                button1Url: link,
                button2Text: "Official AniWatch site",
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