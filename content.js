/**
 * Retrieves stored settings and applies referral modifications based on user preferences.
 */
browser.storage.local
    .get(["isEnabled", "isPassive", "refWallet"])
    .then((data) => {
        const isEnabled = data.isEnabled ?? false;
        const isPassive = data.isPassive ?? true;
        const refWallet = data.refWallet ?? "tz1ZzSmVcnVaWNZKJradtrDnjSjzTp6qjTEW"; // Default wallet

        console.log("Extension Loaded with Settings:", {
            isEnabled,
            isPassive,
            refWallet,
        });

        if (!isEnabled) return;

        // Store processed paths to avoid infinite loops with URL changes
        const processedPaths = new Set();

        // Debounce timer to avoid rapid-fire URL changes
        let debounceTimer = null;
        const DEBOUNCE_DELAY = 250; // milliseconds

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
         * Avoids processing the same path multiple times.
         */
        function updateURL() {
            const pageKey = getPageKey();

            // If we've already processed this path, don't do it again
            if (processedPaths.has(pageKey)) {
                console.log("Path already processed, skipping:", pageKey);
                return;
            }

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

            // Mark this path as processed regardless of whether we modified it
            processedPaths.add(pageKey);
            console.log("Added to processed paths:", pageKey);
        }

        // Initial URL update
        updateURL();

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
                const currentPath = window.location.pathname;
                const currentUrl = window.location.href;
                console.log("Debounced URL change detected:", currentUrl);
                updateURL();
            }, DEBOUNCE_DELAY);
        }

        /**
         * Listen for history changes (pushState/replaceState/popstate)
         * This is more reliable than mutation observers for detecting actual navigation
         */
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            handleURLChange();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            handleURLChange();
        };

        window.addEventListener("popstate", handleURLChange);

        /**
         * MutationObserver as a fallback for SPA frameworks that might
         * manipulate the DOM without using history API
         */
        const observer = new MutationObserver(() => {
            // Use the debounced handler
            handleURLChange();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
    })
    .catch((error) => console.error("Error loading storage settings:", error));
