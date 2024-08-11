if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const backImg = document.getElementById('backImg');
    const enableJoinButtonSwitch = document.getElementById('enable-join-button-switch');
    const changeListeningToSpButtonSwitch = document.getElementById('change-listening-to-sp-switch');
    const delayOtherActivities = document.getElementById('delay-other-activities-switch');
    
    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateSettings",
            enableJoinButton: enableJoinButtonSwitch.checked,
            changeListeningToSp: changeListeningToSpButtonSwitch.checked,
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
    const changeListeningToSpButtonSwitchState = localStorage.getItem('changeListeningToSp');
    if (changeListeningToSpButtonSwitchState !== null) {
        changeListeningToSpButtonSwitch.checked = changeListeningToSpButtonSwitchState === 'true';
    }
    const delayOtherActivitiesState = localStorage.getItem('delayOtherActivities');
    if (delayOtherActivitiesState !== null) {
        delayOtherActivities.checked = delayOtherActivitiesState === 'true';
    }
    enableJoinButtonSwitch.addEventListener('change', () => {
        localStorage.setItem('enableJoinButton', enableJoinButtonSwitch.checked);
        sendUpdate();
    })
    changeListeningToSpButtonSwitch.addEventListener('change', () => {
        localStorage.setItem('changeListeningToSp', changeListeningToSpButtonSwitch.checked);
        sendUpdate();
    })
    delayOtherActivities.addEventListener('change', () => {
        localStorage.setItem('delayOtherActivities', delayOtherActivities.checked);
        sendUpdate();
    })
});