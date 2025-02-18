/**
 * Saves the referral wallet address entered by the user.
 * If the entered wallet is empty, it defaults to CONFIG.DEFAULT_WALLET.
 * Ensures the wallet address is valid before saving.
 */
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

/**
 * Clears the referral wallet input field and resets it to the default wallet.
 */
document.getElementById("clear").addEventListener("click", () => {
    document.getElementById("wallet").value = "";
    chrome.storage.local.set({ refWallet: CONFIG.DEFAULT_WALLET }, () => {
        showMessage("Referral wallet cleared!", "red");
    });
});

/**
 * Toggles the extension's active state when the user interacts with the switch.
 * Updates Chrome storage and notifies the background script.
 *
 * @param {Event} event - The change event triggered by the checkbox.
 */
document.getElementById("activeToggle").addEventListener("change", (event) => {
    let isEnabled = event.target.checked;
    chrome.storage.local.set({ isEnabled }, () => {
        chrome.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
        chrome.runtime.sendMessage({ type: "updateState", isEnabled });
    });
});

/**
 * Toggles passive mode, determining whether the extension should override existing referrals.
 * Updates Chrome storage and notifies the background script.
 *
 * @param {Event} event - The change event triggered by the checkbox.
 */
document.getElementById("passiveToggle").addEventListener("change", (event) => {
    let isPassive = !event.target.checked;
    chrome.storage.local.set({ isPassive }, () => {
        chrome.runtime.sendMessage({ type: "updateState", isPassive });
    });
});

/**
 * Loads stored settings on popup open and updates UI elements accordingly.
 */
chrome.storage.local.get(["refWallet", "isEnabled", "isPassive"], (data) => {
    document.getElementById("wallet").value = data.refWallet || CONFIG.DEFAULT_WALLET;
    document.getElementById("activeToggle").checked = data.isEnabled !== false;
    document.getElementById("passiveToggle").checked = !data.isPassive;
});

/**
 * Displays a temporary message to the user.
 *
 * @param {string} text - The message to display.
 * @param {string} color - The text color for the message.
 */
function showMessage(text, color) {
    let message = document.createElement("div");
    message.id = "success-message";
    message.textContent = text;
    message.style.color = color;

    let walletInput = document.getElementById("wallet");
    walletInput.parentNode.insertBefore(message, walletInput);

    setTimeout(() => message.remove(), 3000);
}
