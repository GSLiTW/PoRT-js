const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction.js");

/**
 * @class Data Structure for the transactions in a block
 */
function Transaction_Pool() {
    this.transactions = [];
};

/**
 * Generate pending transaction pool for each testing block
 * @param  {integer} num={1,2,3} - Specify for which block to generate 
 */
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
/**
 * Clean up current transaction pool to empty
 */
Transaction_Pool.prototype.clean = function() {
    this.transactions = [];
}
/**
 * Show all transactions in current transaction pool
 */
Transaction_Pool.prototype.show_txns = function() {
    console.log(this.transactions);
}

module.exports = Transaction_Pool;