if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
        });
    }
    backImg.addEventListener('click', () => {
        history.back();
    })
    const enableJoinButtonSwitchState = localStorage.getItem('enableJoinButton');
    if (enableJoinButtonSwitchState !== null) {
        enableJoinButtonSwitch.checked = enableJoinButtonSwitchState === 'true';
    }
    enableJoinButtonSwitch.addEventListener('change', () => {
        localStorage.setItem('enableJoinButton', enableJoinButtonSwitch.checked);
        sendUpdate();
    })
});