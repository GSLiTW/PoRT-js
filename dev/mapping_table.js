const json2csv = require('json2csv').parse;
const fs = require('fs');
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
    pending_txn_pool.create(1);
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

Mapping_table.prototype.get_account = function() {
    return this.account;
}

Mapping_table.prototype.createJSONFile = function(num) {
    var address_arr = [];
    var balance_arr = [];
    var creator_bit_arr = [];
    var voter_bit_arr = [];
    var transactions_arr = [];
    if(num == 1 || num == 2) numOfAccount = 43;
    else if(num == 3) numOfAccount = 49;
    else return -1;
    for(var i = 0; i < numOfAccount; i++) {
        address_arr[i] = this.account[i].address;
        balance_arr[i] = this.account[i].balance;
        creator_bit_arr[i] = this.account[i].creator_bit;
        voter_bit_arr[i] = this.account[i].voter_bit;
        transactions_arr[i] = this.account[i].transactions;
    }
    const data = {
        address: address_arr,
        balance: balance_arr,
        creator_bit: creator_bit_arr,
        voter_bit: voter_bit_arr,
        transactions: transactions_arr
    };

    const str = JSON.stringify(data,null,"\t")

    fs.writeFile('block_status.json', str, (err) => {
        if (err) throw err;
        console.log('file saved');
    });
}

// var a = new Mapping_table();
// a.initialize();
// a.createJSONFile(1);

module.exports = Mapping_table;
