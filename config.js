/**
 * Global configuration settings for the extension.
 * Contains the default referral wallet address and a utility function for validating Tezos addresses.
 *
 * @namespace CONFIG
 */
const CONFIG = {
    /**
     * The default Tezos referral wallet address.
     * This address is used if the user does not specify their own referral wallet.
     *
     * @constant {string}
     */
    DEFAULT_WALLET: "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ",

    /**
     * Validates a given Tezos address.
     * Checks if the input matches the standard Tezos address format (tz1, tz2, or tz3).
     *
     * @function
     * @param {string} address - The Tezos address to validate.
     * @returns {boolean} - Returns `true` if the address is valid, otherwise `false`.
     */
    isValidTezosAddress: function (address) {
        return /^tz[1-3][a-km-zA-HJ-NP-Z1-9]{33}$/.test(address);
    },
};
