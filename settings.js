if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    const statusDisplayTypeSelect = document.getElementById('status-display-type-select');
    const platformSelect = document.getElementById('platform-select');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
            statusDisplayType: parseInt(statusDisplayTypeSelect.value),
            platform: platformSelect.value
        });
    }
    backImg.addEventListener('click', () => {
        history.back();
    })
    const enableJoinButtonSwitchState = localStorage.getItem('enableJoinButton');
    if (enableJoinButtonSwitchState !== null) {
        enableJoinButtonSwitch.checked = enableJoinButtonSwitchState === 'true';
    }
    const statusDisplayTypeState = localStorage.getItem('statusDisplayType');
    if (statusDisplayTypeState !== null) {
        statusDisplayTypeSelect.value = statusDisplayTypeState;
    }
    const platformState = localStorage.getItem('platform');
    if (platformState !== null) {
        platformSelect.value = platformState;
    }
    statusDisplayTypeSelect.addEventListener('change', () => {
        localStorage.setItem('statusDisplayType', statusDisplayTypeSelect.value);
        sendUpdate();
    })
    platformSelect.addEventListener('change', () => {
        localStorage.setItem('platform', platformSelect.value);
        sendUpdate();
    })
});