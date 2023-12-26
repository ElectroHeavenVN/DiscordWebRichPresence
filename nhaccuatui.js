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
		if (audioPlayers.length == 0)
			return;
		let elapsed = Math.round(audioPlayers[0].currentTime * 1000);
		let total = Math.round(audioPlayers[0].duration * 1000);
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
		if (lastPlaying !== playing || lastSong !== title || Math.abs(Date.now() - lastTimeStamp - elapsed) >= 1000) {
			lastPlaying = playing;
			lastSong = title;
			lastTimeStamp = Date.now() - elapsed;
			if (playing) {
				data = {
					applicationId: appId,
					dontSave: true,
					type: ActivityType.Listening,
					name: "NhacCuaTui",
					details: title,
					state: "bởi " + songAuthors,
					largeImage: artworkLink,
					timeStart: lastTimeStamp,
					timeEnd: Date.now() - elapsed + total,
					button1Text: "Nghe trên NhacCuaTui",
					button1Url: songLink,
				};
				sentReset = false;
				setTimeout(() => {
					browser.runtime.sendMessage({
						id,
						status: data
					});
				}, 10);
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
}