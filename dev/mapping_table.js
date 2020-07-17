const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction_for_mapping_table.js");
const Account_MT = require("./account_for_mapping_table.js");
var sender_register = 1;
var receiver_register = 1;

function Mapping_table() {
    this.account = [];
    this.numOfAddress = 0;
};

Mapping_table.prototype.initialize = function() {
    data = new CSV_data();
    var data_ = data.getData(1); //get data of block1
    for(var i = 1; i < 44; ++i) {
        var txn = new Transaction_MT(data_[i][0], data_[i][2], data_[i][3], data_[i][4]);
        for(var j = 0; j < this.numOfAddress; j++) {
            if(this.account[j].getAddress() === data_[i][2]) {
                sender_register = 0;
                this.account[j].transactions.push(txn);
                break;
            }
        }
        for(var j = 0; j < this.numOfAddress; j++) {
            if(this.account[j].getAddress() === data_[i][3]) {
                receiver_register = 0;
                this.account[j].transactions.push(txn);
                break;
            }
        }
        if(sender_register) {
            this.account[this.numOfAddress] = new Account_MT();
            this.account[this.numOfAddress].initialize(data_[i][2]);
            this.account[this.numOfAddress].transactions.push(txn);
            this.numOfAddress++;
        }
        if(receiver_register) {
            this.account[this.numOfAddress] = new Account_MT();
            this.account[this.numOfAddress].initialize(data_[i][3]);
            this.account[this.numOfAddress].transactions.push(txn);
            this.numOfAddress++;
        }
        sender_register = 1;
        receiver_register = 1;
    }
    for(var i = 0; i < this.numOfAddress; i++) {
        console.log(this.account[i]);
    }
    console.log(this.numOfAddress);
}

var a = new Mapping_table();
a.initialize();

module.exports = a;