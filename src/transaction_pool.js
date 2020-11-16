// data structure for those txns in the current block
const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction_for_mapping_table.js");

function Transaction_Pool() {
    this.transactions = [];
};

Transaction_Pool.prototype.create = function(num) {
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

Transaction_Pool.prototype.clean = function() {
    this.transactions = [];
}

Transaction_Pool.prototype.show_txns = function() {
    console.log(this.transactions);
}

module.exports = Transaction_Pool;