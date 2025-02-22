const DEFAULT_WALLET = "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW";

/**
 * Updates the referral rule by modifying Chrome's declarativeNetRequest dynamic rules.
 * In MV3, due to API limitations, we can only add or replace the referral parameter unconditionally.
 *
 * @param {string} refWallet - The referral wallet address to be set in the URL.
 * @param {boolean} isEnabled - Indicates whether the extension is enabled.
 * @param {boolean} isPassive - If true, the referral parameter is intended to be added only if missing.
 *                              NOTE: Passive mode is not supported in MV3 and will be treated as active.
 */
function updateReferralRule(refWallet, isEnabled, isPassive) {
    // Remove the old rule (if any)
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1] }, () => {
        if (isEnabled) {
            // We use a simple urlFilter to match objkt.com URLs.
            // Passive mode (conditional update) is not supported, so we always add/replace.
            const condition = { urlFilter: "objkt.com" };

            const rule = {
                id: 1,
                priority: 1,
                condition,
                action: {
                    type: "redirect",
                    redirect: {
                        transform: {
                            queryTransform: {
                                addOrReplaceParams: [{ key: "ref", value: refWallet }],
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

// --- Extension initialization and event listeners --- //

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
        const defaults = {
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

chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    const settings = {
        isEnabled: data.isEnabled ?? false,
        isPassive: data.isPassive ?? true,
        refWallet: data.refWallet ?? DEFAULT_WALLET,
    };

    updateReferralRule(settings.refWallet, settings.isEnabled, settings.isPassive);
    updateIcon(settings.isEnabled);
});

chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateReferralRule(data.refWallet, newState, data.isPassive);
            updateIcon(newState);
        });
    });
});

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

chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled || changes.refWallet || changes.isPassive) {
        chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
            updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            updateIcon(data.isEnabled);
        });
    }
});
