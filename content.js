/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    const isEnabled = data.isEnabled ?? false;
    const isPassive = data.isPassive ?? true;
    const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet

    console.log("Extension Loaded with Settings:", { isEnabled, isPassive, refWallet });

    if (!isEnabled) return;

    /**
     * Modifies the current URL to include the referral parameter.
     * Requests a page reload if necessary.
     *
     * @param {boolean} [forceReload=false] - Whether to force a page reload if the URL is modified.
     */
    function updateURL() {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");

        if (isPassive) {
            if (!currentRef) {
                console.log("No existing ref detected. Setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                window.history.replaceState({}, "", url.toString());
            }
        }

        chrome.runtime.sendMessage({ type: "reloadPage" });
    }

    updateURL();

    /**
     * Observes the document for changes to detect soft navigations (React SPAs, Next.js, Vue, etc.).
     * Ensures referral parameters persist after client-side navigation.
     */
    const observer = new MutationObserver(() => {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");
        let shouldReload = false;

        if (isPassive) {
            if (!currentRef) {
                console.log("SPA Navigation Detected: No existing ref, setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                window.history.replaceState({}, "", url.toString());
                shouldReload = true;
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("SPA Navigation Detected: Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                window.history.replaceState({}, "", url.toString());
                shouldReload = true;
            }
        }

        if (shouldReload) {
            chrome.runtime.sendMessage({ type: "reloadPage" });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

/**
 * Prints a message to the console telling the user about the plugin
 */
console.log(`
    
▗▄▄▖  ▗▄▖ ▗▄▄▖    ▗▖▗▖ ▗▖▗▄▄▄▖    ▗▖    ▗▄▖  ▗▄▖ ▗▄▄▄ ▗▄▄▄▖▗▄▄▄ 
▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌   ▐▌▐▌▗▞▘  █      ▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌  █▐▌   ▐▌  █
▐▛▀▚▖▐▌ ▐▌▐▛▀▚▖   ▐▌▐▛▚▖   █      ▐▌   ▐▌ ▐▌▐▛▀▜▌▐▌  █▐▛▀▀▘▐▌  █
▐▌ ▐▌▝▚▄▞▘▐▙▄▞▘▗▄▄▞▘▐▌ ▐▌  █      ▐▙▄▄▖▝▚▄▞▘▐▌ ▐▌▐▙▄▄▀▐▙▄▄▖▐▙▄▄▀
                                                                
                                                                
                                                                

    ┏┓┏┓┏┓┏┓  ┓   ┓   •  •   
┏┓  ┣ ┣┫┣ ┃┃ –┃ ┏┓┣┓– ┓┏┓┓┏┓╋
┗┻  ┻ ┛┗┻ ┗┛  ┗┛┗┻┗┛  ┃┗┛┗┛┗┗
                      ┛      
`);
