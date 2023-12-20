var st = "online";
var since = 0;
var afk = false;
var currentActivities = [];
var lastLargeImage = "";
var lastSmallImage = "";
var lastLargeMpImage = "";
var lastSmallMpImage = "";

const originalWebSocket = window.WebSocket,
    originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"];

window.WebSocket = function (u, p) {
    this.downstreamSocket = new originalWebSocket(u, p);
    var newGateway = false;
    if (/gateway.*\.discord.gg/.test(u)) {
        newGateway = window.discordGateway != undefined;
        window.discordGateway = this.downstreamSocket;
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
        }, 1000);
    }
}
window.WebSocket.prototype.send = function (d) {
    var cancelSend = false;
    if (this.downstreamSocket == window.discordGateway) {
        const start = d.substr(0, 8);
        if (start == '{"op":3,') {
            const j = JSON.parse(d);
            st = j.d.status;
            since = j.d.since;
            afk = j.d.afk;
            if (JSON.stringify(currentActivities.toString()) != JSON.stringify(j.d.activities.toString())) {
                cancelSend = true;
                GetActivities(j.d.activities).then(activities => {
                    j.d.activities = activities;
                    currentActivities = j.d.activities;
                    d = JSON.stringify(j);
                    this.downstreamSocket.send(d);
                });
            }
            else {
                currentActivities = j.d.activities;
            }
        }
    }
    if (!cancelSend)
        this.downstreamSocket.send(d);
}
window.WebSocket.prototype.close = function (c, r) {
    this.downstreamSocket.close(c, r);
}
window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
window.WebSocket.OPEN = originalWebSocket.OPEN;
window.WebSocket.CLOSING = originalWebSocket.CLOSING;
window.WebSocket.CLOSED = originalWebSocket.CLOSED;

document.addEventListener('rpc', function (msg) {
    SetDiscordActivityData(msg.detail);
});

var discordActivityData = {
    sendUpdate: false,
    activityType: 0,
    application_id: "0",
    activityName: "",
    activityUrl: "https://twitch.tv/settings",
    activityDetails: "",
    activityState: "",
    activityPartyCur: "",
    activityPartyMax: "",
    large_image: "",
    large_text: "",
    small_image: "",
    small_text: "",
    time_start: 0,
    time_end: 0,
    button1_text: 0,
    button1_url: "",
    button2_text: "",
    button2_url: "",
}

function SendDiscordActivity() {
    if (window.discordGateway && window.discordGateway.readyState == originalWebSocket.OPEN) {
        GetActivities([]).then(activities => {
            window.discordGateway.send(JSON.stringify({
                op: 3,
                d: {
                    status: st,
                    activities: activities,
                    since,
                    afk
                }
            }));
        });
    }
}

async function GetActivities(currActivities) {
    if (discordActivityData.application_id == "0")
        return currActivities;
    let activity = {
        application_id: discordActivityData.application_id,
        type: discordActivityData.activityType,
        flags: 1 << 0,
        name: discordActivityData.activityName,
        assets: {},
        buttons: [],
        metadata: {
            button_urls: []
        },
        timestamps: {}
    };

    if (discordActivityData.activityType == 1)
        activity.url = window.activityUrl;
    if (discordActivityData.activityPartyCur != "" && discordActivityData.activityPartyMax != "")
        activity.party = {
            size: [
                discordActivityData.activityPartyCur,
                discordActivityData.activityPartyMax
            ]
        };
    if (discordActivityData.activityDetails)
        activity.details = discordActivityData.activityDetails;
    if (discordActivityData.activityState)
        activity.state = discordActivityData.activityState;
    if (discordActivityData.time_start)
        activity.timestamps.start = discordActivityData.time_start;
    if (discordActivityData.time_end)
        activity.timestamps.end = discordActivityData.time_end;
    if (discordActivityData.large_text)
        activity.assets.large_text = discordActivityData.large_text;
    if (discordActivityData.small_text)
        activity.assets.small_text = discordActivityData.small_text;
    if (discordActivityData.button1_text)
        activity.buttons[0] = discordActivityData.button1_text;
    if (discordActivityData.button1_url)
        activity.metadata.button_urls[0] = discordActivityData.button1_url;
    if (discordActivityData.button2_text)
        activity.buttons[1] = discordActivityData.button2_text;
    if (discordActivityData.button2_url)
        activity.metadata.button_urls[1] = discordActivityData.button2_url;
    let links = [];
    if (discordActivityData.large_image && discordActivityData.large_image !== "") {
        if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/attachments\//.test(discordActivityData.large_image))
        activity.assets.large_image = "mp:" + discordActivityData.large_image.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
        else if (lastLargeImage == discordActivityData.large_image)
        activity.assets.large_image = lastLargeMpImage;
        else
            links.push(discordActivityData.large_image);
        lastLargeImage = discordActivityData.large_image;
    }
    if (discordActivityData.small_image && discordActivityData.small_image !== "") {
        if (/https?:\/\/(cdn|media)\.discordapp\.(com|net)\/attachments\//.test(discordActivityData.small_image))
        activity.assets.small_image = "mp:" + discordActivityData.small_image.replace(/https?:\/\/(cdn|media)\.discordapp\.(com|net)\//, "");
        else if (lastSmallImage == discordActivityData.small_image)
            activity.assets.small_image = lastSmallMpImage;
        else
            links.push(discordActivityData.small_image);
        lastSmallImage = discordActivityData.small_image;
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
        if (data.length == 2) {
            activity.assets.large_image = "mp:" + data[0].external_asset_path;
            activity.assets.small_image = "mp:" + data[1].external_asset_path;
        }
        else if (data.length == 1) {
            if (discordActivityData.large_image && discordActivityData.large_image !== "")
                lastLargeMpImage = activity.assets.large_image = "mp:" + data[0].external_asset_path;
            if (discordActivityData.small_image && discordActivityData.small_image !== "")
                lastSmallMpImage = activity.assets.small_image = "mp:" + data[0].external_asset_path;
        }
    }
    var currActivitiesCopy = currActivities.map(o => ({ ...o }));
    currActivitiesCopy.push(activity);
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
    var appId = msg.application_id;
    if (appId != "0" || discordActivityData.application_id != appId) {
        discordActivityData = {
            sendUpdate: true,
            activityType: msg.type,
            application_id: appId,
            activityName: msg.name,
            activityUrl: msg.streamurl,
            activityDetails: msg.details,
            activityState: msg.state,
            activityPartyCur: msg.partycur,
            activityPartyMax: msg.partymax,
            large_image: msg.large_image,
            large_text: msg.large_text,
            small_image: msg.small_image,
            small_text: msg.small_text,
            time_start: msg.time_start,
            time_end: msg.time_end,
            button1_text: msg.button1_text,
            button1_url: msg.button1_url,
            button2_text: msg.button2_text,
            button2_url: msg.button2_url,
        }
        window.SendDiscordActivity();
    }
}