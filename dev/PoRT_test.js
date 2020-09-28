const MPT = require("./MPT");
const Transaction_Pool = require("./transaction_pool.js");
const Pending_Transaction_Pool = require("./pending_transaction_pool.js");
const Mapping_table = require("./mapping_table");
const sha256 = require("sha256");

var mapping_table = new Mapping_table();
mapping_table.initialize();
var num_of_account = mapping_table.get_num_of_account();
var Tree = new MPT(true);
console.log(num_of_account);
for(var i = 0; i < num_of_account; i++) {
    if(i == 12) Tree.Insert(mapping_table.account[i].address, 10000000000);
    else if(i == 3) Tree.Insert(mapping_table.account[i].address, 10000000000);
    else Tree.Insert(mapping_table.account[i].address, mapping_table.account[i].tax);
}
Tree.Display(0);
var pending_txn_pool = new Pending_Transaction_Pool();
pending_txn_pool.create(2);

// 先把txn跑一遍, 把原本不在mapping_table中的node insert進去, tax一樣設10 * 0.0001
var num_of_txns = pending_txn_pool.get_num_of_transaction();
for(var i = 0; i < num_of_txns; i++) {
    if(!mapping_table.check_exist(pending_txn_pool.transactions[i].sender)) {
        Tree.Insert(pending_txn_pool.transactions[i].sender, 10 * 0.0001)
    }
    else if(!mapping_table.check_exist(pending_txn_pool.transactions[i].receiver)) {
        Tree.Insert(pending_txn_pool.transactions[i].receiver, 10 * 0.0001)
    }
}

for(var i = 0; i < num_of_txns; i++) {
    Tree.Search(pending_txn_pool.transactions[i].sender, '+', pending_txn_pool.transactions[i].value * 0.0001);
    Tree.Search(pending_txn_pool.transactions[i].receiver, '+', pending_txn_pool.transactions[i].value * 0.0001);
}

var T = Tree.TotalTax().toString();
var tmp = sha256(T + mapping_table.account[14].address);
var h = parseInt(tmp, 16) % T;
var next_maintainer = Tree.Select(h, 0, 0);
console.log(next_maintainer);