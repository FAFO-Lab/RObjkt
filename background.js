/**
 * Default referral wallet in case user input is empty.
 */
const DEFAULT_WALLET = "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW";

/**
 * Updates the Objkt referral settings by modifying `localStorage` directly.
 * If `isPassive` is true, only add an entry if it's missing; otherwise, overwrite existing.
 *
 * @param {string} refWallet - The referral wallet address.
 * @param {boolean} isPassive - Whether to only add if missing.
 */
function updateObjktReferral(refWallet, isPassive) {
    chrome.scripting.executeScript({
        target: { allFrames: true, world: "MAIN" },
        func: (wallet, passiveMode) => {
            try {
                let settingsKey = "objkt-settings-local-referral";
                let existingSettings = JSON.parse(localStorage.getItem(settingsKey)) || {};
                let timestamp = new Date().toISOString();

                // Check if the referral already exists
                let existingEntry = Object.values(existingSettings).find(
                    (entry) => entry.shares && entry.shares[wallet]
                );

                if (passiveMode && existingEntry) {
                    console.log("Passive mode enabled: Referral already exists, not overwriting.");
                    return; // Don't overwrite existing entry
                }

                let newEntry = {
                    date: timestamp,
                    shares: { [wallet]: 10000 },
                    utm_source: null,
                    utm_medium: null,
                    utm_campaign: null,
                    utm_term: null,
                    utm_content: null,
                };

                // Merge new referral entry, ensuring the most recent one takes priority
                let newSettings = {
                    ...existingSettings,
                    [`custom-${Date.now()}`]: newEntry,
                };

                localStorage.setItem(settingsKey, JSON.stringify(newSettings));
                console.log("Updated Objkt referral settings:", newSettings);
            } catch (error) {
                console.error("Error updating Objkt referral settings:", error);
            }
        },
        args: [refWallet, isPassive],
    });
}

/**
 * Updates the extension icon based on the enabled state.
 *
 * @param {boolean} isEnabled - Whether the extension is enabled.
 */
function updateIcon(isEnabled) {
    chrome.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
}

/**
 * Ensures default settings are stored when the extension is installed.
 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
        let defaults = {
            isEnabled: data.isEnabled ?? false,
            isPassive: data.isPassive ?? true,
            refWallet: data.refWallet ?? DEFAULT_WALLET,
        };

        chrome.storage.local.set(defaults, () => {
            updateObjktReferral(defaults.refWallet, defaults.isPassive);
            updateIcon(defaults.isEnabled);
        });
    });
});

/**
 * Initializes the extension settings on startup.
 * Retrieves stored settings and applies the referral rule and icon state.
 */
chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    let settings = {
        isEnabled: data.isEnabled ?? false,
        isPassive: data.isPassive ?? true,
        refWallet: data.refWallet ?? DEFAULT_WALLET,
    };

    updateObjktReferral(settings.refWallet, settings.isPassive);
    updateIcon(settings.isEnabled);
});

/**
 * Toggles the extension state when the toolbar icon is clicked.
 * Updates storage, referral settings, and the extension icon.
 */
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateObjktReferral(data.refWallet, data.isPassive);
            updateIcon(newState);
        });
    });
});

/**
 * Listens for messages from popup or content scripts.
 * Handles enabling/disabling the extension and updating referral settings.
 *
 * @param {Object} message - The message object received from the sender.
 */
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "updateState") {
        chrome.storage.local.set({ isEnabled: message.isEnabled }, () => {
            updateIcon(message.isEnabled);
        });
    } else if (message.type === "updateReferral") {
        chrome.storage.local.set({ refWallet: message.refWallet }, () => {
            chrome.storage.local.get(["isPassive"], (data) => {
                updateObjktReferral(message.refWallet, data.isPassive);
            });
        });
    } else if (message.type === "updatePassive") {
        chrome.storage.local.set({ isPassive: message.isPassive }, () => {
            chrome.storage.local.get(["refWallet"], (data) => {
                updateObjktReferral(data.refWallet, message.isPassive);
            });
        });
    }
});

/**
 * Watches for storage changes and updates referral settings accordingly.
 *
 * @param {Object} changes - The changes detected in the local storage.
 */
chrome.storage.onChanged.addListener((changes) => {
    if (changes.refWallet || changes.isPassive) {
        chrome.storage.local.get(["refWallet", "isPassive"], (data) => {
            updateObjktReferral(data.refWallet, data.isPassive);
        });
    }
});
