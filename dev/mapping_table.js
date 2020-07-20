const CSV_data = require("./CSV_data.js");
const Transaction_MT = require("./transaction_for_mapping_table.js");
const Account_MT = require("./account_for_mapping_table.js");
const Transaction_Pool = require("./transaction_pool.js");
const Pending_Transaction_Pool = require("./pending_transaction_pool.js");
var sender_register = 1;
var receiver_register = 1;

function Mapping_table() {
    this.account = [];
    this.numOfAddress = 0;
};

Mapping_table.prototype.initialize = function() {
    var pending_txn_pool = new Pending_Transaction_Pool();
    //pending_txn_pool.create(1);
    var txn = pending_txn_pool.get_transaction();
    var txn_pool = new Transaction_Pool();
    for(var i = 0; i < 43; ++i) {
        txn_pool.create(txn[i]);
        for(var j = 0; j < this.numOfAddress; j++) {
            if(this.account[j].getAddress() === txn[i].get_sender()) {
                sender_register = 0;
                this.account[j].transactions.push(txn[i]);
                break;
            }
        }
        for(var j = 0; j < this.numOfAddress; j++) {
            if(this.account[j].getAddress() === txn[i].get_receiver()) {
                receiver_register = 0;
                this.account[j].transactions.push(txn[i]);
                break;
            }
        }
        if(sender_register) {
            this.account[this.numOfAddress] = new Account_MT();
            this.account[this.numOfAddress].initialize(txn[i].get_sender());
            this.account[this.numOfAddress].transactions.push(txn[i]);
            this.numOfAddress++;
        }
        if(receiver_register) {
            this.account[this.numOfAddress] = new Account_MT();
            this.account[this.numOfAddress].initialize(txn[i].get_receiver());
            this.account[this.numOfAddress].transactions.push(txn[i]);
            this.numOfAddress++;
        }
        sender_register = 1;
        receiver_register = 1;
    }

    // print all accounts

    /*for(var i = 0; i < this.numOfAddress; i++) {
        console.log(this.account[i]);
    }
    console.log(this.numOfAddress);*/
}

Mapping_table.prototype.upload = function(num){
    var pending_txn_pool = new Pending_Transaction_Pool();
    var txn = pending_txn_pool.get_transaction();
    var txn_pool = new Transaction_Pool();
    if(num == 2) {
        for(var i = 0; i < 43; ++i) {
            txn_pool.create(txn[i]);
            for(var j = 0; j < this.numOfAddress; j++) {
                if(this.account[j].getAddress() === txn[i].get_sender()) {
                    sender_register = 0;
                    this.account[j].transactions.push(txn[i]);
                    break;
                }
            }
            for(var j = 0; j < this.numOfAddress; j++) {
                if(this.account[j].getAddress() === txn[i].get_receiver()) {
                    receiver_register = 0;
                    this.account[j].transactions.push(txn[i]);
                    break;
                }
            }
            if(sender_register) {
                this.account[this.numOfAddress] = new Account_MT();
                this.account[this.numOfAddress].initialize(txn[i].get_sender());
                this.account[this.numOfAddress].transactions.push(txn[i]);
                this.numOfAddress++;
            }
            if(receiver_register) {
                this.account[this.numOfAddress] = new Account_MT();
                this.account[this.numOfAddress].initialize(txn[i].get_receiver());
                this.account[this.numOfAddress].transactions.push(txn[i]);
                this.numOfAddress++;
            }
            sender_register = 1;
            receiver_register = 1;
        }
    }
    else if(num == 3) {
        for(var i = 0; i < 49; ++i) {
            txn_pool.create(txn[i]);
            for(var j = 0; j < this.numOfAddress; j++) {
                if(this.account[j].getAddress() === txn[i].get_sender()) {
                    sender_register = 0;
                    this.account[j].transactions.push(txn[i]);
                    break;
                }
            }
            for(var j = 0; j < this.numOfAddress; j++) {
                if(this.account[j].getAddress() === txn[i].get_receiver()) {
                    receiver_register = 0;
                    this.account[j].transactions.push(txn[i]);
                    break;
                }
            }
            if(sender_register) {
                this.account[this.numOfAddress] = new Account_MT();
                this.account[this.numOfAddress].initialize(txn[i].get_sender());
                this.account[this.numOfAddress].transactions.push(txn[i]);
                this.numOfAddress++;
            }
            if(receiver_register) {
                this.account[this.numOfAddress] = new Account_MT();
                this.account[this.numOfAddress].initialize(txn[i].get_receiver());
                this.account[this.numOfAddress].transactions.push(txn[i]);
                this.numOfAddress++;
            }
            sender_register = 1;
            receiver_register = 1;
        }
    }
}

var a = new Mapping_table();
a.initialize();

module.exports = Mapping_table;