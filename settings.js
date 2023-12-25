if (typeof browser === "undefined") {
    var browser = chrome;
}


document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    const enableSpotifyButtonsSwitch = document.getElementById('enable-spotify-buttons-switch');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
            enableSpotifyButtons: enableSpotifyButtonsSwitch.checked
        });
    }
    backImg.addEventListener('click', () => {
        history.back();
    })
    const enableJoinButtonSwitchState = localStorage.getItem('enableJoinButton');
    if (enableJoinButtonSwitchState !== null) {
        enableJoinButtonSwitch.checked = enableJoinButtonSwitchState === 'true';
    }
    const enableSpotifyButtonsSwitchState = localStorage.getItem('enableSpotifyButtons');
    if (enableSpotifyButtonsSwitchState !== null) {
        enableSpotifyButtonsSwitch.checked = enableSpotifyButtonsSwitchState === 'true';
    }
    enableJoinButtonSwitch.addEventListener('change', () => {
        localStorage.setItem('enableJoinButton', enableJoinButtonSwitch.checked);
        sendUpdate();
    })
    enableSpotifyButtonsSwitch.addEventListener('change', () => {
        localStorage.setItem('enableSpotifyButtons', enableSpotifyButtonsSwitch.checked);
        sendUpdate();
    })
});