const st = "online";
const since = 0;
const afk = false;
let timer;

const originalWebSocket=window.WebSocket,originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"];

window.WebSocket = function(u,p)
{
    this.downstreamSocket = new originalWebSocket(u,p);
    if (/gateway.*\.discord.gg/.test(u))
    {
        window.SetDiscordActivityActiveSocket = this.downstreamSocket;
    }
    for(let i in originalWebSocketProperties)
    {
        Object.defineProperty(this, originalWebSocketProperties[i], {
            get: () => this.downstreamSocket[originalWebSocketProperties[i]],
            set: v =>this.downstreamSocket[originalWebSocketProperties[i]] = v
        })
    }
}
window.WebSocket.prototype.send = function(d)
{
    // if (this.downstreamSocket == window.SetDiscordActivityActiveSocket)
    // {
    //     const start = d.substr(0,8);
    //     if (start == '{"op":3,')
    //     {
    //         const j = JSON.parse(d);
    //         status = j.d.status;
    //         since = j.d.since;
    //         afk = j.d.afk;
    //         window.SetDiscordActivitySendStatus();
    //     }
    //     else
    //     {
    //         if (start=='{"op":2,')
    //         {
    //             clearInterval(timer);
    //             timer = setInterval(() => {
    //                 if(window.discordActivityData.sendUpdate)
    //                 {
    //                     window.discordActivityData.sendUpdate = false;
    //                     window.SetDiscordActivitySendStatus();
    //                 }
    //             },500)
    //         }
    //         this.downstreamSocket.send(d);
    //     }
    // }
    // else
    //{
        this.downstreamSocket.send(d);
    //}
}
window.WebSocket.prototype.close = function(c,r)
{
    this.downstreamSocket.close(c,r);
}
window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
window.WebSocket.OPEN = originalWebSocket.OPEN;
window.WebSocket.CLOSING = originalWebSocket.CLOSING;
window.WebSocket.CLOSED = originalWebSocket.CLOSED;

document.addEventListener('rpc', function (msg) {
    SetDiscordActivityData(msg.detail);
});

function setActivity(activity)
{
    if (window.discordActivityData.activityType == 1)
        activity.url = window.activityUrl;
    if (window.discordActivityData.activityPartyCur != "" && window.discordActivityData.activityPartyMax != "")
        activity.party = { 
            size: [
                window.discordActivityData.activityPartyCur, 
                window.discordActivityData.activityPartyMax
            ]
        };
    if (window.discordActivityData.activityDetails)
        activity.details = window.discordActivityData.activityDetails;
    if (window.discordActivityData.activityState)
        activity.state = window.discordActivityData.activityState;
    if (window.discordActivityData.time_start)
        activity.timestamps.start = window.discordActivityData.time_start;
    if (window.discordActivityData.time_end)
        activity.timestamps.end = window.discordActivityData.time_end;
    if (window.discordActivityData.large_text)
        activity.assets.large_text = window.discordActivityData.large_text;
    if (window.discordActivityData.small_text)
        activity.assets.small_text = window.discordActivityData.small_text;
    if (window.discordActivityData.button1_text)
        activity.buttons[0] = window.discordActivityData.button1_text;
    if (window.discordActivityData.button1_url)
        activity.metadata.button_urls[0] = window.discordActivityData.button1_url;
    if (window.discordActivityData.button2_text)
        activity.buttons[1] = window.discordActivityData.button2_text;
    if (window.discordActivityData.button2_url)
        activity.metadata.button_urls[1] = window.discordActivityData.button2_url;
    window.SetDiscordActivityActiveSocket.send(JSON.stringify({
        op:3,d:{
            status: st,
            activities:[activity],
            since,
            afk
        }
    }));
}

window.discordActivityData={
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

window.SetDiscordActivitySendStatus = () => {
    if (window.SetDiscordActivityActiveSocket && window.SetDiscordActivityActiveSocket.readyState == originalWebSocket.OPEN)
    {
        if (window.discordActivityData.application_id == "0")
        {
            window.SetDiscordActivityActiveSocket.send(JSON.stringify({
                op:3,d:{
                    status: st,
                    activities:[],
                    since,
                    afk
                }
            }));
            return;
        }
        let token = null;
        try {
            token = (window.webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken();
        }
        catch (e){}
        let activity = {
            application_id: window.discordActivityData.application_id,
            type: window.discordActivityData.activityType,
            flags: 1 << 0,
            name: window.discordActivityData.activityName,
            assets: {},
            buttons: [],
            metadata: {
                button_urls: []
            },
            timestamps: {}
        };
        if (window.discordActivityData.large_image && window.discordActivityData.large_image !== "" && window.discordActivityData.small_image && window.discordActivityData.small_image !== "")
        {
            fetch('https://discord.com/api/v9/applications/' + activity.application_id + '/external-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    urls: [window.discordActivityData.large_image]
                    }),
            })
            .then(response => response.json())
            .then(data => {
                activity.assets.large_image = "mp:" + data[0].external_asset_path
                fetch('https://discord.com/api/v9/applications/' + activity.application_id  + '/external-assets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    },
                    body: JSON.stringify({
                        urls: [window.discordActivityData.small_image]
                        }),
                })
                .then(response => response.json())
                .then(data2 => {
                    activity.assets.small_image = "mp:" + data2[0].external_asset_path
                    setActivity(activity)
                });
            });
        }
        else
        {
            if (window.discordActivityData.large_image && window.discordActivityData.large_image !== "")
            {
                fetch('https://discord.com/api/v9/applications/' + activity.application_id + '/external-assets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    },
                    body: JSON.stringify({
                        urls: [window.discordActivityData.large_image]
                        }),
                })
                .then(response => response.json())
                .then(data => {
                    activity.assets.large_image = "mp:" + data[0].external_asset_path
                    setActivity(activity);
                });
            }
            else if (window.discordActivityData.small_image && window.discordActivityData.small_image !== "")
            {
                fetch('https://discord.com/api/v9/applications/' + activity.application_id  + '/external-assets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    },
                    body: JSON.stringify({
                        urls: [window.discordActivityData.small_image]
                        }),
                })
                .then(response => response.json())
                .then(data => {
                    activity.assets.small_image = "mp:" + data[0].external_asset_path
                    setActivity(activity)
                });
            }
            else 
                setActivity(activity);
        }
    }
}

function encodeString(str) 
{
    return str?str.split("\\").join("\\\\").split("\"").join("\\\"") : str
}

function SetDiscordActivityData(msg)
{
    var appId = encodeString(msg.application_id);
    if (appId == "0" && window.discordActivityData.application_id == appId)
    {
    }
    else
    {
        window.discordActivityData = {
            sendUpdate: true,
            activityType: msg.type,
            application_id: appId,
            activityName: encodeString(msg.name),
            activityUrl: encodeString(msg.streamurl),
            activityDetails: encodeString(msg.details),
            activityState: encodeString(msg.state),
            activityPartyCur: encodeString(msg.partycur),
            activityPartyMax: encodeString(msg.partymax),
            large_image: encodeString(msg.large_image),
            large_text: encodeString(msg.large_text),
            small_image: encodeString(msg.small_image),
            small_text: encodeString(msg.small_text),
            time_start: msg.time_start,
            time_end: msg.time_end,
            button1_text: encodeString(msg.button1_text),
            button1_url: encodeString(msg.button1_url),
            button2_text: encodeString(msg.button2_text),
            button2_url: encodeString(msg.button2_url),
        }
        window.SetDiscordActivitySendStatus();
    }
}