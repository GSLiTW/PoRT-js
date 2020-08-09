const uuid = require("uuid/v1");

function Account() {
    this.address = uuid().split("-").join("");
    this.balance = 0;
};

Account.prototype.initialize = function(address) {
    if (this.balance[address] == undefined) {
      this.balance[address] = 0;
      this.addresses.push(address);
    }
}

Account.prototype.transfer = function(from, to, amount) {
    this.initialize(from);
    this.initialize(to);
    this.increment(to, amount);
    this.decrement(from, amount);
}

Account.prototype.increment = function(to, amount) {
    this.balance[to] += amount;
}

Account.prototype.decrement = function(from, amount) {
    this.balance[from] -= amount;
}

Account.prototype.getBalance = function(address) {
    this.initialize(address);
    return this.balance[address];
}

Account.prototype.update = function(transaction) {
    let amount = transaction.output.amount;
    let from = transaction.input.from;
    let to = transaction.output.to;
    this.transfer(from, to, amount);
}

Account.prototype.transferFee = function(block, transaction) {
    let amount = transaction.output.fee;
    let from = transaction.input.from;
    let to = block.validator;
    this.transfer(from, to, amount);
}

Account.prototype.getAddress = function() {
    return this.address;
}

module.exports = Account;