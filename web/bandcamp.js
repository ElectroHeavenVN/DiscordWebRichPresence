const id = 'bandcamp';
const appId = "1256165440909213777";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var resetSent = false;

function refreshInfo()
{
    if (!listening)
        return;
    let playing = false,
        song = "",
        songLink = "",
        songAuthor = "",
        songAuthorProfilePic = "",
        songAuthorLink = "",
        artworkLink = "";
    var audioElem = document.querySelector("audio");
    if (!audioElem)
        return; 
    var timePassed = audioElem.currentTime * 1000;
    var duration = audioElem.duration * 1000;
    playing = !audioElem.paused;
    song = document.querySelector('.trackTitle').innerText;
    songLink = document.querySelector('.title_link.primaryText').href;
    songAuthor = document.querySelector(".albumTitle span").innerText;
    songAuthorProfilePic = document.querySelector(".artists-bio-pic a").href;
    songAuthorLink = document.querySelector(".albumTitle span a").href;
    artworkLink = document.querySelector("#tralbumArt a").href;
    if (lastPlaying !== playing || lastSong !== song || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
        lastPlaying = playing;
        lastSong = song;
        lastTimeStamp = Date.now() - timePassed;
        if (!playing) {
            sendReset(id);
            return;
        }
        data = {
            applicationId: appId,
            type: ActivityType.Listening,
            name: "Bandcamp",
            details: song,
            detailsUrl: songLink,
            state: songAuthor,
            stateUrl: songAuthorLink,
            largeImage: artworkLink,
            largeUrl: songLink,
            smallImage: songAuthorProfilePic,
            smallText: songAuthor,
            smallUrl: songAuthorLink,
            timeStart: lastTimeStamp,
            timeEnd: Date.now() - timePassed + duration,
            button1Text: "Listen on Bandcamp",
            button1Url: songLink,
            button2Text: "View artist",
            button2Url: songAuthorLink,
        };
        sendStatus(id);
    }
}