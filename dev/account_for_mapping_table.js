const sha256 = require("sha256");

function Account_MT() {
    this.transactions = [];
    this.balance = 0;
    this.private_key = '';
    this.public_key = '';
    this.tax = '';
    this.address = null;
};

Account_MT.prototype.initialize = function(address) {
    this.address = address;
    this.private_key = sha256(this.address);
}

Account_MT.prototype.getAddress = function() {
    return this.address;
}

module.exports = Account_MT;