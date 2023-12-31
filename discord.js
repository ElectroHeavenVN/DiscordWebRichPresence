if (typeof browser === "undefined") {
	var browser = chrome;
}
let port = browser.runtime.connect({ name: "discord" }),
	closeOK = false;
port.onMessage.addListener(msg => {
	//console.info(msg);
	if (msg.action) {
		switch (msg.action) {
			case "close":
				closeOK = true;
				break;
			default:
				console.warn("Unknown action", msg.action);
		}
	}
	else if (msg.type !== undefined && msg.name !== undefined) {
		document.dispatchEvent(new CustomEvent('wrp', { detail: msg }));
	}
})
port.onDisconnect.addListener(() => {
	console.info("port " + closeOK ? "closed" : "disconnected with error");
	if (closeOK) {
		closeOK = false;
	}
	else {
		//location.reload();
	}
})