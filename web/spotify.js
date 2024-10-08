const id = 'spotify';
var lastPlaying = false;
var lastSongName = "";
var lastTimeStamp = 0;
var sentReset = false;
var accessTokenObject = null;
var albumInfos = [];

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

async function RefreshAccessToken() {
    if (accessTokenObject !== null && Date.now() < accessTokenObject.accessTokenExpirationTimestampMs)
        return;
    accessTokenObject = await (await fetch('/get_access_token?reason=transport&productType=web_player')).json();
}

async function FetchAlbumInfo(albumID) {
    if (albumInfos[albumID])
        return albumInfos[albumID];
    await RefreshAccessToken();
    var result = await (await fetch('https://api.spotify.com/v1/albums/' + albumID, {
        method: 'GET',
        withCredentials: true,
        headers: {
            'Authorization': 'Bearer ' + accessTokenObject.accessToken,
            'Content-Type': 'application/json'
        }
    })).json();
    albumInfos[albumID] = result;
    return result;
}

function refreshInfo() {
    if (!listening)
        return;
    let playing = false,
        songName = "",
        songID = "",
        artists = [],
        artistIDs = [],
        albumID = "",
        artworkID = "";
    songName = document.querySelector('[data-testid="now-playing-bar"] [dir="auto"]:first-child a').innerText;
    albumID = document.querySelector('[data-testid="now-playing-bar"] [dir="auto"]:first-child a').href.split('/').pop();

    songID = document.querySelector('[data-testid="context-link"]').href.split('%3A').pop();

    artists = Array.from(document.querySelector('[data-testid="context-item-info-subtitles"]').children).map(a => a.innerText);
    artistIDs = Array.from(document.querySelector('[data-testid="context-item-info-subtitles"]').children).map(a => a.children[0].href.split('/').pop());
    artworkID = document.querySelector('[data-testid="cover-art-image"]').src.split('/').pop();
    var progressBar = document.querySelector('div[data-testid="playback-progressbar"] input');
    progressBar.step = 1;
    var timePassed = Number(progressBar.value);
    var duration = Number(progressBar.max);
    playing = document.querySelector('button[data-testid="control-button-playpause"] path').getAttribute('d') === "M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z";
    if (lastPlaying !== playing || lastSongName !== songName || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
        lastPlaying = playing;
        lastSongName = songName;
        lastTimeStamp = Date.now() - timePassed;
        if (playing) {
            FetchAlbumInfo(albumID).then(albumInfo => {
                data = {
                    type: ActivityType.Listening,
                    flags: ActivityFlags.Sync | ActivityFlags.Play,
                    name: "Spotify",
                    details: songName,
                    state: artists.join(''),
                    largeImage: 'spotify:' + artworkID,
                    largeText: albumInfo.name,
                    timeStart: lastTimeStamp,
                    timeEnd: Date.now() - timePassed + duration,
                    button1Text: "Listen on Spotify",
                    button1Url: "https://open.spotify.com/track/" + songID,
                    contextUri: "https://open.spotify.com/track/" + songID,
                    syncID: songID,
                    albumID: albumID,
                    artistIDs: artistIDs,
                    metadataType: "track",
                };
                sentReset = false;
                setTimeout(() => {
                    browser.runtime.sendMessage({
                        id,
                        status: data
                    });
                }, 10);
            });
        } else if (!sentReset) {
            data = false;
            try {
                browser.runtime.sendMessage({
                    id,
                    action: "reset"
                });
                sentReset = true;
            } catch (e) { }
        }
    }
}