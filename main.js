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

var currentActivities = [];
var currentIndex = 0;

function SendUpdate() {
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

function FormatMilliseconds(milliseconds) {
    var totalSeconds = Math.floor(milliseconds / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var formattedTime = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    if (hours > 0)
        formattedTime = hours.toString().padStart(2, '0') + ':' + formattedTime;
    return formattedTime;
}

function GetStatusStr(type) {
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

function UpdateCurrentActivities() {
    const previousButton = document.querySelector(".previous-activity-button");
    const nextButton = document.querySelector(".next-activity-button");
    const ratioLabel = document.querySelector(".select-activity-buttons-container label");

    if (currentActivities.length <= 1) {
        previousButton.disabled = true;
        nextButton.disabled = true;
    }
    else {
        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === currentActivities.length - 1;
    }
    if (currentIndex >= currentActivities.length)
        currentIndex = currentActivities.length - 1;
    if (currentIndex < 0)
        currentIndex = 0;
    ratioLabel.innerText = (currentIndex + 1) + '/' + currentActivities.length;
    var displayedActivity = currentActivities[currentIndex] ? currentActivities[currentIndex].activity : null;
    const currentActivityPanel = document.querySelector(".current-activity-panel");
    currentActivityPanel.hidden = displayedActivity == null;
    if (currentActivityPanel.hidden) {
        document.querySelector(".switches-container").style.maxHeight = "420px";
        return;
    }
    document.querySelector(".switches-container").style.maxHeight = "160px";
    const title = currentActivityPanel.querySelector(".title");
    const largeImage = currentActivityPanel.querySelector(".image > img:first-child");
    const smallImage = currentActivityPanel.querySelector(".image > img:last-child");
    const details = currentActivityPanel.querySelector(".current-activity-details");
    const state = currentActivityPanel.querySelector(".current-activity-state");
    const largeText = currentActivityPanel.querySelector(".current-activity-large-text");
    const buttons = currentActivityPanel.querySelector(".buttons").children;
    if (displayedActivity.name) {
        title.hidden = false;
        title.innerText = GetStatusStr(displayedActivity.type) + ' ' + displayedActivity.name;
        title.title = displayedActivity.name;
    }
    else
        title.hidden = true;
    if (displayedActivity.details) {
        details.hidden = false;
        details.innerText = details.title = displayedActivity.details;
    }
    else
        details.hidden = true;
    if (displayedActivity.state) {
        state.hidden = false;
        state.innerText = state.title = displayedActivity.state;
    }
    else
        state.hidden = true;
    if (displayedActivity.largeText) {
        largeText.hidden = false;
        largeImage.title = largeText.innerText = largeText.title = displayedActivity.largeText;
    }
    else {
        largeText.hidden = true;
        largeImage.title = '';
    }

    if (displayedActivity.largeImage) {
        largeImage.hidden = false;
        largeImage.src = displayedActivity.largeImage;
        if (displayedActivity.largeImage.startsWith('spotify:'))
            largeImage.src = 'https://i.scdn.co/image/' + displayedActivity.largeImage.split(':')[1];
    }
    else
        largeImage.hidden = true;

    if (displayedActivity.smallText)
        smallImage.title = displayedActivity.smallText;
    else
        smallImage.title = '';
    if (displayedActivity.smallImage) {
        smallImage.hidden = false;
        smallImage.src = displayedActivity.smallImage;
        if (displayedActivity.smallImage.startsWith('spotify:'))
            smallImage.src = 'https://i.scdn.co/image/' + displayedActivity.smallImage.split(':')[1];
    }
    else
        smallImage.hidden = true;

    if (displayedActivity.button1Text) {
        buttons[1].hidden = false;
        buttons[1].innerText = displayedActivity.button1Text;
    }
    else
        buttons[1].hidden = true;
    if (displayedActivity.button2Text) {
        buttons[2].hidden = false;
        buttons[2].innerText = displayedActivity.button2Text;
    }
    else
        buttons[2].hidden = true;
    buttons[0].hidden = (displayedActivity.flags & ActivityFlags.Embedded) != ActivityFlags.Embedded;
    UpdateTimeBar(displayedActivity);
}

function UpdateTimeBar(displayedActivity) {
    if (displayedActivity) {
        const currentActivityPanel = document.querySelector(".current-activity-panel");
        const timeBar = currentActivityPanel.querySelector(".timebar");
        const timeElapsed = timeBar.querySelector("label.timeElapsed");
        const timeTotal = timeBar.querySelector("label.timeTotal");
        const timeBarInner = timeBar.querySelector("div:nth-child(1) > div");

        if (displayedActivity.timeStart && displayedActivity.timeEnd) {
            timeBar.hidden = false;
            var elapsed = Date.now() - displayedActivity.timeStart;
            var total = displayedActivity.timeEnd - displayedActivity.timeStart;
            if (elapsed > total)
                elapsed = total;
            var oldTimeElapsed = timeElapsed.innerText;
            timeElapsed.innerText = FormatMilliseconds(elapsed);
            timeTotal.innerText = FormatMilliseconds(total);
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
    const previousButton = document.querySelector(".previous-activity-button");
    const nextButton = document.querySelector(".next-activity-button");
    const savedMasterSwitchState = localStorage.getItem('enableWebRichPresence');

    if (savedMasterSwitchState !== null) {
        masterSwitch.checked = savedMasterSwitchState === 'true';
        if (masterSwitch.checked)
            settingsImg.style.display = "";
    }
    dependentSwitches.forEach(dependentSwitch => {
        if (dependentSwitch.id === 'sw-aniwatch') {
            dependentSwitch.disabled = true;
            dependentSwitch.checked = false;
            dependentSwitch.closest('.switch').classList.toggle('disabled', true);
            return;
        }
        dependentSwitch.disabled = !masterSwitch.checked;
        dependentSwitch.closest('.switch').classList.toggle('disabled', dependentSwitch.disabled);
        dependentSwitch.addEventListener('change', () => {
            localStorage.setItem(dependentSwitch.id, dependentSwitch.checked);
            SendUpdate();
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
            if (switchElem.id === 'sw-aniwatch') {
                switchElem.disabled = true;
                switchElem.checked = false;
                switchElem.closest('.switch').classList.toggle('disabled', true);
                return;
            }
            switchElem.disabled = !masterSwitch.checked;
            switchElem.closest('.switch').classList.toggle('disabled', switchElem.disabled);
        });
        localStorage.setItem('enableWebRichPresence', masterSwitch.checked);
        SendUpdate();
    });
    resetButton.addEventListener('click', () => browser.runtime.sendMessage({
        action: "reset"
    }));
    settingsImg.addEventListener('click', () => window.location.href = "settings.html");
    previousButton.addEventListener('click', () => {
        if (currentIndex > 0)
            currentIndex--;
        UpdateCurrentActivities();
    });
    nextButton.addEventListener('click', () => {
        if (currentIndex < currentActivities.length - 1)
            currentIndex++;
        UpdateCurrentActivities();
    });
    setInterval(() => browser.runtime.sendMessage({
        action: "getCurrentActivities"
    }), 1000);
    browser.runtime.sendMessage({
        action: "getCurrentActivities"
    });
    setInterval(UpdateTimeBar, 500);
    document.querySelector(".current-activity-panel .buttons > button:nth-child(2)").addEventListener('click', () => {
        var displayedActivity = currentActivities[currentIndex] ? currentActivities[currentIndex].activity : null;
        if (displayedActivity)
            window.open(displayedActivity.button1Url, '_blank');
    })
    document.querySelector(".current-activity-panel .buttons > button:nth-child(3)").addEventListener('click', () => {
        var displayedActivity = currentActivities[currentIndex] ? currentActivities[currentIndex].activity : null;
        if (displayedActivity)
            window.open(displayedActivity.button2Url, '_blank');
    });
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== undefined) {
        switch (request.action) {
            case 'currentActivities':
                currentActivities = request.data;
                UpdateCurrentActivities();
                break;
            default:
                break;
        }
    }
});