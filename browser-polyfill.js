/**
 * Browser API compatibility layer for cross-browser extensions
 * This script provides a unified API that works in both Chrome and Firefox
 * Compatible with both content script (window) and service worker (self) contexts
 */

(function () {
    // Determine the global context (window for content scripts, self for service workers)
    const globalContext = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this;

    // Use the browser namespace if it exists (Firefox), otherwise use chrome (Chrome)
    globalContext.browser = (function () {
        return globalContext.browser || globalContext.chrome;
    })();

    // If we're in Chrome, we need to add promises for APIs that don't return promises
    if (typeof chrome !== "undefined" && !globalContext.browser.runtime.getBrowserInfo) {
        const promisify = (api, method) => {
            const original = api[method];
            if (!original) return; // Skip if method doesn't exist
            api[method] = (...args) => {
                return new Promise((resolve, reject) => {
                    original.call(api, ...args, (...results) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(results.length > 1 ? results : results[0]);
                        }
                    });
                });
            };
        };

        // Promisify commonly used APIs
        if (chrome.storage && chrome.storage.local) {
            promisify(chrome.storage.local, "get");
            promisify(chrome.storage.local, "set");
        }

        if (chrome.declarativeNetRequest) {
            promisify(chrome.declarativeNetRequest, "updateDynamicRules");
        }
    }
})();
