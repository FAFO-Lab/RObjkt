// Import browser compatibility layer in Service Worker context (e.g. Chrome MV3)
// In Event Page context (e.g. Firefox MV3), scripts are loaded sequentially via manifest.json
if (typeof importScripts !== 'undefined') {
    importScripts("browser-polyfill.js");
}

const DEFAULT_WALLET = "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW";

/**
 * Updates the referral rule by modifying the browser's declarativeNetRequest dynamic rules.
 * In MV3, due to API limitations, we can only add or replace the referral parameter unconditionally.
 *
 * @param {string} refWallet - The referral wallet address to be set in the URL.
 * @param {boolean} isEnabled - Indicates whether the extension is enabled.
 * @param {boolean} isPassive - If true, the referral parameter is intended to be added only if missing.
 *                              NOTE: Passive mode is not supported in MV3 and will be treated as active.
 */
function updateReferralRule(refWallet, isEnabled, isPassive) {
    // Remove the old rule (if any)
    browser.declarativeNetRequest
        .updateDynamicRules({ removeRuleIds: [1] })
        .then(() => {
            if (isEnabled && !isPassive) {
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

                browser.declarativeNetRequest.updateDynamicRules({ addRules: [rule] });
            }
        })
        .catch((error) => console.error("Error updating declarativeNetRequest rules:", error));
}

/**
 * Updates the extension icon based on the enabled state.
 *
 * @param {boolean} isEnabled - Whether the extension is enabled.
 */
function updateIcon(isEnabled) {
    browser.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
}

// --- Extension initialization and event listeners --- //

browser.runtime.onInstalled.addListener(() => {
    browser.storage.local
        .get(["isEnabled", "isPassive", "refWallet"])
        .then((data) => {
            const defaults = {
                isEnabled: data.isEnabled ?? false,
                isPassive: data.isPassive ?? true,
                refWallet: data.refWallet ?? DEFAULT_WALLET,
            };

            return browser.storage.local.set(defaults).then(() => {
                updateReferralRule(defaults.refWallet, defaults.isEnabled, defaults.isPassive);
                updateIcon(defaults.isEnabled);
            });
        })
        .catch((error) => console.error("Error during initialization:", error));
});

browser.storage.local
    .get(["isEnabled", "isPassive", "refWallet"])
    .then((data) => {
        const settings = {
            isEnabled: data.isEnabled ?? false,
            isPassive: data.isPassive ?? true,
            refWallet: data.refWallet ?? DEFAULT_WALLET,
        };

        updateReferralRule(settings.refWallet, settings.isEnabled, settings.isPassive);
        updateIcon(settings.isEnabled);
    })
    .catch((error) => console.error("Error loading settings:", error));

browser.action.onClicked.addListener(() => {
    browser.storage.local
        .get(["isEnabled", "refWallet", "isPassive"])
        .then((data) => {
            const newState = !data.isEnabled;
            return browser.storage.local.set({ isEnabled: newState }).then(() => {
                updateReferralRule(data.refWallet, newState, data.isPassive);
                updateIcon(newState);
            });
        })
        .catch((error) => console.error("Error toggling extension state:", error));
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "updateState") {
        browser.storage.local.set({ isEnabled: message.isEnabled }).then(() => {
            updateIcon(message.isEnabled);
        });
    } else if (message.type === "updatePassive") {
        browser.storage.local
            .set({ isPassive: message.isPassive })
            .then(() => {
                return browser.storage.local.get(["isEnabled", "refWallet", "isPassive"]);
            })
            .then((data) => {
                updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            });
    } else if (message.type === "reloadPage" && sender.tab) {
        console.log("Received reload request. Reloading page...");
        browser.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: () => location.reload(),
        });
    }

    // Firefox expects a Promise to be returned from listeners
    return Promise.resolve();
});

browser.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled || changes.refWallet || changes.isPassive) {
        browser.storage.local.get(["isEnabled", "refWallet", "isPassive"]).then((data) => {
            updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            updateIcon(data.isEnabled);
        });
    }
});
