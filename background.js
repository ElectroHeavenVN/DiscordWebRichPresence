let discordPort = null;
let webPorts = [];

if (typeof browser === "undefined") {
	var browser = chrome;
}
var currentActivities = [];
var enableJoinButton;
var changeListeningToSp;
var delayOtherActivities;

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

const ActivityType = {
	Game: 0,
	Streaming: 1,
	Listening: 2,
	Watching: 3,
	Custom: 4,
	Competing: 5
};

//reference: https://stackoverflow.com/a/66618269/22911487
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
browser.runtime.onStartup.addListener(keepAlive);
keepAlive();

setInterval(CheckDisconnectedActivities, 5000);

browser.storage.local.get("settings", settings => {
	settings = settings.settings;
	enableJoinButton = settings.enableJoinButton;
	changeListeningToSp = settings.changeListeningToSp;
	delayOtherActivities = settings.delayOtherActivities;
});

function SendMessageToDiscordTab(message) {
	if (!discordPort)
		return;
	console.log("send message to Discord tab:", message);
	discordPort.postMessage(message);
}

function ResetActivities() {
	if (discordPort) {
		currentActivities = [];
		SendMessageToDiscordTab({
			action: "resetActivities"
		})
	}
}

function RemoveOldActivities() {
	for (let i = currentActivities.length - 1; i >= 0; i--) {
		if (Date.now() - currentActivities[i].lastTimeAlive > 10000) {
			console.log('remove activity at index ' + i);
			currentActivities.splice(i, 1);
		}
	}
}

function CheckDisconnectedActivities() {
	browser.storage.local.get("status", status => {
		//console.log('checking activities...')
		status = status.status;
		if (currentActivities.length == 0) {
			//console.log('No activity');
			return;
		}
		//else
		//console.log('Number of activities: ' + activities.length + "\r\n", activities);
		var oldLength = currentActivities.length;
		RemoveOldActivities();
		if (oldLength != currentActivities.length) {
			console.log('Send activities to Discord tab');
			var filteredActivities = [];
			for (let i = 0; i < currentActivities.length; i++) {
				if (status.state.find(e => e.id == currentActivities[i].id).enabled)
					filteredActivities.push(currentActivities[i].activity);
			}
			SendMessageToDiscordTab({
				activities: filteredActivities
			});
		}
		if (currentActivities.length == 0) {
			console.log('Reset Discord activity');
			ResetActivities();
		}
	});
}

browser.runtime.onConnect.addListener(port => {
	browser.storage.local.get("status", status => {
		status = status.status;
		if (status.enabled == undefined || !status.enabled)
			return;
		if (port.name == "discord") {
			if (discordPort) {
				SendMessageToDiscordTab({ action: "close" });
				discordPort.disconnect();
			}
			discordPort = port;
			console.info("New connection from Discord tab");
			port.onDisconnect.addListener(() => {
				console.info("Discord tab disconnected");
				discordPort = null;
				if (webPorts.length > 0) {
					webPorts.forEach(webPort => {
						webPort.postMessage({
							listen: false,
							state: status.state
						});
					});
				}
			})
			if (webPorts.length > 0) {
				webPorts.forEach(webPort => {
					webPort.postMessage({
						listen: true,
						state: status.state
					});
				});
			}
			else
				ResetActivities();
			SendMessageToDiscordTab({
				action: "updateDelayOtherActivities",
				value: delayOtherActivities
			});
			browser.storage.local.get("status", status => {
				status = status.status;
				RemoveOldActivities();
				var sendFirstMessageCount = 0;
				var intervalSendFirstMessage = setInterval(() => {
					var filteredActivities = [];
					for (let i = 0; i < currentActivities.length; i++) {
						if (status.state.find(e => e.id == currentActivities[i].id).enabled)
							filteredActivities.push(currentActivities[i].activity);
					}
					SendMessageToDiscordTab({
						activities: filteredActivities
					});
					sendFirstMessageCount++;
					if (sendFirstMessageCount >= 3)
						clearInterval(intervalSendFirstMessage);
				}, 2000);
			});
		}
		else if (port.name.startsWith("webRichPresence_")) {
			console.log("New connection from " + port.name);
			var index = webPorts.map(o => o.name).indexOf(port.name);
			if (index == -1) {
				console.log(`Add ${port.name} to the list`);
				webPorts.push(port);
			}
			else {
				console.log(`${port.name} already exists in the list, replace it`);
				webPorts[index] = port;
			}
			port.onDisconnect.addListener(() => {
				console.info(port.name + " disconnected");
				var index = webPorts.map(o => o.name).indexOf(port.name);
				if (index != -1)
					webPorts.splice(index, 1);
			})
			port.postMessage({
				listen: true,
				state: status.state
			});
		}
		else {
			console.error("Denied connection with unexpected name: ", port.name);
			port.disconnect();
		}
	});
})
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	//console.info(request);
	if (request.action !== undefined) {
		switch (request.action) {
			case "updateEnabledStatus":
				browser.storage.local.set({
					"status": {
						enabled: request.enabled,
						state: request.state
					}
				})
				if (!request.enabled) {
					ResetActivities();
					break;
				}
				if (webPorts.length > 0) {
					var filteredActivities = [];
					for (let i = currentActivities.length - 1; i <= 0; i--) {
						if (request.state.find(e => e.id == currentActivities[i].id).enabled)
							filteredActivities.push(currentActivities[i].activity);
						else 
							currentActivities.splice(i, 1);
					}
					SendMessageToDiscordTab({
						activities: filteredActivities
					});
					webPorts.forEach(webPort => {
						webPort.postMessage({
							listen: true,
							state: request.state
						});
					});
				}
				else
					ResetActivities();
				break;
			case "reset":
				if (request.id !== undefined) {
					var index = currentActivities.map(o => o.id).indexOf(request.id);
					if (index != -1)
						currentActivities.splice(index, 1);
					browser.storage.local.get("status", status => {
						status = status.status;
						RemoveOldActivities();
						var filteredActivities = [];
						for (let i = 0; i < currentActivities.length; i++) {
							if (status.state.find(e => e.id == currentActivities[i].id).enabled)
								filteredActivities.push(currentActivities[i].activity);
						}
						SendMessageToDiscordTab({
							activities: filteredActivities
						});
					});
				}
				else
					ResetActivities();
				sendResponse();
				break;
			case "ping":
				var index = currentActivities.map(o => o.id).indexOf(request.id);
				if (index != -1 && typeof (currentActivities[index].lastTimeAlive) !== "undefined")
					currentActivities[index].lastTimeAlive = Date.now();
				break;
			case "updateSettings":
				browser.storage.local.set({
					"settings": {
						enableJoinButton: request.enableJoinButton,
						changeListeningToSp: request.changeListeningToSp,
						delayOtherActivities: request.delayOtherActivities
					}
				});
				enableJoinButton = request.enableJoinButton;
				changeListeningToSp = request.changeListeningToSp;
				delayOtherActivities = request.delayOtherActivities;
				SendMessageToDiscordTab({
					action: "updateDelayOtherActivities",
					value: delayOtherActivities
				});
				RemoveOldActivities();
				if (currentActivities.length == 0)
					break;
				var filteredActivities = [];
				for (let i = 0; i < currentActivities.length; i++) {
					var activity = currentActivities[i];
					if (enableJoinButton)
						activity.activity.flags |= ActivityFlags.Embedded;
					else if ((activity.activity.flags & ActivityFlags.Embedded) == ActivityFlags.Embedded)
						activity.activity.flags ^= ActivityFlags.Embedded;
					if (changeListeningToSp && activity.activity.type == ActivityType.Listening && activity.activity.name !== "Spotify") {
						activity.activity.details = '[' + activity.activity.name + '] ' + activity.activity.details;
						activity.activity.state = activity.activity.state.replace('by ', '');
						activity.activity.name = "Spotify";
						if (activity.activity.button1Url)
							activity.activity.contextUri = activity.activity.syncID = activity.activity.button1Url;
						if (activity.activity.button2Url)
							activity.activity.artistIDs = [activity.activity.button2Url];
						activity.activity.albumID = "0";
						activity.activity.metadataType = "track";
					}
					filteredActivities.push(activity.activity);
				}
				SendMessageToDiscordTab({
					activities: filteredActivities
				});
				break;
			case 'getCurrentActivities':
				browser.runtime.sendMessage({
					action: 'currentActivities',
					data: currentActivities
				});
				break;
			case 'currentActivities':
				break;
			default:
				console.error("Unknown action", request.action);
		}
	}
	else {
		console.info(request);
		browser.storage.local.get("status", status => {
			status = status.status;
			if (status.enabled == undefined || !status.enabled)
				return;
			var filteredActivities = [];
			var index = currentActivities.map(o => o.id).indexOf(request.id);
			if (status.state.find(e => e.id == request.id).enabled) {
				var activity = {
					id: request.id,
					activity: request.status,
					lastTimeAlive: Date.now()
				};
				if (enableJoinButton)
					activity.activity.flags |= ActivityFlags.Embedded;
				if (index != -1)
					currentActivities[index] = activity;
				else
					currentActivities.push(activity);
			}
			else
				currentActivities.splice(index, 1);
			RemoveOldActivities();
			for (let i = 0; i < currentActivities.length; i++) {
				var activity = currentActivities[i];
				if (!status.state.find(e => e.id == activity.id).enabled)
					continue;
				if (activity.id == request.id) {
					if (enableJoinButton)
						activity.activity.flags |= ActivityFlags.Embedded;
					else if ((activity.activity.flags & ActivityFlags.Embedded) == ActivityFlags.Embedded)
						activity.activity.flags ^= ActivityFlags.Embedded;
					if (changeListeningToSp && activity.activity.type == ActivityType.Listening && activity.activity.name !== "Spotify") {
						activity.activity.details = '[' + activity.activity.name + '] ' + activity.activity.details;
						activity.activity.state = activity.activity.state.replace('by ', '');
						activity.activity.name = "Spotify";
						if (activity.activity.button1Url)
							activity.activity.contextUri = activity.activity.syncID = activity.activity.button1Url;
						if (activity.activity.button2Url)
							activity.activity.artistIDs = [activity.activity.button2Url];
						activity.activity.albumID = "0";
						activity.activity.metadataType = "track";
					}
				}
				filteredActivities.push(activity.activity);
			}

			SendMessageToDiscordTab({
				activities: filteredActivities
			});
		});
	}
})
