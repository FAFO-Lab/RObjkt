chrome.storage.local.get({ isEnabled: true, refWallet: "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ" }, (data) => {
    if (!data.isEnabled) return;

    function updateURL() {
        let url = new URL(window.location.href);
        if (!url.searchParams.has("ref") || url.searchParams.get("ref") !== data.refWallet) {
            url.searchParams.set("ref", data.refWallet);
            window.history.replaceState({}, "", url.toString());
        }
    }

    updateURL();
    const observer = new MutationObserver(updateURL);
    observer.observe(document.body, { childList: true, subtree: true });
});
