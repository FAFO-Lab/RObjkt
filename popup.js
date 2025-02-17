document.getElementById("save").addEventListener("click", () => {
    let refWallet = document.getElementById("wallet").value.trim();
    console.log("Referral wallet:", refWallet);
    if (!refWallet) {
        refWallet = CONFIG.DEFAULT_WALLET;
    }
    if (refWallet && refWallet !== CONFIG.DEFAULT_WALLET && CONFIG.isValidTezosAddress(refWallet)) {
        chrome.storage.local.set({ refWallet }, () => {
            showMessage("Referral wallet saved!", "green");
        });
    } else if (refWallet === CONFIG.DEFAULT_WALLET) {
        chrome.storage.local.set({ refWallet }, () => {
            showMessage("Default referral wallet restored!", "green");
        });
    } else {
        showMessage("Invalid Tezos address", "red");
    }
});

// Clear button listener
document.getElementById("clear").addEventListener("click", () => {
    document.getElementById("wallet").value = "";
    chrome.storage.local.set({ refWallet: CONFIG.DEFAULT_WALLET }, () => {
        showMessage("Referral wallet cleared!", "red");
    });
});

// Active Mode Toggle
document.getElementById("activeToggle").addEventListener("change", (event) => {
    let isEnabled = event.target.checked;
    chrome.storage.local.set({ isEnabled }, () => {
        chrome.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
        chrome.runtime.sendMessage({ type: "updateState", isEnabled });
    });
});

// Passive Mode Toggle
document.getElementById("passiveToggle").addEventListener("change", (event) => {
    let isPassive = !event.target.checked;
    chrome.storage.local.set({ isPassive }, () => {
        chrome.runtime.sendMessage({ type: "updateState", isPassive });
    });
});

// Load settings on popup open
chrome.storage.local.get(["refWallet", "isEnabled", "isPassive"], (data) => {
    document.getElementById("wallet").value = data.refWallet || CONFIG.DEFAULT_WALLET;
    document.getElementById("activeToggle").checked = data.isEnabled !== false;
    document.getElementById("passiveToggle").checked = !data.isPassive;
});

// Helper function to show messages
function showMessage(text, color) {
    let message = document.createElement("div");
    message.id = "success-message";
    message.textContent = text;
    message.style.color = color;
    let walletInput = document.getElementById("wallet");
    walletInput.parentNode.insertBefore(message, walletInput);

    setTimeout(() => message.remove(), 3000);
}
