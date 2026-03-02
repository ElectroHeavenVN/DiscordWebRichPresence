const id = 'youtube';
const appId = "847682519214456862" //From https://github.com/XFG16/YouTubeDiscordPresence
var lastPlaying = false;
var lastTitle = "";
var lastchannelProfilePicture = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo() {
    if (location.pathname !== "/watch" && !location.pathname.includes("/embed/") && !location.pathname.includes("/shorts/") && location.pathname !== "/")
        return;
    var isYTShorts = location.pathname.includes("/shorts/");
    if (location.pathname !== "/watch" && !location.pathname.includes("/embed/") && !isYTShorts && !sentReset) {
        var miniPlayer = document.querySelector("#movie_player > div.ytp-miniplayer-ui");
        if (miniPlayer == null || miniPlayer.style.display == "none") {
            sendReset(id);
            return;
        }
    }
    var playing = false,
        title = "",
        elapsed = 0,
        total = 0,
        channelName = "",
        channelNameSmallText = "",
        channelLink = "",
        channelProfilePicture = "",
        videoId = "",
        isMemberOnly = false;
    if (listening) {
        if (isYTShorts)
            var shortsVideoElement = Array.from(document.querySelector("#shorts-inner-container").querySelectorAll("ytd-reel-video-renderer")).find(r => r.hasAttribute("is-active"));
        if (document.querySelector(".html5-video-player") != null)
            playing = document.querySelector(".html5-video-player#" + (isYTShorts ? "shorts-player" : "movie_player")).classList.contains("playing-mode");
        var originalTitleElement = document.querySelector("#info .title");
        if (isYTShorts && shortsVideoElement != null)
            title = shortsVideoElement.querySelector(".ytShortsVideoTitleViewModelShortsVideoTitle").innerText;
        else if (originalTitleElement != null) {
            var dearrowTitleElement = document.querySelector(".cbCustomTitle");
            if (dearrowTitleElement != null && dearrowTitleElement.style.display != "none" && dearrowTitleElement.innerText !== "")
                title = dearrowTitleElement.innerText;
            else if (originalTitleElement.style.display != "none")
                title = originalTitleElement.innerText;
        }
        var isLiveStreaming = getComputedStyle(document.querySelector(".ytp-live-badge")).display !== "none";
        var videoPlayer = document.querySelector(".html5-video-player#" + (isYTShorts ? "shorts-player" : "movie_player") + " video");
        if (videoPlayer == null)
            return;
        if (!isLiveStreaming) {
            elapsed = Math.round(videoPlayer.currentTime * 1000);
            total = Math.round(videoPlayer.duration * 1000);
            if (total == NaN || elapsed == NaN)
                return;
        }
        var videoOwner;
        if (isYTShorts) {
            videoOwner = shortsVideoElement.querySelector(".ytReelMetapanelViewModelHost");
            if (videoOwner != null) {
                channelProfilePicture = videoOwner.querySelector("img").src;
                channelLink = videoOwner.querySelector(".ytReelChannelBarViewModelHost a").href;
                channelName = channelNameSmallText = videoOwner.querySelector(".ytReelChannelBarViewModelHost a").innerText;
            }
        }
        else {
            videoOwner = document.querySelector("#owner > ytd-video-owner-renderer");
            if (videoOwner != null) {
                let isCollaboration = videoOwner.querySelector('a').href === '';
                if (isCollaboration) {
                    //TODO
                    return;
                }
                channelProfilePicture = videoOwner.querySelector("#img").src;
                channelLink = videoOwner.querySelector("#channel-name a").href;
                channelName = channelNameSmallText = videoOwner.querySelector("#channel-name a").innerText;
            }
        }
        if (isYTShorts) {
            videoId = location.pathname.substring(location.pathname.lastIndexOf('/') + 1);
            isMemberOnly = shortsVideoElement.querySelector("ytd-reel-player-overlay-renderer #badge svg") != null;
        }
        else {
            if (document.querySelector("#content > #page-manager> ytd-watch-flexy") == null)
                return;
            videoId = document.querySelector("#content > #page-manager> ytd-watch-flexy").getAttribute("video-id");
            isMemberOnly = document.querySelector("#below > ytd-watch-metadata ytd-badge-supported-renderer .yt-badge-shape--membership") != null;
        }
    }
    if (lastPlaying !== playing || lastTitle !== title || channelProfilePicture !== lastchannelProfilePicture || (!isLiveStreaming && playing && Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000)) {
        sentReset = false;
        lastPlaying = playing;
        lastTitle = title;
        lastchannelProfilePicture = channelProfilePicture;
        var timeEnd = 0;
        if (!isLiveStreaming && Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000 && playing) {
            timeEnd = Date.now() - elapsed + total;
            lastTimeStamp = Date.now() - elapsed;
        }
        else
            lastTimeStamp = Date.now();
        var largeText = "";
        if (isMemberOnly)
            largeText = "Members only";
        let videoLink = "https://www.youtube.com/" + (isYTShorts ? "shorts/" : "watch?v=") + videoId;
        data = {
            applicationId: appId,
            type: ActivityType.Watching,
            name: "YouTube" + (isYTShorts ? " Shorts" : ""),
            details: title,
            detailsUrl: videoLink,
            state: channelName,
            stateUrl: channelLink,
            timeEnd: timeEnd,
            timeStart: lastTimeStamp,
            largeImage: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
            largeText: largeText,
            largeUrl: videoLink,
            smallImage: channelProfilePicture,
            smallText: channelNameSmallText,
            smallUrl: channelLink,
            button1Text: isLiveStreaming ? "Watch livestream on YouTube" : "Watch video on YouTube" + (isYTShorts ? " Shorts" : ""),
            button1Url: videoLink,
            button2Text: "View channel",
            button2Url: channelLink,
        };
        if (!playing) {
            data.smallImage = SmallIcons.paused;
            data.smallText = "Paused";
            data.smallUrl = undefined;
            data.timeStart = undefined;
            data.timeEnd = undefined;
        }
        sendStatus(id);
    }
}