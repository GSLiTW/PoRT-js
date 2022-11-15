const fs = require('fs');
const MPT = require('../MPT/MPT');
const Pending_Txn_Pool = require('../Transaction/pending_transaction_pool');
const Blockchain = require('./blockchain');
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

function insertCSVData(quantity, data) {
  txns = [];
  for (let i = 1; i <= quantity; i++) {
    if (data[i][2] === wallet.publicKey.encode('hex')) {
      const sig = wallet.Sign(data[i][0]);
      const newTx = new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], sig, chain.MPT);
      // storeData(newTx, `./${port}.json`)
      const requestPromises = [];
      // console.log(chain.networkNodes);
      console.log('to tx broadcast');
      this.chain.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
          uri: networkNodeUrl + '/transaction/broadcast',
          method: 'POST',
          body: {NewTxs: newTx},
          json: true,
          retry: 2,
          delay: 10000,
        };

        requestPromises.push(rp(requestOptions));
      });

      Promise.all(requestPromises).then((data) => {
        console.log('Transaction created and broadcast successfully.');
      });
    }
  }
  return null;
};

/**
 * Set up all of following
 * wallet data,
 * designate initial value of creator/voter,
 * create initial block
 * transaction pool data
 */

Preprocess.prototype.initialize = function(port_address) {
  // insert data from csv
  this.data = fs
      .readFileSync('./data/node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
  console.log('data update succ');

  // init MPT
  this.tree = new MPT(true);
  for (let i = 0; i < this.port; i++) {
    if (i == 4) this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 1]);
    // dbit == 1 means creator
    else if (i == 15) {
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]);
    } // dbit == 2 means voter
    else if (i == 23) {
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]);
    } // dbit == 2 means voter
    else if (i == 36) {
      this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [1, 2]);
    } // dbit == 2 means voter
    else this.tree.Insert(this.data[i][1], 10, 10 * 0.0001, [0, 0]);
  }
  // init Blockchain
  this.chain = new Blockchain(this.tree);

  for (let i = 0, UpdateList = this.chain.chain[0].transactions; i < UpdateList.length; i++) {
    this.tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
  }

  // ? 這啥。。。
  this.tree.Cal_old_hash();
  this.tree.ResetSaved();

  // init Wallet
  const w = fs.readFileSync('./data/private_public_key.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
  this.wallet = new Wallet(w[port_address - 3000][1], w[port_address - 3000][2], 10);


  // init txs pool
  this.pending_txn_pool = new Pending_Txn_Pool();


  return;
};


/**
 * Generate node_address_mapping_table from csv file
 * @param  {int} num
 * @return {} data
 */
Preprocess.prototype.createTxs = function(num) {
  const csvdata = new CSV_data();
  const data_ = csvdata.getData(num);
  // get data of block_num
  if (num == 1 || num == 2) {
    console.log('add txn');
    return insertCSVData(4, data_);
  } else if (num == 3) {
    console.log('add txn2');
    return insertCSVData(4, data_);
  } else console.log('wrong block number.');
  return;
};

module.exports = Preprocess;
