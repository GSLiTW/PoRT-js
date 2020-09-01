const fs = require('fs');
const MPT = require('./MPT');
const Pending_Txn_Pool = require('./pending_transaction_pool');
const Block = require('./block');

function Preprocess() {
    this.chain,
    this.tree,
    this.pending_txn_pool
}

Preprocess.prototype.initialize = function() {
    var data = fs.readFileSync('node_address_mapping_table.csv')
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim())); // split each line to array
    console.log(data[0][1]);
    var Tree = new MPT(true);
    for(var i = 0; i < 43; i++) {
        if(i == 4) Tree.Insert(data[i][1], 10, 10 * 0.0001, 1); // dbit == 1 means creator
        else if(i == 15) Tree.Insert(data[i][1], 10, 10 * 0.0001, 2); // dbit == 2 means voter
        else if(i == 23) Tree.Insert(data[i][1], 10, 10 * 0.0001, 2); // dbit == 2 means voter
        else if(i == 36) Tree.Insert(data[i][1], 10, 10 * 0.0001, 2); // dbit == 2 means voter
        else Tree.Insert(data[i][1], 10, 10 * 0.0001, 0);
    }
    this.tree = Tree;

    this.pending_txn_pool = new Pending_Txn_Pool();
    this.pending_txn_pool.create(1);

    var block = new Block(0, this.pending_txn_pool.get_transaction(), 0);
}

module.exports = Preprocess;

// var p = new Preprocess();
// p.initialize();