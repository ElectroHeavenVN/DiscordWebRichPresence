const id = 'hianime';
const appId = "1223343776941211798";
var lastPlaying = false;
var lastTitle = "";
var lastEp = "";
var lastState = "";
var sentReset = false;
var lastTimeStamp = 0;

setTimeout(() => {
    port.onMessage.addListener(msg => {
        if (msg.action !== 'iframeResult' || !msg.data || !msg.data.playing)
            return;
        let playing = msg.data.playing,
            title = "",
            currentEp = "",
            link = "",
            currentState = "",
            cover = "",
            timePassed = 0,
            total = 0;
        if (listening) {
            if (!location.pathname.includes("/watch/")) {
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
            }
            title = document.querySelector("#ani_detail div.anis-watch-wrap div.anis-watch-detail div.anisc-detail h2 a").title;
            var eps = document.querySelector("#detail-ss-list > div").children;
            var epsRange = null;
            for (var key in eps) {
                if (Object.hasOwnProperty.call(eps, key)) {
                    if (eps[key].style.display === 'none')
                        continue;
                    if (!eps[key].id.startsWith("episodes-page") && !eps[key].className.includes("ss-list"))
                        continue;
                    epsRange = eps[key].children;
                    break;
                }
            }
            if (epsRange !== null)
                for (var element in epsRange) {
                    if (Object.hasOwnProperty.call(epsRange, element)) {
                        var episode = epsRange[element];
                        if (episode.className.endsWith(' active')) {
                            currentEp = 'Episode ' + episode.getAttribute('data-number');
                            if (episode.children.length > 1)
                                currentState = episode.querySelector(".ssli-detail").children[0].title;
                            link = episode.href;
                            break;
                        }
                    }
                }
            var seasons = document.querySelector("div.other-season .os-list");
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
            cover = document.querySelector("div.anis-watch-detail div.anisc-poster img").src;
            if (currentState === "") {
                currentState = currentEp;
                currentEp = "";
            }
            if (/^Episode \d+$/.test(currentEp)) 
                currentEp = "Season 1, " + currentEp;
        }
        var timeEnd = 0;
        if (msg.data.playing) {
            timePassed = Math.round(msg.data.currentTime * 1000);
            total = Math.round(msg.data.duration * 1000);
            timeEnd = Date.now() - timePassed + total;
        }
        if (lastPlaying !== playing || lastTitle !== title || lastEp !== currentEp || lastState !== currentState || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
            lastPlaying = playing;
            lastTitle = title;
            lastEp = currentEp;
            lastState = currentState;
            lastTimeStamp = Date.now() - timePassed;
            var data = {
                applicationId: appId,
                type: ActivityType.Watching,
                name: "HiAnime",
                details: title,
                state: currentState,
                timeStart: lastTimeStamp,
                timeEnd: timeEnd,
                largeImage: cover,
                largeText: currentEp,
                smallImage: 'https://cdn.discordapp.com/app-icons/1223343776941211798/04251a85dc268c18e889f9ef2c7f3a49.png',
                smallText: 'HiAnime',
                button1Text: "Watch on HiAnime",
                button1Url: link,
                button2Text: "Official HiAnime site",
                button2Url: window.location.origin,
            };
            if (!playing) {
                data.smallImage = SmallIcons.paused;
                data.smallText = "Paused";
                data.timeStart = undefined;
                data.timeEnd = undefined;
            }
            // else {
            //     data.smallImage = SmallIcons.playing;
            //     data.smallText = "Playing";
            // }
            sentReset = false;
            setTimeout(() => {
                browser.runtime.sendMessage({
                    id,
                    status: data
                });
            }, 10);
        }
    });
}, 1000);

function refreshInfo() {
    var iframe = document.querySelector("#iframe-embed");
    if (iframe === null) {
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
    browser.runtime.sendMessage(
        {
            action: "getIframeInfo",
            type: 'getVideoInfo',
            iframe_href: iframe.src,
            name: port.name,
        });
}