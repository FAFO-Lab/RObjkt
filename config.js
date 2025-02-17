// Global Configuration
const CONFIG = {
    DEFAULT_WALLET: "tz1g4u4S2Fg7jsJVMmbYujxXQYsJB7ecSWGJ",
    isValidTezosAddress: function (address) {
        return /^tz[1-3][a-km-zA-HJ-NP-Z1-9]{33}$/.test(address);
    },
};
