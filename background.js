function updateReferralRule(refWallet, isEnabled) {
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            removeRuleIds: [1], // ✅ Remove previous rule first, ensures a clean slate
        },
        () => {
            if (isEnabled) {
                chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: [
                        {
                            id: 1,
                            priority: 1,
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
                        },
                    ],
                });
            }
        }
    );
}

function updateIcon(isEnabled) {
    const icon = isEnabled ? "icon-on.png" : "icon-off.png";
    chrome.action.setIcon({ path: icon });
}

// ✅ Set the correct icon and referral rule on startup
chrome.storage.local.get({ isEnabled: true, refWallet: "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ" }, (data) => {
    updateReferralRule(data.refWallet, data.isEnabled);
    updateIcon(data.isEnabled);
});

// ✅ Toggle from toolbar icon click
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateReferralRule(data.refWallet, newState);
            updateIcon(newState);
        });
    });
});

// ✅ Listen for state changes from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "updateState") {
        chrome.storage.local.set({ isEnabled: message.isEnabled }, () => {
            updateIcon(message.isEnabled);
        });
    }
});

// ✅ Ensure icon updates on storage changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled) {
        chrome.storage.local.get(["isEnabled", "refWallet"], (data) => {
            updateReferralRule(data.refWallet, data.isEnabled);
            updateIcon(data.isEnabled);
        });
    }
});
