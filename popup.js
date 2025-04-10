/**
 * Default referral wallet in case user input is empty.
 */
const DEFAULT_WALLET = "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW";

/**
 * Validates a given Tezos address.
 * Checks if the input matches the standard Tezos address format (tz1, tz2, or tz3).
 *
 * @param {string} address - The Tezos address to validate.
 * @returns {boolean} - Returns `true` if the address is valid, otherwise `false`.
 */
function isValidTezosAddress(address) {
    return /^tz[1-3][a-km-zA-HJ-NP-Z1-9]{33}$/.test(address);
}

/**
 * Saves the referral wallet address entered by the user.
 * If the entered wallet is empty, it defaults to DEFAULT_WALLET.
 * Ensures the wallet address is valid before saving.
 */
document.getElementById("save").addEventListener("click", () => {
    let refWallet = document.getElementById("wallet").value.trim();
    console.log("Referral wallet:", refWallet);

    if (!refWallet) {
        refWallet = DEFAULT_WALLET;
    }

    if (refWallet && refWallet !== DEFAULT_WALLET && isValidTezosAddress(refWallet)) {
        browser.storage.local.set({ refWallet }).then(() => {
            showMessage("Referral wallet saved!", "green");
        });
    } else if (refWallet === DEFAULT_WALLET) {
        browser.storage.local.set({ refWallet }).then(() => {
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
    browser.storage.local.set({ refWallet: DEFAULT_WALLET }).then(() => {
        showMessage("Referral wallet cleared!", "red");
    });
});

/**
 * Toggles the extension's active state when the user interacts with the switch.
 * Updates browser storage and notifies the background script.
 *
 * @param {Event} event - The change event triggered by the checkbox.
 */
document.getElementById("activeToggle").addEventListener("change", (event) => {
    let isEnabled = event.target.checked;
    browser.storage.local.set({ isEnabled }).then(() => {
        browser.runtime.sendMessage({ type: "updateState", isEnabled });
        browser.action.setIcon({ path: isEnabled ? "icon-on.png" : "icon-off.png" });
    });
    // main-icon element should use the same icon as the extension icon
    let mainIcon = document.getElementById("main-icon");
    mainIcon.src = isEnabled ? "icon-on.png" : "icon-off.png";
});

/**
 * Toggles passive mode, determining whether the extension should override existing referrals.
 * Updates browser storage and notifies the background script.
 *
 * @param {Event} event - The change event triggered by the checkbox.
 */
document.getElementById("passiveToggle").addEventListener("change", (event) => {
    let isPassive = event.target.checked;
    browser.storage.local.set({ isPassive }).then(() => {
        browser.runtime.sendMessage({ type: "updatePassive", isPassive });
    });
});

/**
 * Loads stored settings on popup open and updates UI elements accordingly.
 */
browser.storage.local
    .get(["refWallet", "isEnabled", "isPassive"])
    .then((data) => {
        document.getElementById("wallet").value = data.refWallet || DEFAULT_WALLET;
        document.getElementById("activeToggle").checked = data.isEnabled === true;
        document.getElementById("passiveToggle").checked = data.isPassive !== false;
    })
    .catch((error) => console.error("Error loading settings:", error));

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

/**
 * Displays the current version of the extension.
 */
const CURRENT_VERSION = "1.1.6";
document.getElementById("currentVersion").appendChild(document.createTextNode(CURRENT_VERSION));
