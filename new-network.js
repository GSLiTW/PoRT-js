/* eslint-disable max-len */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.argv[2];
const rp = require('promise-request-retry');
const fs = require('fs');
const elliptic = require('elliptic');

// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require('./Block/blockchain.js');
const Transaction = require('./Transaction/transaction');
const MPT = require('./MPT/MPT');
const Pending_Txn_Pool = require('./Transaction/pending_transaction_pool');
const Wallet = require('./Utility/wallet');
const backup = require('./Utility/backup');
const CSV_data = require('./Transaction/CSV_data');
const Creator = require('./Creator/creator');
const Voter = require('./Voter/voter');
const Block = require('./Block/block.js');
const Cosig = require('./cosig.js');

// constructor
const Backup = new backup();
const chain = new Blockchain();

// preprocess


// constants
const BASE = 1000000000000;