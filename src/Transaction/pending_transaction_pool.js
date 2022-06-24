// data structure for pending txns
const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction.js");

function Pending_Transaction_Pool(tx = []) {
    this.transactions = tx;
};

Pending_Transaction_Pool.prototype.create = function(num) {
    var data = new CSV_data();
    var data_ = data.getData(num); //get data of block1
    if(num == 1) {
        for(var i = 1; i < 44; i++) {
            var txn = new Transaction_MT(data_[i][0], data_[i][2], data_[i][3], data_[i][4]);
            this.transactions.push(txn);
        }
    }
    else if(num == 2) {
        for(var i = 1; i < 44; i++) {
            var txn = new Transaction_MT(data_[i][0], data_[i][2], data_[i][3], data_[i][4]);
            this.transactions.push(txn);
        }
    }
    else if(num == 3) {
        for(var i = 1; i < 50; i++) {
            var txn = new Transaction_MT(data_[i][0], data_[i][2], data_[i][3], data_[i][4]);
            this.transactions.push(txn);
        }
    }
    else console.log("wrong block number.");
}

Pending_Transaction_Pool.prototype.clean = function() {
    this.transactions = [];
}

Pending_Transaction_Pool.prototype.get_transaction = function() {
    return this.transactions;
}

Pending_Transaction_Pool.prototype.get_num_of_transaction = function() {
    return this.transactions.length;
}

module.exports = Pending_Transaction_Pool;
