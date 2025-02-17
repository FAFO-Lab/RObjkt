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

function updateIcon(isEnabled) {
    chrome.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
}

// Set default values on startup
chrome.storage.local.get({ isEnabled: true, isPassive: false, refWallet: CONFIG.DEFAULT_WALLET }, (data) => {
    updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
    updateIcon(data.isEnabled);
});

// Handle toolbar toggle
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateReferralRule(data.refWallet, newState, data.isPassive);
            updateIcon(newState);
        });
    });
});

// Listen for state changes
chrome.runtime.onMessage.addListener((message) => {
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
