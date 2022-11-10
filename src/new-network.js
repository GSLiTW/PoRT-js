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


// constants
const BASE = 1000000000000;

// Lock
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
const wallet = new Wallet(w[port - 3000][1], w[port - 3000][2], 10);

w = undefined;

// temp insert tx function
function insertCSVData(quantity, data) {
  txns = [];
  for (let i = 1; i <= quantity; i++) {
    if(data[i][2] === wallet.publicKey.encode('hex')){
      const sig = wallet.Sign(data[i][0])
      const newTx = new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], sig, chain.MPT);
      const requestPromises = [];
      console.log(chain.networkNodes)
      chain.networkNodes.forEach((networkNodeUrl) => {
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

function createtxs(num) {
  const csvdata = new CSV_data();
  const data_ = csvdata.getData(num); // get data of block1
  if (num == 1 || num == 2) {
    return insertCSVData(4, data_);
  } else if (num == 3) {
    return insertCSVData(4, data_);
  } else console.log('wrong block number.');
};

// create a blockchain
let chain = new Blockchain();

// register nodes initially
if (port >= 3002) {
  for (let p = port - 2; p < port; p++) {
    const newNodeUrl = 'http://localhost:' + p;
    console.log("a");
    if (chain.networkNodes.indexOf(newNodeUrl) == -1) {
      chain.networkNodes.push(newNodeUrl);
    }

    const regNodesPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/register-node',
        method: 'POST',
        body: {newNodeUrl: newNodeUrl},
        json: true,
        retry: 10,
        delay: 10000,
      };

      regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises).then((data) => {
      // use the data
      const bulkRegisterOptions = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: {allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl]},
        json: true,
        retry: 10,
        delay: 1000,
      };

      return rp(bulkRegisterOptions);
    });
  }
}

createtxs(2)
createtxs(3)
seqList = [0];

// register a new node and broadcast it to network nodes
app.get('/register-and-broadcast-node', function(req, res) {
  const newNodeUrl = 'http://localhost:' + port;
  console.log("b");
  if (chain.networkNodes.indexOf(newNodeUrl) == -1) {
    chain.networkNodes.push(newNodeUrl);
  }

  const regNodesPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: {newNodeUrl: newNodeUrl},
      json: true,
    };

    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises).then((data) => {
    // use the data
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/register-nodes-bulk',
      method: 'POST',
      body: {allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl]},
      json: true,
    };

    return rp(bulkRegisterOptions);
  })
      .then((data) => {
        res.json({note: 'New node registered with network successfully.'});
      });
});

// network nodes register the new node
app.post('/register-node', function (req, res) {
  console.log("c");
  const newNodeUrl = req.body.newNodeUrl;
  console.log("d");
  const nodeNotAlreadyPresent = chain.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = chain.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    chain.networkNodes.push(newNodeUrl);
  }
  res.json({note: 'New node registerd successfully with node.'});
});

// new node registers all network nodes
app.post('/register-nodes-bulk', function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent = chain.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
      chain.networkNodes.push(networkNodeUrl);
    }
  });

  res.json({note: 'Bulk registeration successful.'});
});

// add tx to txpool
app.post('/transaction/launch', function(req, res) {
  const newTransaction = Transaction('1000', 'Amy', 'John');
  const isexist = chain.addTransactionToPendingTransaction(newTransaction);
  const requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction/broadcast',
      method: 'POST',
      body: {NewTxs: newTransaction},
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises).then((data) => {
    res.json({note: 'Transaction created and broadcast successfully.'});
  });
});

app.post('/transaction/AddTx', function(req, res) {
  const rawtx = req.body.NewTx;
  const sig = wallet.Sign(rawtx.id);
  const newTransaction = new Transaction(rawtx.id, rawtx.sender, rawtx.receiver, rawtx.value, sig.recoveryParam, sig.r, sig.s, Tree);
  console.log(newTransaction);
  const isexist = chain.addTransactionToPendingTransaction(newTransaction);

  if (!isexist) {
    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/transaction/broadcast',
        method: 'POST',
        body: {NewTxs: newTransaction},
        json: true,
      };

      requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then((data) => {
      res.json({note: 'Transaction created and broadcast successfully.'});
    });
  }
});
app.post('/transaction/broadcast', function(req, res) {
  const isexist = chain.addTransactionToPendingTransaction(req.body.NewTxs);
  
  if (!isexist) {
    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/transaction/broadcast',
        method: 'POST',
        body: {NewTxs: req.body.NewTxs},
        json: true,
      };

      requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then((data) => {
      res.json({note: 'Transaction created and broadcast successfully.'});
    });
  }
});

// get blockchain
app.get('/blockchain', function(req, res) {
  res.send(chain);
});
// get wallet
app.get('/wallet', function(req, res) {
  res.send({wallet: wallet, backupinfo: Backup});
});


// Creator start
app.get('/Creator', function(req, res) {
  console.log('********** Creator start  **********');
  creator = new Creator(port, wallet, chain);


  if (creator.isValid() && !CreatorStartThisRound) {
    CreatorStartThisRound = true;
    const currentdate = new Date();
    const datetime = 'Last Sync: ' + currentdate.getDate() + '/' +
            (currentdate.getMonth() + 1) + '/' +
            currentdate.getFullYear() + ' @ ' +
            currentdate.getHours() + ':' +
            currentdate.getMinutes() + ':' +
            currentdate.getSeconds() + '.' +
            currentdate.getMilliseconds();

    // creator construct tempBlock
    blockToVote = creator.constructNewBlock(this.blockchain.txn_pool);
    creator.startCosig();
    const seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);
    for (let i=0; i<seqList.length; i++) {
      console.log(seqList[i]);
    }

    // Broadcast to find Voters
    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/Voter',
        method: 'POST',
        body: {SeqNum: seq, CreatorUrl: chain.currentNodeUrl},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });

    res.json({
      SeqNum: seq, CreatorUrl: chain.currentNodeUrl, Time: datetime, tempBlock: tempBlock,
    });
  } else {
    creator = null;

    res.json('Error: Not Creator');
  }
});

// voter start
app.post('/Voter', function(req, res) {
  console.log('********** Voter start  **********');
  const seq = req.body.SeqNum;

  if (seqList.indexOf(seq) == -1) {
    voter = new Voter(port, wallet, chain);
    if (voter.IsValid()) {
      // console.log('i am voter');

      voter.CreatorUrl(req.body.CreatorUrl);

      const requestPromises = [];

      const requestOptions = {
        uri: voter.CreatorUrl + '/Creator/Challenge',
        method: 'POST',
        body: {VoterUrl: chain.currentNodeUrl,
          publicKey: wallet.publicKey.encode('hex'),
          publicV: voter.publicV.encode('hex')},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    } else {
      voter = null;
    }

    seqList.push(seq);


    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/Voter',
        method: 'POST',
        body: {SeqNum: seq, CreatorUrl: req.body.CreatorUrl},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  }

  res.json('Voter triggered');
});



app.post('/Creator/Challenge', function(req, res) {
  console.log('********** Creator/Challenge start  **********');
  const VoterUrl = req.body.VoterUrl;
  const VoterPubKeyHex = req.body.publicKey;
  const VoterPubVHex = req.body.publicV;

  const VoterPubKey = wallet.PublicKeyFromHex(VoterPubKeyHex);
  const VoterPubV = wallet.PublicKeyFromHex(VoterPubVHex);

  creator.getVoter(VoterUrl, VoterPubKey, VoterPubV);
  console.log('there are ' + creator.voterUrl.length + ' Voter now');
  if (creator.voterUrl.length == VOTER_NUM && !FirstRoundLock) {
    // if there is a Timeout before, clear it first, since every voter come
    if (FirstRountSetTimeout) {
      clearTimeout(FirstRountSetTimeout);
    }
    FirstRoundLock = true;
    FirstRoundVoterNum = creator.voterUrl.length;

    const challenge = creator.generateChallenge();
    const requestPromises = [];
    let index = 0;
    creator.voterUrl.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/Voter/Response',
        method: 'POST',
        body: {
          index: index,
          challenge: challenge,
          message: creator.block,
        },
        json: true,
      };
      index = index + 1;
      requestPromises.push(rp(requestOptions));
    });
  } else {
    // if there is a Timeout before, clear it first
    if (FirstRountSetTimeout) {
      clearTimeout(FirstRountSetTimeout);
    }

    // wait for 5 sec, if no voter comes, then do next step
    FirstRountSetTimeout = setTimeout(()=>{
      if (creator.voterUrl.length != VOTER_NUM && !FirstRoundLock) {
        // check if any voter come in this 10 sec
        const challenge = creator.generateChallenge();
        FirstRoundLock = true;
        FirstRoundVoterNum = creator.voterUrl.length;

        const requestPromises = [];
        let index = 0;
        creator.voterUrl.forEach((networkNodeUrl) => {
          const requestOptions = {
            uri: networkNodeUrl + '/Voter/Response',
            method: 'POST',
            body: {
              index: index,
              challenge: challenge,
              message: creator.block,
            },
            json: true,
          };
          index = index + 1;
          requestPromises.push(rp(requestOptions));
        });
      }
    }, 5000);
  }

  res.json('GetVoters success!');
});


app.post('/Voter/Response', function(req, res) {
  console.log('********** Voter/Response start  **********');
  const isBlockValid = voter.VerifyBlock(req.body.message);
  console.log('block is valid: ' + isBlockValid);
  if (isBlockValid) {
    const challenge = req.body.challenge;
    const index = req.body.index;

    const response = voter.GenerateResponse(challenge);

    const requestPromises = [];

    const requestOptions = {
      uri: voter.CreatorUrl + '/Creator/GetResponses',
      method: 'POST',
      body: {
        response: response,
        index: index,
        challenge: challenge,
      },
      json: true,
    };
    requestPromises.push(rp(requestOptions));

    res.json('Response Generated');
  } else {
    console.log('Error: Block verification failed !');
  }
});


app.post('/Creator/GetResponses', function(req, res) {
  console.log('********** Creator/GetResponses start  **********');
  if (req.body.challenge == creator.getChallenge()) {
    console.log('test');
    const response = req.body.response;
    creator.getResponses(response);
    creator.setVoterIndex(req.body.index);

    if (creator.voterResponse.length == FirstRoundVoterNum) {
      if (GetResponsesSetTimeout) {
        clearTimeout(GetResponsesSetTimeout);
      }
      console.log('there are' + creator.voterResponse.length + ' Voter now');
      creator.aggregateResponse();

      const seq = seqList[seqList.length - 1] + 1;

      const requestPromises = [];
      const requestOptions = {
        uri: 'http://localhost:' + creator.port + '/Creator/GetBlock',
        method: 'POST',
        body: {seqNum: seq},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    } else {
      // if there is a Timeout before, clear it first
      if (GetResponsesSetTimeout) {
        clearTimeout(GetResponsesSetTimeout);
      }

      // wait for 5 sec, if no voter comes, then do next step
      GetResponsesSetTimeout = setTimeout(()=>{
        creator.clearResponses();
        challenge = creator.generateChallengeWithIndex();
        creator.VoterIndex.forEach((index) => {
          const requestOptions = {
            uri: creator.voterUrl[index] + '/Voter/Response',
            method: 'POST',
            body: {
              index: index,
              challenge: challenge,
              message: creator.block,
            },
            json: true,
          };
          requestPromises.push(rp(requestOptions));
        });
      }, 5000);
    }
    res.sendStatus(200);
  }
});


app.post('/Creator/GetBlock', function(req, res) {
  console.log('********** Creator/GetBlock start  **********');
  let seq = req.body.seqNum;// has fault

  if (seqList.indexOf(seq) == -1) {
    seqList.push(seq);

    console.log('Cal_old_hash start');
    if (!Tree.saved) {
      Tree.Cal_old_hash();
    }


    console.log('before delete all tx: '+pending_txn_pool.transactions);
    console.log('after delete all tx: '+pending_txn_pool.transactions);


    const currentdate = new Date();
    const datetime = 'Last Sync: ' + currentdate.getDate() + '/' +
            (currentdate.getMonth() + 1) + '/' +
            currentdate.getFullYear() + ' @ ' +
            currentdate.getHours() + ':' +
            currentdate.getMinutes() + ':' +
            currentdate.getSeconds() + '.' +
            currentdate.getMilliseconds();
    console.log(datetime);

    seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/update-blockchain',
        method: 'POST',
        body: {SeqNum: seq, Blockchain: creator.blockchain},
        json: true,
      };
      rp(requestOptions);
    });
    CreatorStartThisRound = false;
    FirstRoundLock = false;
    FirstRoundVoterNum = 0;
    FirstRountSetTimeout = null;
    GetResponsesSetTimeout = null;
    res.send('Create Block Succeed.');
  } else {
    res.sendStatus(200);
  }
});

app.post('/update-blockchain', function (req, res) {
  const  seq = req.body.SeqNum;
  let updatedChain = req.body.Blockchain;
  if (seqList.indexOf(seq) == -1) {
    chain = updatedChain;

    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/update-blockchain',
        method: 'POST',
        body: { SeqNum: seq, Blockchain: updatedChain },
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  }
  else {
    res.sendStatus(200);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port} ...`);
});