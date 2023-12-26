if (typeof browser === "undefined") {
    var browser = chrome;
}

const ActivityType = {
    Game: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3,
    Custom: 4,
    Competing: 5
};

var port = browser.runtime.connect({
    name: "webRichPresence"
});
var listening = false;
var data = false;
setTimeout(() => {
    setInterval(() => {
        refreshInfo();
        browser.runtime.sendMessage({
            action: "ping",
            id,
            alive: true
        });
    }, 3000);
}, 1000);
port.onMessage.addListener(msg => {
    if (msg.state.find(e => e.id == id).enabled) {
        listening = msg.listen;
    }
});