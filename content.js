/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    const isEnabled = data.isEnabled ?? false;
    const isPassive = data.isPassive ?? true;
    const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet
    const DEBUG_MODE = false; // Set to true for verbose console logging

    if (DEBUG_MODE) console.log("Extension Loaded with Settings:", { isEnabled, isPassive, refWallet });

    if (!isEnabled) return;

    /**
     * Modifies the current URL to include the referral parameter if needed.
     */
    function updateURL() {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");

        if (isPassive && !currentRef) {
            url.searchParams.set("ref", refWallet);
            window.history.replaceState({}, "", url.toString());
            if (DEBUG_MODE) console.log("Passive Mode: Added missing referral ->", refWallet);
        } else if (!isPassive && currentRef !== refWallet) {
            url.searchParams.set("ref", refWallet);
            window.history.replaceState({}, "", url.toString());
            if (DEBUG_MODE) console.log("Active Mode: Overwritten referral ->", refWallet);
        } else {
            if (DEBUG_MODE) console.log("No referral update needed.");
            return;
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
        if (isPassive && !currentRef) {
            url.searchParams.set("ref", refWallet);
            window.history.replaceState({}, "", url.toString());
            shouldReload = true;
            if (DEBUG_MODE) console.log("SPA Navigation: Added missing referral ->", refWallet);
        } else if (!isPassive && currentRef !== refWallet) {
            url.searchParams.set("ref", refWallet);
            window.history.replaceState({}, "", url.toString());
            shouldReload = true;
            if (DEBUG_MODE) console.log("SPA Navigation: Overwritten referral ->", refWallet);
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
┏┓  ┣ ┣┫┣ ┃┃  ┃ ┏┓┣┓  ┓┏┓┓┏┓╋
┗┻  ┻ ┛┗┻ ┗┛  ┗┛┗┻┗┛  ┃┗┛┗┛┗┗
                      ┛      
`);
