/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
chrome.storage.local.get(["isEnabled", "isPassive", "refWallet"], (data) => {
    const isEnabled = data.isEnabled ?? false;
    const isPassive = data.isPassive ?? true;
    const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet

    console.log("Extension Loaded with Settings:", {
        isEnabled,
        isPassive,
        refWallet,
    });

    if (!isEnabled) return;

    // Function to update local referral storage for token pages.
    function updateLocalReferral() {
        const tokenRegex = /\/tokens\/(KT\w+)\/(\d+)/;
        const match = window.location.pathname.match(tokenRegex);
        if (match) {
            const contract = match[1];
            const tokenId = match[2];
            const key = `${contract}-${tokenId}`;
            // Retrieve existing referral data (if any)
            let referralData = {};
            try {
                referralData = JSON.parse(localStorage.getItem("objkt-settings-local-referral")) || {};
                console.log("Retrieved local referral data:", referralData);
            } catch (e) {
                console.warn("Error parsing local referral data:", e);
            }
            // Create or update the referral entry
            const currentDate = new Date().toISOString();
            const updatedEntry = {
                date: currentDate,
                shares: { [refWallet]: 10000 },
                utm_source: null,
                utm_medium: null,
                utm_campaign: null,
                utm_term: null,
                utm_content: null,
            };
            referralData[key] = updatedEntry;
            localStorage.setItem("objkt-settings-local-referral", JSON.stringify(referralData));
            console.log("Updated local referral data for token:", key, updatedEntry);
        }
    }

    /**
     * Modifies the current URL to include the referral parameter.
     * Instead of forcing a reload, dispatches a popstate event to inform the Angular router.
     */
    function updateURL() {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");
        let urlModified = false;

        if (isPassive) {
            if (!currentRef) {
                console.log("No existing ref detected. Setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        }

        if (urlModified) {
            window.history.replaceState({}, "", url.toString());
            // Dispatch a popstate event to signal URL change to Angular's router.
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
            console.log("URL updated without reload:", url.toString());

            // Update the local referral storage if this is a token page.
            updateLocalReferral();
        }
    }

    updateURL();

    /**
     * Observes the document for changes to detect soft navigations (Angular, React, etc.).
     * Ensures referral parameters persist after client-side navigation.
     */
    const observer = new MutationObserver(() => {
        let url = new URL(window.location.href);
        let currentRef = url.searchParams.get("ref");
        let urlModified = false;

        if (isPassive) {
            if (!currentRef) {
                console.log("SPA Navigation Detected: No existing ref, setting ref to:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        } else {
            if (!currentRef || currentRef !== refWallet) {
                console.log("SPA Navigation Detected: Overwriting ref with:", refWallet);
                url.searchParams.set("ref", refWallet);
                urlModified = true;
            }
        }

        if (urlModified) {
            window.history.replaceState({}, "", url.toString());
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
            console.log("SPA Navigation: URL updated without reload:", url.toString());

            // Update local referral storage if applicable.
            updateLocalReferral();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
