const sha256 = require("sha256");

function Account_MT() {
    this.transactions = [];
    this.balance = 10;
    this.private_key = '';
    this.public_key = '';
    this.tax = '';
    this.address = null;
    this.creator_bit = 0;
    this.voter_bit = 0;
};

Account_MT.prototype.initialize = function(address) {
    this.tax = this.balance * 0.0001;
    this.address = address;
    this.private_key = sha256(this.address);
}

Account_MT.prototype.getAddress = function() {
    return this.address;
}

module.exports = Account_MT;