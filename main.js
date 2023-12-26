if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const masterSwitch = document.getElementById('masterSwitch');
    const dependentSwitches = document.querySelectorAll('.dependent-switch');
    const resetButton = document.getElementById("resetButton");
    const settingsImg = document.getElementById("settingsImg");

    function sendUpdate() {
        browser.runtime.sendMessage({
            action: "updateEnabledStatus",
            enabled: masterSwitch.checked,
            state: Array.from(dependentSwitches).map(function (s) {
                return {
                    id: s.id.replace('sw-', ''),
                    enabled: s.checked
                }
            })
        });
    }

    const savedMasterSwitchState = localStorage.getItem('enableWebRichPresence');
    if (savedMasterSwitchState !== null) {
        masterSwitch.checked = savedMasterSwitchState === 'true';
        if (masterSwitch.checked)
            settingsImg.style.display = "";
    }
    dependentSwitches.forEach(dependentSwitch => {
        dependentSwitch.disabled = !masterSwitch.checked;
        dependentSwitch.closest('.switch').classList.toggle('disabled', dependentSwitch.disabled);
        dependentSwitch.addEventListener('change', () => {
            localStorage.setItem(dependentSwitch.id, dependentSwitch.checked);
            sendUpdate();
        });
        const savedDependentSwitchState = localStorage.getItem(dependentSwitch.id);
        if (savedDependentSwitchState !== null) {
            dependentSwitch.checked = savedDependentSwitchState === 'true';
        }
    });
    masterSwitch.addEventListener('change', () => {
        if (masterSwitch.checked)
            settingsImg.style.display = "";
        else
            settingsImg.style.display = "none";
        dependentSwitches.forEach(switchElem => {
            switchElem.disabled = !masterSwitch.checked;
            switchElem.closest('.switch').classList.toggle('disabled', switchElem.disabled);
        });
        localStorage.setItem('enableWebRichPresence', masterSwitch.checked);
        sendUpdate();
    });
    resetButton.addEventListener('click', () => {
        browser.runtime.sendMessage({
            action: "reset"
        });
    });
    settingsImg.addEventListener('click', () => {
        window.location.href = "settings.html";
    })
});