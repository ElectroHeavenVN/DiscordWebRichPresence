if (typeof browser === "undefined") {
    var browser = chrome;
}

const inIframe = () => window.self !== window.top;

function getVideoInfo() {
    var videos = document.getElementsByTagName('video');
    if (videos.length <= 0)
        return {};
    var video = videos[0];
    return {
        currentTime: video.currentTime,
        duration: video.duration,
        playing: !video.paused,
    }
}


if (inIframe()) {
    var port_ = browser.runtime.connect({
        name: `iframe_${window.location.href}_${Math.round(Math.random() * 10000000)}`,
    });

    port_.onMessage.addListener(msg => {
        if (msg.action == 'requestIFrameInfo' && msg.href === window.location.href) {
            var result;
            if (msg.type == 'getVideoInfo') {
                result = getVideoInfo();
            }
            port_.postMessage({
                answerTo: msg.caller,
                result
            });
        }
    });
}