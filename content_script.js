if (typeof browser === "undefined") {
    var browser = chrome;
}
var port = browser.runtime.connect({
    name: "webStatus"
});
var listening = false;
var data = false;
setTimeout(() => {
    setInterval(() => {
        refreshInfo();
        browser.runtime.sendMessage({
            action: "ping",
            index,
            alive: true
        });
    }, 3000);
}, 1000);
port.onMessage.addListener(msg => {
    if (msg.enabled[index]) {
        listening = msg.listen;
    }
});