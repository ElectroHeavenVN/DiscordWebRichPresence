let discordPort, webPort;

if (typeof browser === "undefined") {
	var browser = chrome;
}
//reference: https://stackoverflow.com/a/66618269/22911487

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

function resetActivity() {
	if (discordPort !== undefined) {
		discordPort.postMessage({
			type: 0,
			application_id: "0",
			name: "",
			streamurl: "",
			details: "",
			state: "",
			partycur: "",
			partymax: "",
			large_image: "",
			large_text: "",
			small_image: "",
			small_text: "",
			time_start: "",
			time_end: "",
			button1_text: "",
			button1_url: "",
			button2_text: "",
			button2_url: "",
		})
	}
};

browser.runtime.onConnect.addListener(port => {
	browser.storage.local.get("status", status => {
		status = status.status;
		if (status.extEnabled == undefined || !status.extEnabled)
			return;
		if (port.name == "discord") {
			if (discordPort !== undefined) {
				discordPort.postMessage({ action: "close" });
				discordPort.disconnect();
			}
			discordPort = port;
			console.info("Discord port opened");
			port.onDisconnect.addListener(() => {
				console.info("Discord port closed");
				discordPort = undefined;
				if (webPort !== undefined) {
					webPort.postMessage({
						listen: false,
						enabled: status.enabled
					});
				}
			})
			if (webPort !== undefined) {
				webPort.postMessage({
					listen: true,
					enabled: status.enabled
				});
			}
			else {
				resetActivity();
			}
		}
		else if (port.name == "webStatus") {
			if (webPort !== undefined) {
				webPort.postMessage({ action: "close" });
				webPort.disconnect();
			}
			webPort = port;
			console.info("Port opened");
			port.onDisconnect.addListener(() => {
				console.info("Port closed");
				webPort = undefined;
				resetActivity();
			})
			if (webPort !== undefined) {
				webPort.postMessage({
					listen: true,
					enabled: status.enabled
				});
			}
		}
		else {
			console.error("Denied connection with unexpected name: ", port.name);
			port.disconnect();
		}
	});
})
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.info(request);
	if (request.action !== undefined) {
		switch (request.action) {
			case "updateStatus":
				browser.storage.local.set({
					"status": {
						extEnabled: request.extEnabled,
						enabled: request.enabled
					}
				})
				if (!request.extEnabled) {
					resetActivity();
					break;
				}
				if (webPort !== undefined) {
					if (!request.enabled[request.index])
						resetActivity();
					webPort.postMessage({
						listen: true,
						enabled: request.enabled
					});
				}
				else
					resetActivity();
				break;
			case "reset":
				resetActivity();
				sendResponse();
				break;

			default:
				console.error("Unknown action", request.action);
		}
	}
	else {
		if (discordPort !== undefined) {
			browser.storage.local.get("status", status => {
				status = status.status;
				if (status.extEnabled == undefined || !status.extEnabled)
					return;
				if (status.enabled[request.index])
					discordPort.postMessage(request.status);
				else
					resetActivity();
			});
		}
	}
})
