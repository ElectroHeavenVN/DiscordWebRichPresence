if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    const delayOtherActivities = document.getElementById('delay-other-activities-switch');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
            delayOtherActivities: delayOtherActivities.checked
        });
    }
    backImg.addEventListener('click', () => {
        history.back();
    })
    const enableJoinButtonSwitchState = localStorage.getItem('enableJoinButton');
    if (enableJoinButtonSwitchState !== null) {
        enableJoinButtonSwitch.checked = enableJoinButtonSwitchState === 'true';
    }
    const delayOtherActivitiesState = localStorage.getItem('delayOtherActivities');
    if (delayOtherActivitiesState !== null) {
        delayOtherActivities.checked = delayOtherActivitiesState === 'true';
    }
    enableJoinButtonSwitch.addEventListener('change', () => {
        localStorage.setItem('enableJoinButton', enableJoinButtonSwitch.checked);
        sendUpdate();
    })
    delayOtherActivities.addEventListener('change', () => {
        localStorage.setItem('delayOtherActivities', delayOtherActivities.checked);
        sendUpdate();
    })
});