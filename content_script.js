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
};

var port = browser.runtime.connect({
    name: `webRichPresence_${id}_${Math.round(Math.random() * 10000000)}`,
});
var listening = false;
var data = false;
var resetSent = false;

function validateString(str, maxLength) {
    if (!str)
        return str;
    if (str.length > maxLength)
        return str.substring(0, maxLength - 3) + "...";
    return str;
}

function sendStatus(id) {
    if (typeof data !== "object")   
        return;
    data.name = validateString(data.name, 256);
    data.details = validateString(data.details, 128);
    data.detailsUrl = validateString(data.detailsUrl, 256);
    data.state = validateString(data.state, 128);
    data.stateUrl = validateString(data.stateUrl, 256);
    data.largeImage = validateString(data.largeImage, 256);
    data.largeText = validateString(data.largeText, 128);
    data.largeUrl = validateString(data.largeUrl, 256);
    data.smallImage = validateString(data.smallImage, 256);
    data.smallText = validateString(data.smallText, 128);
    data.smallUrl = validateString(data.smallUrl, 256);
    data.button1Text = validateString(data.button1Text, 31);
    data.button1Url = validateString(data.button1Url, 512);
    data.button2Text = validateString(data.button2Text, 31);
    data.button2Url = validateString(data.button2Url, 512);
    resetSent = false;
    setTimeout(() => {
        browser.runtime.sendMessage({
            id,
            status: data
        });
    }, 10);
}

function sendReset(id) {
    if (resetSent)
        return;
    data = false;
    try {
        browser.runtime.sendMessage({
            id,
            action: "reset"
        });
        resetSent = true;
    } catch (e) { }
}

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