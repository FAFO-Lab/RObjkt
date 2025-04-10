/**
 * Browser API compatibility layer for cross-browser extensions
 * This script provides a unified API that works in both Chrome and Firefox
 */

(function () {
    // Use the browser namespace if it exists (Firefox), otherwise use chrome (Chrome)
    window.browser = (function () {
        return window.browser || window.chrome;
    })();

    // If we're in Chrome, we need to add promises for APIs that don't return promises
    if (typeof chrome !== "undefined" && !window.browser.runtime.getBrowserInfo) {
        const promisify = (api, method) => {
            const original = api[method];
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
