function updateReferralRule(refWallet, isEnabled, isPassive) {
    chrome.declarativeNetRequest.updateDynamicRules(
        {
            removeRuleIds: [1], // ✅ Remove previous rule first, ensures a clean slate
        },
        () => {
            if (isEnabled) {
                let rule = {
                    id: 1,
                    priority: 1,
                    action: {
                        type: "redirect",
                        redirect: {
                            transform: {
                                queryTransform: {
                                    // ✅ Passive mode logic: Only set ref if it's not already present
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
        }
    );
}

function updateIcon(isEnabled) {
    const icon = isEnabled ? "icon-on.png" : "icon-off.png";
    chrome.action.setIcon({ path: icon });
}

// ✅ Set the correct icon and referral rule on startup
chrome.storage.local.get(
    { isEnabled: true, isPassive: false, refWallet: "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ" },
    (data) => {
        updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
        updateIcon(data.isEnabled);
    }
);

// ✅ Toggle from toolbar icon click
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
        const newState = !data.isEnabled;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateReferralRule(data.refWallet, newState, data.isPassive);
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
    } else if (message.type === "updatePassive") {
        chrome.storage.local.set({ isPassive: message.isPassive }, () => {
            chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
                updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            });
        });
    }
});

// ✅ Ensure icon updates & Passive Mode toggles on storage changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled || changes.refWallet || changes.isPassive) {
        chrome.storage.local.get(["isEnabled", "refWallet", "isPassive"], (data) => {
            updateReferralRule(data.refWallet, data.isEnabled, data.isPassive);
            updateIcon(data.isEnabled);
        });
    }
});
