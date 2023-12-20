
if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', function() {
    const masterSwitch = document.getElementById('masterSwitch');
    const dependentSwitches = document.querySelectorAll('.dependent-switch');
    function sendUpdate()
    {
        browser.runtime.sendMessage({
            action: "updateStatus",
            extEnabled: masterSwitch.checked,
            enabled: Array.from(dependentSwitches).map(s => s.checked)
        });
    }
    masterSwitch.addEventListener('change', function() {
        dependentSwitches.forEach(switchElem => {
            switchElem.disabled = !masterSwitch.checked;
            switchElem.closest('.switch').classList.toggle('disabled', switchElem.disabled);
        });
        localStorage.setItem('enableWebStatus', masterSwitch.checked);
        sendUpdate();
    });
    const savedMasterSwitchState = localStorage.getItem('enableWebStatus');
    if (savedMasterSwitchState !== null) {
        masterSwitch.checked = savedMasterSwitchState === 'true';
        masterSwitch.dispatchEvent(new Event('change'));
    }
    dependentSwitches.forEach((dependentSwitch, index) => {
        dependentSwitch.addEventListener('change', function() {
            localStorage.setItem(`switch${index}`, dependentSwitch.checked);
            sendUpdate();
        });
        const savedDependentSwitchState = localStorage.getItem(`switch${index}`);
        if (savedDependentSwitchState !== null) {
            dependentSwitch.checked = savedDependentSwitchState === 'true';
        }
    });
    const event = new Event('change');
    masterSwitch.dispatchEvent(event);
    sendUpdate();
});