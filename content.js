/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    const isEnabled = data.isEnabled ?? false;
    const isPassive = data.isPassive ?? true;
    const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet

    console.log("Extension Loaded with Settings:", {
        isEnabled,
        isPassive,
        refWallet,
    });

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
        let urlModified = false;

        if (isPassive) {
            if (!currentRef) {
                console.log("No existing ref detected. Setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        }

        if (urlModified) {
            window.history.replaceState({}, "", url.toString());

            // Wait for extension context to be available
            const tryReload = (retries = 3) => {
                if (
                    typeof chrome !== "undefined" &&
                    chrome.runtime &&
                    typeof chrome.runtime.sendMessage === "function"
                ) {
                    try {
                        chrome.runtime.sendMessage({ type: "reloadPage" });
                    } catch (error) {
                        console.warn("Failed to send reload message:", error);
                        if (retries > 0) {
                            setTimeout(() => tryReload(retries - 1), 100);
                        } else {
                            window.location.reload();
                        }
                    }
                } else {
                    if (retries > 0) {
                        console.log(`Waiting for extension context... (${retries} retries left)`);
                        setTimeout(() => tryReload(retries - 1), 100);
                    } else {
                        console.warn("Extension context not available after retries, reloading page directly");
                        window.location.reload();
                    }
                }
            };

            // Start the retry process
            tryReload();
        }
    }

    updateURL();

    /**
     * Observes the document for changes to detect soft navigations (React SPAs, Next.js, Vue, etc.).
     * Ensures referral parameters persist after client-side navigation.
     */
    const observer = new MutationObserver(() => {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");
        let urlModified = false;

        if (isPassive) {
            if (!currentRef) {
                console.log("SPA Navigation Detected: No existing ref, setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("SPA Navigation Detected: Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        }

        if (urlModified) {
            window.history.replaceState({}, "", url.toString());

            // Debug logging
            console.log("Chrome object available:", typeof chrome !== "undefined");
            console.log("Runtime object available:", chrome && typeof chrome.runtime !== "undefined");
            console.log("SendMessage available:", chrome?.runtime?.sendMessage !== undefined);

            // Check if we're in a valid extension context
            if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.sendMessage === "function") {
                try {
                    chrome.runtime.sendMessage({ type: "reloadPage" });
                } catch (error) {
                    console.warn("Failed to send reload message:", error);
                    window.location.reload();
                }
            } else {
                console.warn("Not in a valid extension context, reloading page directly");
                window.location.reload();
            }
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
