let discordPort, webPort;

if (typeof browser === "undefined") {
	var browser = chrome;
}
var activities = [];
var enableJoinButton;
var enableSpotifyButtons;

const ActivityFlags = {
	Instance: 1 << 0,
	Join: 1 << 1,
	Spectate: 1 << 2,
	JoinRequest: 1 << 3,
	Sync: 1 << 4,
	Play: 1 << 5,
	PartyPrivacyFriends: 1 << 6,
	PartyPrivacyVoiceChannel: 1 << 7,
	Embedded: 1 << 8,
}

//reference: https://stackoverflow.com/a/66618269/22911487
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

setInterval(checkDisconnectedActivities, 5000);

browser.storage.local.get("settings", settings => {
	settings = settings.settings;
	enableJoinButton = settings.enableJoinButton;
	enableSpotifyButtons = settings.enableSpotifyButtons;
});

function sendMessageToDiscordTab(message) {
	if (discordPort === undefined)
		return;
	console.log("send message to Discord tab:", message);
	discordPort.postMessage(message);
}

function resetActivity() {
	if (discordPort !== undefined) {
		sendMessageToDiscordTab({
			type: 0,
			flags: ActivityFlags.Instance,
			applicationId: "0",
			name: "",
			streamUrl: "",
			details: "",
			state: "",
			partyCur: "",
			partyMax: "",
			largeImage: "",
			largeText: "",
			smallImage: "",
			smallText: "",
			timeStart: "",
			timeEnd: "",
			button1Text: "",
			button1Url: "",
			button2Text: "",
			button2Url: "",
		})
	}
}

function removeOldActivities() {
	for (let i = activities.length - 1; i >= 0; i--) {
		if (Date.now() - activities[i].lastTimeAlive > 10000) {
			console.log('remove activity at index ' + i);
			activities.splice(0, 1);
		}
	}
}

function checkDisconnectedActivities() {
	browser.storage.local.get("status", status => {
		console.log('checking activities...')
		status = status.status;
		if (activities.length == 0) {
			console.log('No activity');
			return;
		}
		else
			console.log('Number of activities: ' + activities.length + "\r\n", activities);
		var oldLength = activities.length;
		removeOldActivities();
		if (oldLength != activities.length && activities.length > 0 && status.enabled[activities[0].index]) {
			console.log('Send next activity to Discord');
			sendMessageToDiscordTab(activities[0].activity);
		}
		if (activities.length == 0) {
			console.log('Reset Discord activity');
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
				sendMessageToDiscordTab({ action: "close" });
				discordPort.disconnect();
			}
			discordPort = port;
			console.info("New connection from Discord tab");
			port.onDisconnect.addListener(() => {
				console.info("Discord tab disconnected");
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
		else if (port.name == "webRichPresence") {
			if (webPort == undefined)
				webPort = port;
			console.info("New connection from other tab");
			port.onDisconnect.addListener(() => {
				console.info("Another tab disconnected");
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
			case "updateEnabledStatus":
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
					if (!request.enabled[request.index]) {
						browser.storage.local.get("status", status => {
							status = status.status;
							while (activities.length > 0 && !status.enabled[activities[0].index])
								activities.splice(0, 1);
							if (activities.length > 0 && status.enabled[activities[0].index]) {
								sendMessageToDiscordTab(activities[0].activity);
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
						removeOldActivities();
						if (activities.length > 0 && status.enabled[activities[0].index]) {
							if (index == 0)
								sendMessageToDiscordTab(activities[0].activity);
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
			case "updateSettings":
				browser.storage.local.set({
					"settings": {
						enableJoinButton: request.enableJoinButton,
						enableSpotifyButtons: request.enableSpotifyButtons
					}
				});
				enableJoinButton = request.enableJoinButton;
				enableSpotifyButtons = request.enableSpotifyButtons;
				removeOldActivities();
				if (activities.length == 0)
					break;
				var oldFlags = activities[0].activity.flags;
				if (enableJoinButton)
					activities[0].activity.flags |= ActivityFlags.Embedded;
				else if (activities[0].activity.flags & ActivityFlags.Embedded == ActivityFlags.Embedded)
					activities[0].activity.flags -= ActivityFlags.Embedded;
				if (oldFlags != activities[0].activity.flags)
					sendMessageToDiscordTab(activities[0].activity);
				break;
			default:
				console.error("Unknown action", request.action);
		}
	}
	else {
		browser.storage.local.get("status", status => {
			status = status.status;
			if (status.extEnabled == undefined || !status.extEnabled)
				return;
			var index = activities.map(o => o.index).indexOf(request.index);
			if (status.enabled[request.index]) {
				var activity = {
					index: request.index,
					activity: request.status,
					lastTimeAlive: Date.now()
				};
				if (enableJoinButton)
					activity.activity.flags |= ActivityFlags.Embedded;
				if (index != -1)
					activities[index] = activity;
				else
					activities.push(activity);
			}
			else
				activities.splice(index, 1);
			removeOldActivities();
			if (activities.length > 0 && status.enabled[activities[0].index]) {
				if (activities[0].index == request.index)
					sendMessageToDiscordTab(activities[0].activity);
			}
			else
				resetActivity();
		});
	}
})
