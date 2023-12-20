if (typeof browser === "undefined") {
    var browser = chrome;
}
var port = browser.runtime.connect({
    name: "webStatus"
});
var closeOK = false;
var listening = false;
var data = false;
setInterval(refreshInfo, 1000);
port.onMessage.addListener(msg => {
    console.info(msg);
    if (msg.action) {
        switch (msg.action) {
            case "close":
                closeOK = true;
                break;
            default:
                console.warn("Unknown action", msg.action);
        }
    } else if (msg.enabled[index]) {
        listening = msg.listen;
        if (listening && data) {
            browser.runtime.sendMessage({
                index,
                status: data
            });
        }
    }
});
port.onDisconnect.addListener(() => {
    console.info("port closed " + closeOK);
    if (closeOK) {
        closeOK = false;
        listening = false;
    } else {
        //location.reload();
    }
})