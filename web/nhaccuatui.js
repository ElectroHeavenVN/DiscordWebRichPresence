const id = 'nhaccuatui';
const appId = "1186960720424878132";
var lastPlaying = false;
var lastSong = "";
var lastTimeStamp = 0;
var sentReset = false;

function refreshInfo() {
	if (listening) {
		let playing = false,
			title = "",
			songLink = "",
			songAuthors = "",
			artworkLink = "";
		var audioPlayers = document.getElementsByTagName('audio');
		if (audioPlayers.length === 0) {
			if (!sentReset) {
				data = false;
				try {
					browser.runtime.sendMessage({
						id,
						action: "reset"
					});
					sentReset = true;
				} catch (e) { }
			}
			return;
		}
		let timePassed = Math.round(audioPlayers[0].currentTime * 1000);
		let duration = Math.round(audioPlayers[0].duration * 1000);
		if (document.querySelector("#flashPlayer") != null) {
			playing = !audioPlayers[0].paused;
			title = document.querySelector("#box_playing_id > div.info_name_songmv.playerwapper-song > div.name_title > h1").innerText;
			songLink = document.head.querySelector('meta[property="og:url"]').content;
			songAuthors = document.querySelector("#box_playing_id > div.info_name_songmv.playerwapper-song > div.name_title > h2").innerText;
			artworkLink = document.querySelector("#coverImageflashPlayer").style.backgroundImage;
			if (artworkLink === "")
				artworkLink = 'https://stc-id.nixcdn.com/v11/html5/nct-player-mp3/images/default_inner_player_80.png';
			else
				artworkLink = artworkLink.substring(5, artworkLink.length - 2);
		}
		if (lastPlaying !== playing || lastSong !== title || (playing && Math.abs(Date.now() - lastTimeStamp - timePassed) >= 1000)) {
			lastPlaying = playing;
			lastSong = title;
			var timeEnd = 0;
			if (playing)
				timeEnd = Date.now() - timePassed + duration;
			lastTimeStamp = Date.now() - timePassed;
			data = {
				applicationId: appId,
				type: ActivityType.Listening,
				name: "NhacCuaTui",
				details: title,
				state: songAuthors,
				largeImage: artworkLink,
				timeStart: lastTimeStamp,
				timeEnd: timeEnd,
				button1Text: "Nghe trên NhacCuaTui",
				button1Url: songLink,
			};
			if (!playing) {
				data.smallImage = SmallIcons.paused;
				data.smallText = "Paused";
				data.timeStart = undefined;
                data.timeEnd = undefined;
			}
			else {
				data.smallImage = SmallIcons.playing;
				data.smallText = "Playing";
			}
			sentReset = false;
			setTimeout(() => {
				browser.runtime.sendMessage({
					id,
					status: data
				});
			}, 10);
		}
	}
}