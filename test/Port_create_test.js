test("#PORT_test: func", () => {
 /* eslint-disable max-len */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3001;
const rp = require('promise-request-retry');
const CSV_data = require('../src/Transaction/CSV_data');
const fs = require('fs');

// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require('../src/Block/blockchain.js');
const Transaction = require('../src/Transaction/transaction');
const MPT = require('../src/MPT/MPT');
const Pending_Txn_Pool = require('../src/Transaction/Pending_transaction_pool');
const Wallet = require('../src/Utility/wallet');
const backup = require('../src/Utility/backup');

const Backup = new backup();
const Creator = require('../src/Creator/creator');
const Voter = require('../src/Voter/voter');

const Block = require('../src/Block/block.js');

const Cosig = require('../src/cosig.js');


// will be set to false in ("/Creator/GetBlock")
let CreatorStartThisRound = false; // if true, means Creator already call ("Creator"), don't let him call again
let FirstRoundLock = false; // if is true, means ("/Creator/Challenge") overtime, Creator will not wait for rest of voters
let FirstRountSetTimeout = null; // record setTimeout in ("/Creator/Challenge"), confirm that only one timeout a time
let FirstRoundVoterNum = 0; // record when First Round Lock, how many Voters attend this round
let GetResponsesSetTimeout = null;

// preprocess
const data = fs.readFileSync('./data/node_address_mapping_table.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

let w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
console.log("w:"+w[1][1])
const wallet = new Wallet(w[port - 3000][1], w[port - 3000][2], 10);
w = undefined;


const Tree = new MPT(true);

for (let i = 0; i < 14; i++) {
  if (i == 2) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
  else if (i == 4) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
  else if (i == 6) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
  else if (i == 8) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
  else Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
}


const chain = new Blockchain(Tree);

for (let i = 0, UpdateList = chain.chain[0].transactions; i < UpdateList.length; i++) {
  Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
}

Tree.Cal_old_hash();
Tree.ResetSaved();

const pending_txn_pool = new Pending_Txn_Pool();

function insertCSVData(quantity, data) {
  txns = [];
  for (let i = 1; i < quantity; i++) {
    txns.push(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], Tree));
  }
  return txns;
};

function createtxs(num) {
  const csvdata = new CSV_data();
  const data_ = csvdata.getData(num); // get data of block1
  if (num == 1 || num == 2) {
    return insertCSVData(4, data_);
  } else if (num == 3) {
    return insertCSVData(4, data_);
  } else console.log('wrong block number.');
};


pending_txn_pool.addTxs(createtxs(2));

let tempData;
  const dataFile = fs.readFileSync('./src/tempBlock.json');
  try {
    tempData = JSON.parse(dataFile);
    // console.log('JSON string:', 'utf8', genesisData);
  } catch (err) {
    console.log('Error parsing JSON string:', err);
  }
  let tempBlock = new Block(2, pending_txn_pool.transactions, chain.chain[0].hash, Tree);
  console.log("tempData: "+tempData);
  tempBlock.hash = tempData.hash;  
  tempBlock.timestamp = tempData.timestamp;
  // genesisBlock.hash = genesisData.hash;
  tempBlock.nextCreator = tempData.nextCreator;
  tempBlock.nextVoters = tempData.nextVoters;
  console.log("tempBlock:"+tempBlock);
pending_txn_pool.clean();
pending_txn_pool.addTxs(createtxs(3));
});

