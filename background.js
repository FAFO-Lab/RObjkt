/**
 * Global configuration settings for the extension.
 */
const DEFAULT_WALLET = "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW";

/**
 * Updates the referral rule by modifying Chrome's declarativeNetRequest dynamic rules.
 * It sets or removes the referral parameter in objkt.com URLs based on the user's settings.
 *
 * @param {string} refWallet - The referral wallet address to be set in the URL.
 * @param {boolean} isEnabled - Indicates whether the extension is enabled.
 * @param {boolean} isPassive - If true, the referral parameter is only set if it is missing.
 */
function updateReferralRule(refWallet, isEnabled, isPassive) {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] }, () => {
        if (isEnabled) {
            let rule = {
                id: 1,
                priority: 1,
                action: {
                    type: "redirect",
                    redirect: {
                        transform: {
                            queryTransform: {
                                addOrReplaceParams: isPassive
                                    ? [{ key: "ref", replaceOnlyEmpty: true, value: refWallet }]
                                    : [{ key: "ref", value: refWallet }],
                            },
                        },
                    },
                },
            };
            chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] });
        }
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
            updateReferralRule(defaults.refWallet, defaults.isEnabled, defaults.isPassive);
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

    updateReferralRule(settings.refWallet, settings.isEnabled, settings.isPassive);
    updateIcon(settings.isEnabled);
});

/**
 * Toggles the extension state when the toolbar icon is clicked.
 * Updates storage, referral rules, and the extension icon.
 */
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateReferralRule(data.refWallet, newState, data.isPassive);
            updateIcon(newState);
        });
    });
});

/**
 * Listens for messages from popup or content scripts.
 * Handles enabling/disabling the extension, updating passive mode, and triggering page reloads.
 *
 * @param {Object} message - The message object received from the sender.
 * @param {Object} sender - The sender of the message.
 */
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "updateState") {
        chrome.storage.local.set({ isEnabled: message.isEnabled }, () => {
            updateIcon(message.isEnabled);
        });
    } else if (message.type === "updatePassive") {
        chrome.storage.local.set({ isPassive: message.isPassive }, () => {
            chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
                updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            });
        });
    } else if (message.type === "reloadPage" && sender.tab) {
        console.log("Received reload request. Reloading page...");
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: () => location.reload(),
        });
    }
});

/**
 * Watches for storage changes and updates the referral rule or icon accordingly.
 *
 * @param {Object} changes - The changes detected in the local storage.
 */
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled || changes.refWallet || changes.isPassive) {
        chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
            updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            updateIcon(data.isEnabled);
        });
    }
});
