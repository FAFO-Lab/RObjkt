document.getElementById("save").addEventListener("click", () => {
    let refWallet = document.getElementById("wallet").value.trim();
    if (!refWallet) {
        refWallet = "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ";
    }
    if (refWallet && refWallet != "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ" && isValidTezosAddress(refWallet)) {
        chrome.storage.local.set({ refWallet }, () => {
            // Inject success message above the input
            let message = document.createElement("div");
            message.id = "success-message";
            message.textContent = "Referral wallet saved!";
            message.style.color = "green";
            let walletInput = document.getElementById("wallet");
            walletInput.parentNode.insertBefore(message, walletInput);

            // Remove the message after 3 seconds
            setTimeout(() => {
                message.remove();
            }, 3000);
        });
    } else if (refWallet == "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ") {
        // Default wallet saved, show default message
        chrome.storage.local.set({ refWallet }, () => {
            // Inject success message above the input
            let message = document.createElement("div");
            message.id = "success-message";
            message.textContent = "Default referral wallet restored!";
            message.style.color = "green";
            let walletInput = document.getElementById("wallet");
            walletInput.parentNode.insertBefore(message, walletInput);

            // Remove the message after 3 seconds
            setTimeout(() => {
                message.remove();
            }, 3000);
        });
    } else {
        // Invalid wallet address
        alert("Invalid Tezos address");
    }
});

// clear button listener
document.getElementById("clear").addEventListener("click", () => {
    // clear the form input
    document.getElementById("wallet").value = "";
});

chrome.storage.local.get(["refWallet", "isEnabled"], (data) => {
    if (data.refWallet) {
        document.getElementById("wallet").value = data.refWallet;
    }
    document.getElementById("toggle").checked = data.isEnabled !== false; // Default to true
});

document.getElementById("toggle").addEventListener("change", (event) => {
    chrome.storage.local.set({ isEnabled: event.target.checked }, () => {
        chrome.runtime.sendMessage({ type: "updateIcon", state: event.target.checked });
    });
});

const isValidTezosAddress = (address) => {
    return /^tz[1-3][a-km-zA-HJ-NP-Z1-9]{33}$/.test(address);
};
