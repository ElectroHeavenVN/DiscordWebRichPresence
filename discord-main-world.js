var st = "online";
var since = 0;
var afk = false;
var otherActivities = [];
var lastLargeImage = "";
var lastSmallImage = "";
var lastLargeMpImage = "";
var lastSmallMpImage = "";
var discordGateway;
var activityQueue = [];
var sendingActivity;
var currentActivities = [];

var discordActivityData = {
    type: 0,
    applicationId: "0",
    name: "",
    streamUrl: "https://twitch.tv/settings",
    details: "",
    state: "",
    partyCur: "",
    partyMax: "",
    largeImage: "",
    largeText: "",
    smallImage: "",
    smallText: "",
    timeStart: 0,
    timeEnd: 0,
    button1Text: 0,
    button1Url: "",
    button2Text: "",
    button2Url: "",
};

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
        }, 3000);
    }
};

window.WebSocket.prototype.send = function (d) {
    var cancelSend = false;
    if (d.substr(0, 8) === '{"op":3,') {
        if (this.downstreamSocket === discordGateway) {
            const j = JSON.parse(d);
            st = j.d.status;
            since = j.d.since;
            afk = j.d.afk;
            if (JSON.stringify(currentActivities.concat(otherActivities)) != JSON.stringify(j.d.activities)) {
                cancelSend = true;
                otherActivities = j.d.activities;
                GetActivities([]).then(activities => {
                    j.d.activities = activities;
                    d = JSON.stringify(j);
                    send(this.downstreamSocket, d);
                });
            }
        }
    }
    if (!cancelSend)
        send(this.downstreamSocket, d);
};

window.WebSocket.prototype.close = function (c, r) {
    this.downstreamSocket.close(c, r);
};

window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
window.WebSocket.OPEN = originalWebSocket.OPEN;
window.WebSocket.CLOSING = originalWebSocket.CLOSING;
window.WebSocket.CLOSED = originalWebSocket.CLOSED;

document.addEventListener('wrp', function (msg) {
    SetDiscordActivityData(msg.detail);
});

function send(downstreamSocket, data) {
    var cancelSend = false;
    if (data.substr(0, 8) === '{"op":3,') {
        if (downstreamSocket === discordGateway) {
            cancelSend = true;
            const j = JSON.parse(data);
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
    GetActivities([]).then(activities => {
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
                send(discordGateway, JSON.stringify(activity));
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
                        send(discordGateway, JSON.stringify(activityQueue[activityQueue.length - 1]));
                    activityQueue = [];
                    sendingActivity = false;
                }, 5000);
            }
        }
        activityQueue.push(activity);
    });
}

async function GetActivities(currActivities) {
    if ((typeof (discordActivityData.applicationId) !== "string" || discordActivityData.applicationId === null || discordActivityData.applicationId.length === 0 || discordActivityData.applicationId === "0") && discordActivityData.name !== "Spotify")
        return currActivities;
    let activity = {
        application_id: discordActivityData.applicationId,
        type: discordActivityData.type,
        flags: 1,
        name: discordActivityData.name,
        assets: {},
        buttons: [],
        metadata: {
            button_urls: []
        },
        timestamps: {}
    };
    if (typeof (discordActivityData.flags) === "number")
        activity.flags = discordActivityData.flags;
    if (discordActivityData.type === 1)
        activity.url = discordActivityData.streamUrl;
    if (typeof (discordActivityData.details) === "string" && discordActivityData.details !== null && discordActivityData.details.length > 0)
        activity.details = discordActivityData.details;
    if (typeof (discordActivityData.state) === "string" && discordActivityData.state !== null && discordActivityData.state.length > 0)
        activity.state = discordActivityData.state;
    if (discordActivityData.timeStart)
        activity.timestamps.start = discordActivityData.timeStart;
    if (discordActivityData.timeEnd)
        activity.timestamps.end = discordActivityData.timeEnd;
    if (typeof (discordActivityData.largeText) === "string" && discordActivityData.largeText !== null && discordActivityData.largeText.length > 0)
        activity.assets.large_text = discordActivityData.largeText;
    if (typeof (discordActivityData.smallText) === "string" && discordActivityData.smallText !== null && discordActivityData.smallText.length > 0)
        activity.assets.small_text = discordActivityData.smallText;
    if (typeof (discordActivityData.button1Text) === "string" && discordActivityData.button1Text !== null && discordActivityData.button1Text.length > 0)
        activity.buttons[0] = discordActivityData.button1Text;
    if (typeof (discordActivityData.button1Url) === "string" && discordActivityData.button1Url !== null && discordActivityData.button1Url.length > 0)
        activity.metadata.button_urls[0] = discordActivityData.button1Url;
    if (typeof (discordActivityData.button2Text) === "string" && discordActivityData.button2Text !== null && discordActivityData.button2Text.length > 0)
        activity.buttons[1] = discordActivityData.button2Text;
    if (typeof (discordActivityData.button2Url) === "string" && discordActivityData.button2Url !== null && discordActivityData.button2Url.length > 0)
        activity.metadata.button_urls[1] = discordActivityData.button2Url;
    if (typeof (discordActivityData.partyCur) === "number" && typeof (discordActivityData.partyMax) === "number")
        activity.party = {
            size: [
                discordActivityData.partyCur.toString(),
                discordActivityData.partyMax.toString()
            ]
        };

    if (discordActivityData.name == "Spotify") {
        if (typeof (discordActivityData.contextUri) === "string" && discordActivityData.contextUri !== null && discordActivityData.contextUri.length > 0)
            activity.metadata.context_uri = discordActivityData.contextUri;
        if (typeof (discordActivityData.albumID) === "string" && discordActivityData.albumID !== null && discordActivityData.contextUri.length > 0)
            activity.metadata.album_id = discordActivityData.albumID;
        if (typeof (discordActivityData.artistIDs) === "object" && discordActivityData.artistIDs !== null && discordActivityData.artistIDs.length > 0)
            activity.metadata.artist_ids = discordActivityData.artistIDs;
        if (typeof (discordActivityData.metadataType) === "object" && discordActivityData.metadataType !== null && discordActivityData.metadataType.length > 0)
            activity.metadata.type = discordActivityData.metadataType;
        let userID = null;
        try {
            userID = (window.webpackChunkdiscord_app.push([
                [''], {},
                e => {
                    m = [];
                    for (let c in e.c) m.push(e.c[c])
                }
            ]), m).find(m => m?.exports?.default?.getCurrentUser !== void 0).exports.default.getCurrentUser().id;
        } catch (e) {
            userID = "000000000000000000";
        }
        if (typeof (activity.party) !== 'undefined')
            activity.party.id = 'spotify:' + userID;
        else
            activity.party = {
                id: 'spotify:' + userID
            };
        if (typeof (discordActivityData.syncID) === "string" && discordActivityData.syncID !== null && discordActivityData.syncID.length > 0)
            activity.sync_id = discordActivityData.syncID;
        else
            activity.sync_id = "0000000000000000000000";
    }

    let links = [];
    if (typeof (discordActivityData.largeImage) === "string" && discordActivityData.largeImage !== null && discordActivityData.largeImage.length > 0) {
        if (discordActivityData.largeImage.startsWith('spotify:'))
            activity.assets.large_image = discordActivityData.largeImage;
        else if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/(attachments|app-icons)\//.test(discordActivityData.largeImage))
            activity.assets.large_image = "mp:" + discordActivityData.largeImage.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
        else if (lastLargeImage === discordActivityData.largeImage)
            activity.assets.large_image = lastLargeMpImage;
        else
            links.push(discordActivityData.largeImage);
        lastLargeImage = discordActivityData.largeImage;
    }
    if (typeof (discordActivityData.smallImage) === "string" && discordActivityData.smallImage !== null && discordActivityData.smallImage.length > 0) {
        if (discordActivityData.smallImage.startsWith('spotify:'))
            activity.assets.small_image = discordActivityData.smallImage;
        else if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/attachments\//.test(discordActivityData.smallImage))
            activity.assets.small_image = "mp:" + discordActivityData.smallImage.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
        else if (lastSmallImage === discordActivityData.smallImage)
            activity.assets.small_image = lastSmallMpImage;
        else
            links.push(discordActivityData.smallImage);
        lastSmallImage = discordActivityData.smallImage;
    }
    if (links.length > 0) {
        let token = null;
        try {
            token = (window.webpackChunkdiscord_app.push([
                [''], {},
                e => {
                    m = [];
                    for (let c in e.c) m.push(e.c[c])
                }
            ]), m).find(m => m?.exports?.default?.getToken !== void 0).exports.default.getToken();
        } catch (e) {
            return currActivities;
        }
        var data = await getExternalAssetsLink(activity.application_id, token, links);
        for (let i = 0; i < data.length; i++) {
            if (discordActivityData.largeImage === data[i].url)
                lastLargeMpImage = activity.assets.large_image = "mp:" + data[i].external_asset_path;
            if (discordActivityData.smallImage === data[i].url)
                lastSmallMpImage = activity.assets.small_image = "mp:" + data[i].external_asset_path;
        }
    }
    var currActivitiesCopy = currActivities.map(o => ({ ...o }));
    currActivitiesCopy.unshift(activity);
    return currActivitiesCopy;
}

async function getExternalAssetsLink(appId, token, links) {
    return await (await fetch('https://discord.com/api/v9/applications/' + appId + '/external-assets', {
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

function SetDiscordActivityData(msg) {
    var appId = msg.applicationId;
    if (appId !== "0" || discordActivityData.applicationId !== appId) {
        discordActivityData = {
            flags: msg.flags,
            type: msg.type,
            applicationId: appId,
            name: msg.name,
            streamUrl: msg.streamUrl,
            details: msg.details,
            state: msg.state,
            partyCur: msg.partyCur,
            partyMax: msg.partyMax,
            largeImage: msg.largeImage,
            largeText: msg.largeText,
            smallImage: msg.smallImage,
            smallText: msg.smallText,
            timeStart: msg.timeStart,
            timeEnd: msg.timeEnd,
            button1Text: msg.button1Text,
            button1Url: msg.button1Url,
            button2Text: msg.button2Text,
            button2Url: msg.button2Url,
        }
        if (msg.name == "Spotify") {
            discordActivityData.contextUri = msg.contextUri;
            discordActivityData.albumID = msg.albumID;
            discordActivityData.artistIDs = msg.artistIDs;
            discordActivityData.syncID = msg.syncID;
            discordActivityData.metadataType = msg.metadataType;
        }
        SendDiscordActivity();
    }
}