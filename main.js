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
            extEnabled: masterSwitch.checked,
            enabled: Array.from(dependentSwitches).map(s => s.checked)
        });
    }

    const savedMasterSwitchState = localStorage.getItem('enableWebRichPresence');
    if (savedMasterSwitchState !== null) {
        masterSwitch.checked = savedMasterSwitchState === 'true';
        if (masterSwitch.checked)
            settingsImg.style.display = "";
    }
    dependentSwitches.forEach((dependentSwitch, index) => {
        dependentSwitch.disabled = !masterSwitch.checked;
        dependentSwitch.closest('.switch').classList.toggle('disabled', dependentSwitch.disabled);
        dependentSwitch.addEventListener('change', () => {
            localStorage.setItem(`switch${index}`, dependentSwitch.checked);
            sendUpdate();
        });
        const savedDependentSwitchState = localStorage.getItem(`switch${index}`);
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