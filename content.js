import { DEFAULT_WALLET } from "./config";
chrome.storage.local.get({ isEnabled: false, isPassive: true, refWallet: DEFAULT_WALLET }, (data) => {
    console.log("Extension Loaded with Settings:", data);
    if (!data.isEnabled) return;

    function updateURL() {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");

        if (data.isPassive) {
            // ✅ Passive Mode ON: Only set ref if it's completely absent
            if (!currentRef) {
                console.log("No existing ref detected. Setting ref to:", data.refWallet);
                url.searchParams.set("ref", data.refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        } else {
            // ✅ Passive Mode OFF: Always set ref, overwriting any existing one
            if (!currentRef || currentRef !== data.refWallet) {
                console.log("Overwriting ref with:", data.refWallet);
                url.searchParams.set("ref", data.refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        }
    }

    updateURL();
    const observer = new MutationObserver(() => {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");

        if (data.isPassive) {
            if (!currentRef) {
                console.log("SPA Navigation Detected: No existing ref, setting ref to:", data.refWallet);
                url.searchParams.set("ref", data.refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        } else {
            if (!currentRef || currentRef !== data.refWallet) {
                console.log("SPA Navigation Detected: Overwriting ref with:", data.refWallet);
                url.searchParams.set("ref", data.refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
