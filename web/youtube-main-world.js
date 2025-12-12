(() => {
    document.addEventListener('getYtInitialData', function () {
        let event = new CustomEvent('ytInitialDataResponse', { detail: window.ytInitialData });
        document.dispatchEvent(event);
    });
})();