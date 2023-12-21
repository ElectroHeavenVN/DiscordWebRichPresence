let discordPort, webPort;

if (typeof browser === "undefined") {
	var browser = chrome;
}
var activities = [];

//reference: https://stackoverflow.com/a/66618269/22911487
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

setInterval(checkDisconnectedActivities, 5000);

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

function checkDisconnectedActivities() {
	browser.storage.local.get("status", status => {
		console.log('checking activities...')
		status = status.status;
		if (activities.length == 0) {
			console.log('No activity');
			return;
		}
		else 
		console.log(activities.length + ' activity in total: ', activities);
		var oldLength = activities.length;
		while (activities.length > 0 && Date.now() - activities[0].lastTimeAlive > 10000) {
			console.log('remove 1st activity')
			activities.splice(0, 1);
		}
		if (oldLength != activities.length && activities.length > 0) {
			if (status.enabled[activities[0].index]) {
				console.log('send next activity');
				discordPort.postMessage(activities[0].activity);
			}
		}
		if (activities.length == 0) {
			console.log('send reset');
			resetActivity();
		}
	});
}

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
			console.info("Discord connected");
			port.onDisconnect.addListener(() => {
				console.info("Discord disconnected");
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
			if (webPort == undefined)
				webPort = port;
			console.info("New web connected");
			port.onDisconnect.addListener(() => {
				console.info("A web disconnected");
			})
			port.postMessage({
				listen: true,
				enabled: status.enabled
			});
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
					activities = [];
					break;
				}
				if (webPort !== undefined) {
					if (!request.enabled[request.index])
						{
							browser.storage.local.get("status", status => {
								status = status.status;
								while (activities.length > 0 && !status.enabled[activities[0].index])
									activities.splice(0, 1);
								if (activities.length > 0 && status.enabled[activities[0].index]) {
									discordPort.postMessage(activities[0].activity);
								}
								else
									resetActivity();
							});
						}
					webPort.postMessage({
						listen: true,
						enabled: request.enabled
					});
				}
				else
					resetActivity();
				break;
			case "reset":
				if (request.index !== undefined) {
					var index = activities.map(o => o.index).indexOf(request.index);
					if (index != -1)
						activities.splice(index, 1);
					browser.storage.local.get("status", status => {
						status = status.status;
						while (activities.length > 0 && Date.now() - activities[0].lastTimeAlive > 10000)
							activities.splice(0, 1);
						if (activities.length > 0 && status.enabled[activities[0].index]) {
							if (index == 0)
								discordPort.postMessage(activities[0].activity);
						}
						else
							resetActivity();
					});
				}
				else {
					resetActivity();
					activities = [];
				}
				sendResponse();
				break;
			case "ping":
				var index = activities.map(o => o.index).indexOf(request.index);
				if (index != -1 && typeof (activities[index].lastTimeAlive) !== "undefined")
					activities[index].lastTimeAlive = Date.now();
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
				var index = activities.map(o => o.index).indexOf(request.index);
				if (status.enabled[request.index]) {
					if (index != -1) {
						activities[index] = {
							index: request.index,
							activity: request.status,
							lastTimeAlive: Date.now()
						};
					}
					else
						activities.push({
							index: request.index,
							activity: request.status,
							lastTimeAlive: Date.now()
						});
				}
				else
					activities.splice(index, 1);
				while (activities.length > 0 && Date.now() - activities[0].lastTimeAlive > 10000)
					activities.splice(0, 1);
				if (activities.length > 0 && status.enabled[activities[0].index]) {
					if (activities[0].index == request.index)
						discordPort.postMessage(activities[0].activity);
				}
				else
					resetActivity();
			});
		}
	}
})
