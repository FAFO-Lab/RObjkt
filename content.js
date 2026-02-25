/**
 * Generates a local timezone ISO string matching objkt.com's format.
 * e.g. "2026-02-24T23:02:31.282-08:00"
 * @returns {string} - Local ISO timestamp with timezone offset
 */
function getLocalISOString() {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
    return (
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
        `.${String(now.getMilliseconds()).padStart(3, "0")}` +
        `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
    );
}

/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
browser.storage.local
    .get(["isEnabled", "isPassive", "refWallet"])
    .then((data) => {
        const isEnabled = data.isEnabled ?? false;
        const isPassive = data.isPassive ?? true;
        const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet

        console.log("RObjkt: Extension Loaded with Settings:", {
            isEnabled,
            isPassive,
            refWallet,
        });

        if (!isEnabled) return;

        // Store processed paths to avoid infinite loops with URL changes
        const processedPaths = new Set();

        // Debounce timer to avoid rapid-fire URL changes
        let debounceTimer = null;
        const DEBOUNCE_DELAY = 300; // milliseconds

        // Guard flag to prevent our own replaceState calls from re-triggering
        let isOwnReplaceState = false;

        // Regex matches both /tokens/ and legacy /asset/ paths
        const tokenRegex = /\/(?:tokens|asset)\/(KT\w+)\/(\d+)/;

        /**
         * Normalizes a URL path by removing known tab suffixes and ref parameters
         * @param {string} path - The URL path to normalize
         * @returns {string} - Normalized path string
         */
        function normalizePath(path) {
            // Remove any tab suffixes like /curations, /owners, etc.
            let normalized = path.replace(/\/(curations|owners|history|offers|bids|activities)$/, "");
            return normalized;
        }

        /**
         * Gets a key representing the current page that can be used to track processed states
         * @returns {string} - A unique key for the current page
         */
        function getPageKey() {
            const url = new URL(window.location.href);
            // Get pathname without the ref parameter
            const normalizedPath = normalizePath(url.pathname);

            // Create a key using the path and all query params EXCEPT the ref parameter
            const queryParams = Array.from(url.searchParams.entries())
                .filter(([key]) => key !== "ref")
                .sort()
                .map(([key, value]) => `${key}=${value}`)
                .join("&");

            return `${normalizedPath}${queryParams ? "?" + queryParams : ""}`;
        }

        /**
         * Updates local referral storage for token pages.
         * @param {string} walletAddress - The wallet address to set as the referral
         */
        function updateLocalReferral(walletAddress) {
            const match = window.location.pathname.match(tokenRegex);
            if (match) {
                const contract = match[1];
                const tokenId = match[2];
                const key = `${contract}-${tokenId}`;
                // Retrieve existing referral data (if any)
                let referralData = {};
                try {
                    referralData = JSON.parse(localStorage.getItem("objkt-settings-local-referral")) || {};
                } catch (e) {
                    console.warn("RObjkt: Error parsing local referral data:", e);
                }
                // Create or update the referral entry using local timezone format
                const updatedEntry = {
                    date: getLocalISOString(),
                    shares: { [walletAddress]: 10000 },
                    utm_source: null,
                    utm_medium: null,
                    utm_campaign: null,
                    utm_term: null,
                    utm_content: null,
                };
                referralData[key] = updatedEntry;
                localStorage.setItem("objkt-settings-local-referral", JSON.stringify(referralData));
                console.log("RObjkt: Updated local referral for token:", key, "wallet:", walletAddress);
            }
        }

        /**
         * Modifies the current URL to include the referral parameter and ensures
         * the localStorage referral entry is always written for token pages.
         */
        function updateURL() {
            const pageKey = getPageKey();

            // If we've already processed this path, don't do it again
            if (processedPaths.has(pageKey)) {
                return;
            }

            let url = new URL(window.location.href);
            let currentRef = url.searchParams.get("ref");
            let urlModified = false;

            if (isPassive) {
                if (!currentRef) {
                    // No existing ref — set ours
                    console.log("RObjkt: No existing ref detected. Setting ref to:", refWallet);
                    url.searchParams.set("ref", refWallet);
                    urlModified = true;
                    // Write localStorage with our wallet
                    updateLocalReferral(refWallet);
                } else {
                    // Existing ref present — respect it (passive mode)
                    console.log("RObjkt: Passive mode — preserving existing ref:", currentRef);
                    // Still write localStorage with the EXISTING ref to ensure it's captured
                    updateLocalReferral(currentRef);
                }
            } else {
                // Active mode — always set our wallet
                if (!currentRef || currentRef !== refWallet) {
                    console.log("RObjkt: Active mode — setting ref to:", refWallet);
                    url.searchParams.set("ref", refWallet);
                    urlModified = true;
                }
                // Always write localStorage with our wallet in active mode
                updateLocalReferral(refWallet);
            }

            if (urlModified) {
                isOwnReplaceState = true;
                window.history.replaceState({}, "", url.toString());
                isOwnReplaceState = false;
                console.log("RObjkt: URL updated:", url.toString());
            }

            // Mark this path as processed regardless of whether we modified it
            processedPaths.add(pageKey);
        }

        // Initial URL update (wait briefly for Angular to finish initial load)
        setTimeout(updateURL, 100);

        /**
         * Debounced handler for URL changes
         */
        function handleURLChange() {
            // Clear any existing timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Set a new timer
            debounceTimer = setTimeout(() => {
                updateURL();
            }, DEBOUNCE_DELAY);
        }

        /**
         * Listen for history changes (pushState/replaceState/popstate)
         * This reliably detects SPA navigation in Angular
         */
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            handleURLChange();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            // Only handle URL changes not triggered by our own replaceState
            if (!isOwnReplaceState) {
                handleURLChange();
            }
        };

        window.addEventListener("popstate", handleURLChange);

        /**
         * Lightweight MutationObserver as a fallback for SPA navigation detection.
         * Only watches for major structural changes, not every DOM mutation.
         */
        let lastObservedPath = window.location.pathname + window.location.search;
        const observer = new MutationObserver(() => {
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== lastObservedPath) {
                lastObservedPath = currentPath;
                handleURLChange();
            }
        });

        // Wait for body to be available, then observe
        function startObserver() {
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: false, // Only watch direct children, not deep subtree
                });
            } else {
                // Body not ready yet, try again shortly
                setTimeout(startObserver, 50);
            }
        }
        startObserver();
    })
    .catch((error) => console.error("RObjkt: Error loading storage settings:", error));
