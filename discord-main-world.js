(() => {
    var st = "online";
    var since = 0;
    var afk = false;
    var otherActivities = [];
    var discordGateway;
    var activityQueue = [];
    var sendingActivity;
    var currentActivities = [];
    var currentActivitiesFromBGWorker = [];
    var statusDisplayType = 0;
    var platform = "desktop";
    var gotReponseFromBGWorker = false;
    var cachedExternalImages = [];

    var token = "";

    const originalWebSocket = window.WebSocket;
    const originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"];

    window.WebSocket = function (u, p) {
        this.downstreamSocket = new originalWebSocket(u, p);
        var newGateway = false;
        if (/gateway.*\.discord.gg/.test(u)) {
            newGateway = typeof (discordGateway) !== "undefined" && discordGateway !== null;
            discordGateway = this.downstreamSocket;
        }
        for (let i in originalWebSocketProperties) {
            Object.defineProperty(this, originalWebSocketProperties[i], {
                get: () => this.downstreamSocket[originalWebSocketProperties[i]],
                set: v => this.downstreamSocket[originalWebSocketProperties[i]] = v
            })
        }
        if (/gateway.*\.discord.gg/.test(u) && newGateway) {
            setTimeout(() => {
                SendDiscordActivity();
            }, 5000);
        }
    };

    window.WebSocket.prototype.send = function (d) {
        var cancelSend = false;
        if (d.substr(0, 8) === '{"op":2,') {
            const j = JSON.parse(d);
            token = j.d.token;
        }
        if (d.substr(0, 8) === '{"op":3,') {
            if (this.downstreamSocket === discordGateway) {
                const j = JSON.parse(d);
                st = j.d.status;
                since = j.d.since;
                afk = j.d.afk;
                if (JSON.stringify(currentActivities.concat(otherActivities)) != JSON.stringify(j.d.activities)) {
                    cancelSend = true;
                    otherActivities = j.d.activities;
                    if (gotReponseFromBGWorker) {
                        GetActivities().then(activities => {
                            j.d.activities = activities;
                            d = JSON.stringify(j);
                            SendDataToDiscordWS(this.downstreamSocket, d);
                        });
                    }
                }
            }
        }
        if (!cancelSend)
            SendDataToDiscordWS(this.downstreamSocket, d);
    };

    window.WebSocket.prototype.close = function (c, r) {
        this.downstreamSocket.close(c, r);
    };

    window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = originalWebSocket.OPEN;
    window.WebSocket.CLOSING = originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = originalWebSocket.CLOSED;

    document.addEventListener('wrp', function (msg) {
        UpdateActivityData(msg.detail);
    });

    document.addEventListener('updateRPCSettings', function (msg) {
        statusDisplayType = msg.detail.statusDisplayType;
        platform = msg.detail.platform;
        SendDiscordActivity();
    });

    document.addEventListener('resetActivities', function () {
        currentActivities = [];
        currentActivitiesFromBGWorker = [];
        SendDiscordActivity();
    });

    function SendDataToDiscordWS(downstreamSocket, data) {
        var cancelSend = false;
        if (data.substr(0, 8) === '{"op":3,') {
            if (downstreamSocket === discordGateway) {
                cancelSend = true;
                var j = JSON.parse(data);
                currentActivities = j.d.activities;
                if (otherActivities.length > 0)
                    j.d.activities = j.d.activities.concat(otherActivities);
                data = JSON.stringify(j);
                downstreamSocket.send(data);
            }
        }
        if (!cancelSend)
            downstreamSocket.send(data);
    }

    function SendDiscordActivity() {
        GetActivities().then(activities => {
            var activity = {
                op: 3,
                d: {
                    status: st,
                    activities: activities,
                    since,
                    afk,
                }
            };
            if (activityQueue.length == 0) {
                if (discordGateway && discordGateway.readyState == originalWebSocket.OPEN)
                    SendDataToDiscordWS(discordGateway, JSON.stringify(activity));
                setTimeout(() => {
                    if (activityQueue.length == 1) {
                        activityQueue = [];
                    }
                }, 5000);
            }
            else {
                if (!sendingActivity) {
                    sendingActivity = true;
                    setTimeout(() => {
                        if (discordGateway && discordGateway.readyState == originalWebSocket.OPEN)
                            SendDataToDiscordWS(discordGateway, JSON.stringify(activityQueue[activityQueue.length - 1]));
                        activityQueue = [];
                        sendingActivity = false;
                    }, 5000);
                }
            }
            activityQueue.push(activity);
        });
    }

    function checkStringValid(str) {
        return typeof (str) === "string" && str !== null && str.length > 0;
    }

    async function GetActivities() {
        var result = [];
        for (let i = 0; i < currentActivitiesFromBGWorker.length; i++) {
            var activityFromBGWorker = currentActivitiesFromBGWorker[i];
            if (!checkStringValid(activityFromBGWorker.applicationId) || activityFromBGWorker.applicationId === "0")
                continue;
            let activity = {
                application_id: activityFromBGWorker.applicationId,
                type: activityFromBGWorker.type,
                flags: 1,
                name: activityFromBGWorker.name,
                assets: {},
                buttons: [],
                metadata: {
                    button_urls: []
                },
                timestamps: {},
                status_display_type: statusDisplayType,
                platform: platform
            };
            if (typeof (activityFromBGWorker.flags) === "number")
                activity.flags = activityFromBGWorker.flags;
            if (activityFromBGWorker.type === 1)
                activity.url = activityFromBGWorker.streamUrl;
            if (checkStringValid(activityFromBGWorker.details))
                activity.details = activityFromBGWorker.details;
            if (checkStringValid(activityFromBGWorker.detailsUrl))
                activity.details_url = activityFromBGWorker.detailsUrl;
            if (checkStringValid(activityFromBGWorker.state))
                activity.state = activityFromBGWorker.state;
            if (checkStringValid(activityFromBGWorker.stateUrl))
                activity.state_url = activityFromBGWorker.stateUrl;
            if (activityFromBGWorker.timeStart)
                activity.timestamps.start = activityFromBGWorker.timeStart;
            if (activityFromBGWorker.timeEnd)
                activity.timestamps.end = activityFromBGWorker.timeEnd;
            if (checkStringValid(activityFromBGWorker.largeText))
                activity.assets.large_text = activityFromBGWorker.largeText;
            if (checkStringValid(activityFromBGWorker.largeUrl))
                activity.assets.large_url = activityFromBGWorker.largeUrl;
            if (checkStringValid(activityFromBGWorker.smallText))
                activity.assets.small_text = activityFromBGWorker.smallText;
            if (checkStringValid(activityFromBGWorker.smallUrl))
                activity.assets.small_url = activityFromBGWorker.smallUrl;
            if (checkStringValid(activityFromBGWorker.button1Text))
                activity.buttons[0] = activityFromBGWorker.button1Text;
            if (checkStringValid(activityFromBGWorker.button1Url))
                activity.metadata.button_urls[0] = activityFromBGWorker.button1Url;
            if (checkStringValid(activityFromBGWorker.button2Text))
                activity.buttons[1] = activityFromBGWorker.button2Text;
            if (checkStringValid(activityFromBGWorker.button2Url))
                activity.metadata.button_urls[1] = activityFromBGWorker.button2Url;
            if (typeof (activityFromBGWorker.partyCur) === "number" && typeof (activityFromBGWorker.partyMax) === "number")
                activity.party = {
                    size: [
                        activityFromBGWorker.partyCur.toString(),
                        activityFromBGWorker.partyMax.toString()
                    ]
                };

            let links = [];
            if (checkStringValid(activityFromBGWorker.largeImage)) {
                if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/(attachments|app-icons|app-assets)\//.test(activityFromBGWorker.largeImage))
                    activity.assets.large_image = "mp:" + activityFromBGWorker.largeImage.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
                links.push(activityFromBGWorker.largeImage);
            }
            if (checkStringValid(activityFromBGWorker.smallImage)) {
                if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/(attachments|app-icons|app-assets)\//.test(activityFromBGWorker.smallImage))
                    activity.assets.small_image = "mp:" + activityFromBGWorker.smallImage.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
                links.push(activityFromBGWorker.smallImage);
            }
            if (links.length > 0) {
                var cachedLargeImage = cachedExternalImages.find(e => e.url === activityFromBGWorker.largeImage);
                if (cachedLargeImage) {
                    activity.assets.large_image = "mp:" + cachedLargeImage.externalAssetPath;
                    links.splice(links.indexOf(activityFromBGWorker.largeImage), 1);
                }
                var cachedSmallImage = cachedExternalImages.find(e => e.url === activityFromBGWorker.smallImage);
                if (cachedSmallImage) {
                    activity.assets.small_image = "mp:" + cachedSmallImage.externalAssetPath;
                    links.splice(links.indexOf(activityFromBGWorker.smallImage), 1);
                }
            }
            if (links.length > 0) {
                var data = await GetExternalAssetsLink(activity.application_id, links);
                if (data.length === 0)
                    continue;
                for (let i = 0; i < data.length; i++) {
                    if (activityFromBGWorker.largeImage === data[i].url) {
                        activity.assets.large_image = "mp:" + data[i].external_asset_path;
                        if (!cachedExternalImages.find(e => e.url === activityFromBGWorker.largeImage))
                            cachedExternalImages.push({ url: activityFromBGWorker.largeImage, externalAssetPath: data[i].external_asset_path });
                        else
                            cachedExternalImages.find(e => e.url === activityFromBGWorker.largeImage).externalAssetPath = data[i].external_asset_path;
                    }
                    if (activityFromBGWorker.smallImage === data[i].url) {
                        activity.assets.small_image = "mp:" + data[i].external_asset_path;
                        if (!cachedExternalImages.find(e => e.url === activityFromBGWorker.smallImage))
                            cachedExternalImages.push({ url: activityFromBGWorker.smallImage, externalAssetPath: data[i].external_asset_path });
                        else
                            cachedExternalImages.find(e => e.url === activityFromBGWorker.smallImage).externalAssetPath = data[i].external_asset_path;
                    }
                }
            }
            result.unshift(activity);
        };
        
        return result;
    }

    async function GetExternalAssetsLink(appId, links) {
        if (token === "") {
            return [];
        }
        return await (await fetch('https://discord.com/api/v10/applications/' + appId + '/external-assets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({
                urls: links
            }),
        })).json();
    }

    function UpdateActivityData(activities) {
        gotReponseFromBGWorker = true;
        currentActivitiesFromBGWorker = [];
        activities.forEach(activity => {
            var appId = activity.applicationId;
            if (appId !== "0") {
                var activityData = {
                    flags: activity.flags,
                    type: activity.type,
                    applicationId: appId,
                    name: activity.name,
                    streamUrl: activity.streamUrl,
                    details: activity.details,
                    detailsUrl: activity.detailsUrl,
                    state: activity.state,
                    stateUrl: activity.stateUrl,
                    partyCur: activity.partyCur,
                    partyMax: activity.partyMax,
                    largeImage: activity.largeImage,
                    largeText: activity.largeText,
                    largeUrl: activity.largeUrl,
                    smallImage: activity.smallImage,
                    smallText: activity.smallText,
                    smallUrl: activity.smallUrl,
                    timeStart: activity.timeStart,
                    timeEnd: activity.timeEnd,
                    button1Text: activity.button1Text,
                    button1Url: activity.button1Url,
                    button2Text: activity.button2Text,
                    button2Url: activity.button2Url,
                }
                currentActivitiesFromBGWorker.push(activityData);
            }
        });
        SendDiscordActivity();
    }
})();