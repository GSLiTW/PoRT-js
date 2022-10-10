const fs = require('fs');
const MPT = require('../MPT/MPT');
const Pending_Txn_Pool = require('../Transaction/pending_transaction_pool');
const Block = require('./block');

/**
 * @class Function used to set up things required for our prototype demo
 */

function Preprocess() {
  this.chain,
  this.tree,
  this.pending_txn_pool;
}

/**
 * Set up all wallet data, designate initial value of creator/voter, and create initial block and transaction pool data
 */
Preprocess.prototype.initialize = function() {
  const data = fs.readFileSync('node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
  console.log(data[0][1]);
  const Tree = new MPT(true);
  for (let i = 0; i < 43; i++) {
    if (i == 4) Tree.Insert(data[i][1], 10, 10 * 0.0001, [1, 1]); // dbit == 1 means creator
    else if (i == 15) Tree.Insert(data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else if (i == 23) Tree.Insert(data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else if (i == 36) Tree.Insert(data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else Tree.Insert(data[i][1], 10, 10 * 0.0001, [0, 0]);
  }
  this.tree = Tree;

  this.pending_txn_pool = new Pending_Txn_Pool();
  this.pending_txn_pool.create(1);

  const block = new Block(0, this.pending_txn_pool.get_transaction(), 0);
};

module.exports = Preprocess;

// var p = new Preprocess();
// p.initialize();
