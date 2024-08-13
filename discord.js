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
			case "updateDelayOtherActivities":
				document.dispatchEvent(new CustomEvent('updateDelayOtherActivities', { detail: { value: msg.value } }));
				break;
			case "resetActivities":
				document.dispatchEvent(new CustomEvent('resetActivities'));
				break;
			default:
				console.warn("Unknown action", msg.action);
		}
	}
	else if (Array.isArray(msg.activities)) {
		document.dispatchEvent(new CustomEvent('wrp', { detail: msg.activities }));
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