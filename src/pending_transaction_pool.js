// data structure for pending txns
const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction.js");

function Pending_Transaction_Pool(tx = []) {
    this.transactions = tx;
};

Pending_Transaction_Pool.prototype.create = function(num) {
    var data = new CSV_data();
    var data_ = data.getData(num); //get data of block1
    if(num == 1 || num == 2) {
        this.insertCSVData(44, data_);
    }
    else if(num == 3) {
        this.insertCSVData(50, data_);
    }
    else console.log("wrong block number.");
}

Pending_Transaction_Pool.prototype.insertCSVData = (quantity, data) => {
    for(var i = 1; i < quantity; i++) {
        var txn = new Transaction_MT(data[i][0], data[i][2], data[i][3], data[i][4]);
        this.transactions.push(txn);
    }
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

Pending_Transaction_Pool.prototype.isRepeat = (tx)=>{
    this.transactions.array.forEach(element => {
        if(tx.id === element.id){
            return true;
        }
    });
    return false;
}

Pending_Transaction_Pool.prototype.validate = (tx) =>{
    if(tx.value < 0){
        return false;
    }

    return true;
}

Pending_Transaction_Pool.prototype.addTx = (tx)=>{
    if(this.validate(tx) && !this.isRepeat(tx)){
        this.transactions.push(tx);
    }

}

Pending_Transaction_Pool.prototype.addTxs = (txs) =>{
    txs.array.forEach(tx => {
        this.addTx(tx);
    });
}

Pending_Transaction_Pool.prototype.remove = (tx) =>{
    this.transactions.array.forEach((element, index) => {
        if(tx.id === element.id){
            this.transactions.splice(index, 1);
        }
   });
}

module.exports = Pending_Transaction_Pool;