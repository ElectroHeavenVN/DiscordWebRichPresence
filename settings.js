if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    const statusDisplayTypeSelect = document.getElementById('status-display-type-select');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
            statusDisplayType: parseInt(statusDisplayTypeSelect.value)
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
    statusDisplayTypeSelect.addEventListener('change', () => {
        localStorage.setItem('statusDisplayType', statusDisplayTypeSelect.value);
        sendUpdate();
    })
});