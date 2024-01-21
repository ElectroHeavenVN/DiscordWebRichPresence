if (typeof browser === "undefined") {
    var browser = chrome;
}

const ActivityType = {
    Game: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3,
    Custom: 4,
    Competing: 5
};

const ActivityFlags = {
	Instance: 1 << 0,
	Join: 1 << 1,
	Spectate: 1 << 2,
	JoinRequest: 1 << 3,
	Sync: 1 << 4,
	Play: 1 << 5,
	PartyPrivacyFriends: 1 << 6,
	PartyPrivacyVoiceChannel: 1 << 7,
	Embedded: 1 << 8,
}

var currentPresence = null;

function sendUpdate() {
    browser.runtime.sendMessage({
        action: "updateEnabledStatus",
        enabled: masterSwitch.checked,
        state: Array.from(document.querySelectorAll('.dependent-switch')).map(function (s) {
            return {
                id: s.id.replace('sw-', ''),
                enabled: s.checked
            }
        })
    });
}

function convertMillisecondsToHHMMSS(milliseconds) {
    var totalSeconds = Math.floor(milliseconds / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var formattedTime = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    if (hours > 0)
        formattedTime = hours.toString().padStart(2, '0') + ':' + formattedTime;
    return formattedTime;
}

function getStatusStr(type) {
    switch (type) {
        case ActivityType.Game:
            return 'Playing';
        case ActivityType.Streaming:
            return 'Streaming';
        case ActivityType.Listening:
            return 'Listening to';
        case ActivityType.Watching:
            return 'Watching';
        case ActivityType.Competing:
            return 'Competing in';
    }
    return '';
}

function updateCurrentPresence() {
    const currentPresencePanel = document.querySelector(".current-presence-panel");
    currentPresencePanel.hidden = currentPresence == null;
    if (currentPresencePanel.hidden) {
        document.querySelector(".switches-container").style.maxHeight = "420px";
        return;
    }
    document.querySelector(".switches-container").style.maxHeight = "160px";
    const title = currentPresencePanel.querySelector(".title");
    const largeImage = currentPresencePanel.querySelector(".image > img:first-child");
    const smallImage = currentPresencePanel.querySelector(".image > img:last-child");
    const details = currentPresencePanel.querySelector(".current-presence-details");
    const state = currentPresencePanel.querySelector(".current-presence-state");
    const largeText = currentPresencePanel.querySelector(".current-presence-large-text");
    const buttons = currentPresencePanel.querySelector(".buttons").children;

    if (currentPresence.name) {
        title.hidden = false;
        title.innerText = getStatusStr(currentPresence.type) + ' ' + currentPresence.name;
        title.title = currentPresence.name;
    }
    else
        title.hidden = true;
    if (currentPresence.details) {
        details.hidden = false;
        details.innerText = details.title = currentPresence.details;
    }
    else
        details.hidden = true;
    if (currentPresence.state) {
        state.hidden = false;
        state.innerText = state.title = currentPresence.state;
    }
    else
        state.hidden = true;
    if (currentPresence.largeText) {
        largeText.hidden = false;
        largeImage.title = largeText.innerText = largeText.title = currentPresence.largeText;
    }
    else {
        largeText.hidden = true;
        largeImage.title = '';
    }

    if (currentPresence.largeImage) {
        largeImage.hidden = false;
        largeImage.src = currentPresence.largeImage;
    }
    else
        largeImage.hidden = true;

    if (currentPresence.smallText)
        smallImage.title = currentPresence.smallText;
    else
        smallImage.title = '';
    if (currentPresence.smallImage) {
        smallImage.hidden = false;
        smallImage.src = currentPresence.smallImage;
    }
    else
        smallImage.hidden = true;

    if (currentPresence.button1Text) {
        buttons[1].hidden = false;
        buttons[1].innerText = currentPresence.button1Text;
    }
    else
        buttons[1].hidden = true;
    if (currentPresence.button2Text) {
        buttons[2].hidden = false;
        buttons[2].innerText = currentPresence.button2Text;
    }
    else
        buttons[2].hidden = true;
    buttons[0].hidden = (currentPresence.flags & ActivityFlags.Embedded) != ActivityFlags.Embedded;
    updateTimeBar();
}

function updateTimeBar() {
    if (currentPresence) {
        const currentPresencePanel = document.querySelector(".current-presence-panel");
        const timeBar = currentPresencePanel.querySelector(".timebar");
        const timeElapsed = timeBar.querySelector("label.timeElapsed");
        const timeTotal = timeBar.querySelector("label.timeTotal");
        const timeBarInner = timeBar.querySelector("div:nth-child(1) > div");

        if (currentPresence.timeStart && currentPresence.timeEnd) {
            timeBar.hidden = false;
            var elapsed = Date.now() - currentPresence.timeStart;
            var total = currentPresence.timeEnd - currentPresence.timeStart;
            if (elapsed > total)
                elapsed = total;
            var oldTimeElapsed = timeElapsed.innerText;
            timeElapsed.innerText = convertMillisecondsToHHMMSS(elapsed);
            timeTotal.innerText = convertMillisecondsToHHMMSS(total);
            if (oldTimeElapsed !== timeElapsed.innerText)
                timeBarInner.style.width = (elapsed * 100 / total).toString() + '%';
        }
        else
            timeBar.hidden = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const masterSwitch = document.getElementById('masterSwitch');
    const dependentSwitches = document.querySelectorAll('.dependent-switch');
    const resetButton = document.getElementById("resetButton");
    const settingsImg = document.getElementById("settingsImg");
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
    resetButton.addEventListener('click', () => browser.runtime.sendMessage({
        action: "reset"
    }));
    settingsImg.addEventListener('click', () => window.location.href = "settings.html");
    setInterval(() => browser.runtime.sendMessage({
        action: "getCurrentPresence"
    }), 1000);
    browser.runtime.sendMessage({
        action: "getCurrentPresence"
    });
    setInterval(updateTimeBar, 500);
    document.querySelector(".current-presence-panel .buttons > button:nth-child(2)").addEventListener('click', () => window.open(currentPresence.button1Url, '_blank'))
    document.querySelector(".current-presence-panel .buttons > button:nth-child(3)").addEventListener('click', () => window.open(currentPresence.button2Url, '_blank'))
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== undefined) {
        switch (request.action) {
            case 'currentPresence':
                currentPresence = request.data;
                updateCurrentPresence();
                break;
            default:
                break;
        }
    }
});