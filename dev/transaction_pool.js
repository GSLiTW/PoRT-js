// data structure for those txns in the current block
function Transaction_Pool() {
    this.transactions = [];
};

Transaction_Pool.prototype.create = function(transaction) {
    this.transactions.push(transaction);
}

Transaction_Pool.prototype.show_txns = function() {
    console.log(this.transactions);
}

module.exports = Transaction_Pool;