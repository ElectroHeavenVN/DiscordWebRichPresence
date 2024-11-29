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

const SmallIcons = {
    playing: 'https://cdn.discordapp.com/app-assets/1163025400469934161/1273187177173352478.png',
    paused: 'https://cdn.discordapp.com/app-assets/1163025400469934161/1273187177274019850.png',
}

var port = browser.runtime.connect({
    name: `webRichPresence_${id}_${Math.round(Math.random() * 10000000)}`,
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
    if (msg.action == 'setState') 
        listening = msg.state.find(e => e.id == id).enabled;
});