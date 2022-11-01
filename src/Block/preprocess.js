const fs = require("fs");
const MPT = require("../MPT/MPT");
const Pending_Txn_Pool = require("../Transaction/pending_transaction_pool");
const Block = require("./block");
const Blockchain = require("./blockchain");
const CSV_data = require('../Transaction/CSV_data');
const Wallet = require('../Utility/wallet');
/**
 * @class Function used to set up things required for our prototype demo
 * The main data structure is following 
 * @port is size of the ports : 3001-3xxx ports
 * @chian is the blockchain 
 * @tree is init MPT structure 
 * @block is genesisBlock 
 * ? @data is txs 
 */


function Preprocess() {
  this.port=14,
  this.chain, 
  this.tree,
  this.pending_txn_pool,
  this.wallet,
  this.data; // split each line to array
  
}

// function insertCSVData(quantity, data) {
//   txns = [];
//   for (let i = 1; i < quantity; i++) {
//     txns.push(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], this.tree));
//   }
//   return txns;
// };
// function createtxs(num) {
//   const csvdata = new CSV_data();
//   if (num == 1 || num == 2) {
//     return insertCSVData(4, data_);
//   } else if (num == 3) {
//     return insertCSVData(4, data_);
//   } else console.log('wrong block number.');
// };



/**
 * Set up all of following 
 * wallet data, 
 * designate initial value of creator/voter,
 * create initial block  
 * transaction pool data
 */

Preprocess.prototype.initialize = function (port_address) {
  // insert data from csv
  this.data = fs
  .readFileSync("./data/node_address_mapping_table.csv")
  .toString() // convert Buffer to string
  .split("\n") // split string to lines
  .map((e) => e.trim()) // remove white spaces for each line
  .map((e) => e.split(",").map((e) => e.trim())); // split each line to array
  console.log("data update succ");

  //init MPT 
  this.tree = new MPT(true);
  for (let i = 0; i < this.port; i++) {
    if (i == 4) this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 1]);
    // dbit == 1 means creator
    else if (i == 15)
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else if (i == 23)
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else if (i == 36)
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]); // dbit == 2 means voter
    else this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [0, 0]);
  }
  //init Blockchain 
  this.chain = new Blockchain(this.tree);

for (let i = 0, UpdateList = this.chain.chain[0].transactions; i < UpdateList.length; i++) {
  this.tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
}
// ? 這啥。。。
this.tree.Cal_old_hash();
this.tree.ResetSaved();
  
//init Wallet
  let w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
  this.wallet = new Wallet(w[port_address - 3000][1], w[port_address - 3000][2], 10);



// init txs pool 
this.pending_txn_pool = new Pending_Txn_Pool();

  
  return 
};


/**
 * Generate node_address_mapping_table from csv file
 * @return {} data
 */
Preprocess.prototype.getData = function () {
  
 
};

module.exports = Preprocess;
