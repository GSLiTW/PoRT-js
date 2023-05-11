/* eslint-disable max-len */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.argv[2];
const rp = require('promise-request-retry');
const web3 = require('web3');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require('./Block/blockchain.js');
const Transaction = require('./Transaction/transaction');
const backup = require('./Utility/backup');
const CSV_data = require('./Transaction/CSV_data');
const Backup = new backup();
const Creator = require('./Creator/creator');
const Voter = require('./Voter/voter');
const Wallet = require('./Utility/wallet');
const MPT = require('./MPT/MPT.js');
const tx_pool = require('./Transaction/pending_transaction_pool');
const nodeVal = require('./NodeVal');

// constants
const BASE = 1000000000000;

// will be set to false in ("/Creator/GetBlock")
let CreatorStartThisRound = false; // if true, means Creator already call ("Creator"), don't let him call again
let FirstRoundLock = false; // if is true, means ("/Creator/Challenge") overtime, Creator will not wait for rest of voters
let FirstRountSetTimeout = null; // record setTimeout in ("/Creator/Challenge"), confirm that only one timeout a time
let FirstRoundVoterNum = 0; // record when First Round Lock, how many Voters attend this round
let GetResponsesSetTimeout = null;

// preprocess
let chain = new Blockchain();
// init Wallet
const w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
const wallet = new Wallet(w[port - 3000][1], w[port - 3000][2], 10);
console.log('publickey: ', wallet.publicKey.encode('hex'));

// functions
function insertCSVData(quantity, data) {
  console.log('start insertCSVData');
  txns = [];
  for (let i = 1; i <= quantity; i++) {
    if (data[i][2] === wallet.publicKey.encode('hex')) {
      const sig = wallet.Sign(data[i][0]);
      const newTx = new Transaction(data[i][0], data[i][2], data[i][3], Number(data[i][4]), sig, chain.MPT);
      // storeData(newTx, `./${port}.json`)
      const requestPromises = [];
      // console.log(chain.networkNodes);
      console.log('to tx broadcast');
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
  const data_ = csvdata.getData(num);
  if (num >= 3 && num <= 5) {
    return insertCSVData(4, data_);
  } else console.log('wrong block number.');
}


if (port != 3000) {
  const newNodeUrl = 'http://localhost:' + port;
  const headNodeUrl = 'http://localhost:' + '3000';
  if (chain.networkNodes.indexOf(headNodeUrl) == -1) {
    chain.networkNodes.push(headNodeUrl);
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

  Promise.all(regNodesPromises).then((res) => {
    // chain.networkNodes.push(...res[0].nodes)
    const allNetworkNodes = res[0].nodes;
    allNetworkNodes.forEach((networkNodeUrl) => {
      const nodeNotAlreadyPresent =
        chain.networkNodes.indexOf(networkNodeUrl) == -1;
      const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
      if (nodeNotAlreadyPresent && notCurrentNode) {
        chain.networkNodes.push(networkNodeUrl);
      }
    });
  });
}

// createtxs(3);
function instantiateNode(value) {
  Object.setPrototypeOf(value, nodeVal.prototype);
}

function instantiateMPT(Tree) {
  Object.setPrototypeOf(Tree, MPT.prototype);
  if (Tree.mode == 'leaf') {
    return instantiateNode(Tree.value); ;
  } else if (Tree.next !== null) {
    return instantiateMPT(Tree.next);
  } else {
    return Tree.branch.forEach((brch) => {
      if (brch !== null) {
        instantiateMPT(brch);
      }
    });
  }
}

seqList = [0];

const swaggerDocument = require('../swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function(req, res) {
  // #swagger.tags = ['Blockchain']
  // #swagger.description = 'return whole current blockchain.'
  // #swagger.parameters['id'] = { description: 'ID do usuário.' }

  /* #swagger.parameters['filtro'] = {
    in: 'query',
          description: 'Um filtro qualquer.',
          type: 'string'
  } */
  res.send(chain);
});

app.get('/wallet', function(req, res) {
  // #swagger.tags = ['Blockchain']
  // #swagger.description = 'return user wallet and wallet backup info.'
  res.send({wallet: wallet, backupinfo: Backup});
});

app.get('/MPT', function(req, res) {
  // #swagger.tags = ['Blockchain']
  // #swagger.description = 'return current MPT of current blockchain.'
  res.send(chain.MPT);
});

app.get('/transaction-pool', function(req, res) {
  // #swagger.tags = ['Blockchain']
  // #swagger.description = 'return current transaction pool.'
  res.send(chain.txn_pool);
});

app.get('/inserttx/:blocknum', (req, res) => {
  // #swagger.tags = ['Blockchain']
  // #swagger.description = 'return whole current blockchain.'
  // #swagger.parameters['blocknum'] = { description: 'The number of block to insert into transaction pool.' }
  const blocknum = req.params.blocknum;
  createtxs(blocknum);
  requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/searchsender',
      method: 'POST',
      body: {blocknum: blocknum},
      json: true,
    };

    requestPromises.push(rp(requestOptions));
  });

  res.send(port);
});

app.post('/searchsender', (req, res) => {
  const blocknum = req.body.blocknum;
  createtxs(blocknum);

  // requestPromises = [];
  // chain.networkNodes.forEach((networkNodeUrl) => {
  //   const requestOptions = {
  //     uri: networkNodeUrl + '/searchsender',
  //     method: 'POST',
  //     body: {blocknum: blocknum},
  //     json: true,
  //   };

  //   requestPromises.push(rp(requestOptions));
  // });
});

app.get('/MPT/Search/:key', function(req, res) {
  const key = req.params.key;
  res.json({key: key, balance: chain.MPT.Search(key)});
});


app.get('/transaction/third-block', function(req, res) {
  res.json({note: `push transactions of the third etherscan into pending txn pool.`});
});

app.post('/transaction/launch', function(req, res) {
  const newTransaction = Transaction('1000', 'Amy', 'John');
  const isexist = chain.addTransactionToPendingTransaction(newTransaction);
  const requestPromises = [];
  console.log('to tx broadcast in launch');
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
  const newTransaction = new Transaction(rawtx.id, rawtx.sender, rawtx.receiver, rawtx.value, sig, chain.MPT);
  // console.log(newTransaction);
  const isexist = chain.addTransactionToPendingTransaction(newTransaction);

  if (!isexist) {
    const requestPromises = [];
    console.log('to tx broadcast in AddTx');
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


app.post('/transaction/port2portTx', function(req, res) {
  const receiverPort = req.body.receiverPort;
  const sendValue = req.body.sendValue;
  const senderPUbKey = wallet.getPubKey(Number(port));
  const receiverPUbKey = wallet.getPubKey(Number(receiverPort));
  const txid = web3.utils.keccak256(senderPUbKey+receiverPUbKey+sendValue);
  // console.log(txid);
  const sig = wallet.Sign(txid);
  const newTransaction = new Transaction(txid, senderPUbKey, receiverPUbKey, sendValue, sig, chain.MPT);
  const isexist = chain.addTransactionToPendingTransaction(newTransaction);
  res.send('done')

  if (!isexist) {
    const requestPromises = [];
    console.log('to tx broadcast in port2portTx');
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
  // console.log(req.body.NewTxs);
  if (!isexist && chain.txn_pool.validate(req.body.NewTxs)) {
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
      res.json('sent')
    });
  }
});

app.get('/PKA', function(req, res) {
  res.send(Backup.pka);
});

app.post('/addPKA/:port', function(req, res) {
  const trusteeport = req.params.port;
  const requestPromises = [];
  const requestOptions = {
    uri: 'http://localhost:' + trusteeport + '/returnPK',
    method: 'POST',
    body: {
      note: 'hello from owner',
      ownerPort: port,
    },
    json: true,
  };
  requestPromises.push(rp(requestOptions));
  Promise.all(requestPromises).then((data) => {
    res.json({PKA: Backup.pka});
  });
});

app.post('/returnPK', function(req, res) {
  const ownerport = req.body.ownerPort;
  const requestPromises = [];
  const requestOptions = {
    uri: 'http://localhost:' + ownerport + '/getPK',
    method: 'POST',
    body: {
      note: 'respones from trustee',
      trusteePK: wallet.publicKey,
      trusteeport: port,
    },
    json: true,
  };
  requestPromises.push(rp(requestOptions));
  Promise.all(requestPromises).then((data) => {
    res.json({note: 'return pk finish'});
  });
});

app.post('/getPK', function(req, res) {
  Backup.pka[req.body.trusteeport] = req.body.trusteePK;
  res.json({note: 'get PK finish'});
});

app.post('/deletePKA/:port', function(req, res) {
  delete Backup.pka[req.params.port];
  res.json({PKA: Backup.pka});
});

app.get('/backup', async function(req, res) {
  let count = 0;
  let i;
  for (i in Backup.pka) {
    count++;
  }
  if (count < 6) {
    res.json({message: 'Please add more trustee !'});
  } else {
    myPrivateKey = wallet.privateKey;
    await Backup.init(myPrivateKey);
    res.json({message: 'create file success !'});
  }
});

app.post('/recoveryReq/:trusteeport', function(req, res) {
  const data = Backup.inputfile();
  const file = JSON.parse(data);
  const pkshar = file['PK_Shares'];
  const trusteeUrl = 'http://localhost:' + req.params.trusteeport;
  const requestPromises = [];
  const requestOptions = {
    uri: trusteeUrl + '/decrypt',
    method: 'POST',
    body: {
      share: pkshar,
      publicKey: wallet.publicKey,
      ownerurl: 'http://localhost:' + port,
    },
    json: true,
  };

  requestPromises.push(rp(requestOptions));
  Promise.all(requestPromises).then((data) => {
    res.json({
      message: 'finish',
      share: Backup.recoveryshare,
    });
  });
});

app.post('/recoveryReq', function(req, res) {
  const data = Backup.inputfile();
  const file = JSON.parse(data);
  const pkshar = file['PK_Shares'];
  const requestPromises = [];
  for (const i in Backup.pka) {
    const trusteeUrl = 'http://localhost:' + i;
    const requestOptions = {
      uri: trusteeUrl + '/decrypt',
      method: 'POST',
      body: {
        share: pkshar,
        publicKey: wallet.publicKey,
        ownerurl: 'http://localhost:' + port,
      },
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  }
  Promise.all(requestPromises).then((data) => {
    res.json({
      message: 'finish',
      share: Backup.recoveryshare,
    });
  });
});

app.post('/decrypt', async function(req, res) {
  ownerShare = await Backup.recovery(
      wallet.privateKey,
      req.body.publicKey,
      req.body.share,
  );

  const requestPromises = [];
  const requestOptions = {
    uri: req.body.ownerurl + '/getResponse',
    method: 'POST',
    body: {
      share: ownerShare,
    },
    json: true,
  };
  requestPromises.push(rp(requestOptions));
  Promise.all(requestPromises).then((data) => {
    res.json({
      message: 'success',
      decript_share: ownerShare,
    });
  });
});

app.post('/getResponse', function(req, res) {
  const share = req.body.share;
  // console.log(share);
  Backup.recoveryshare.push(share);
  res.json({shares: Backup.recoveryshare});
});

app.get('/combine', function(req, res) {
  const data = Backup.inputfile();
  const file = JSON.parse(data);
  const tksk = file['TK_SK'];
  res.json({your_privateKey: Backup.combine(Backup.recoveryshare, tksk)});
});

// register a new node and broadcast it to network nodes
app.get('/register-and-broadcast-node', function(req, res) {
  const newNodeUrl = 'http://localhost:' + port;
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

  Promise.all(regNodesPromises)
      .then((data) => {
      // use the data
        const bulkRegisterOptions = {
          uri: newNodeUrl + '/register-nodes-bulk',
          method: 'POST',
          body: {
            allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl],
          },
          json: true,
        };

        return rp(bulkRegisterOptions);
      })
      .then((data) => {
        res.json({note: 'New node registered with network successfully.'});
      });
});

// network nodes register the new node
app.post('/register-node', function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = chain.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = chain.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode) {
    chain.networkNodes.push(newNodeUrl);
  }
  res.json({nodes: chain.networkNodes});

  if (port == 3000) {
    chain.networkNodes.forEach((node) => {
      const regNodesPromises = [];
      chain.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
          uri: node + '/register-nodes-bulk',
          method: 'POST',
          body: {allNetworkNodes: [newNodeUrl]},
          json: true,
          retry: 10,
          delay: 10000,
        };
        regNodesPromises.push(rp(requestOptions));
      });
    });
  }
});

// new node registers all network nodes
app.post('/register-nodes-bulk', function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent =
      chain.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
      chain.networkNodes.push(networkNodeUrl);
    }
  });

  res.json({note: 'Bulk registeration successful.'});
});

app.get('/block/:blockHash', function(req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = chain.getBlock(blockHash);
  res.json({
    block: correctBlock,
  });
});

app.get('/transaction/:transactionId', function(req, res) {
  const transactionId = req.params.transactionId;
  const transactionData = chain.getTransaction(transactionId);
  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block,
  });
});

app.get('/address/:address', function(req, res) {
  const address = req.params.address;
  const addressData = chain.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

app.get('/block-explorer', function(req, res) {
  res.sendFile('./block-explorer/index.html', {root: __dirname});
});

app.get('/Creator', function(req, res) {
  console.log('********** Creator start  **********');
  creator = new Creator(port, wallet, chain);

  if (creator.isValid() && !CreatorStartThisRound) {
    CreatorStartThisRound = true;
    const currentdate = new Date();
    const datetime =
      'Last Sync: ' +
      currentdate.getDate() +
      '/' +
      (currentdate.getMonth() + 1) +
      '/' +
      currentdate.getFullYear() +
      ' @ ' +
      currentdate.getHours() +
      ':' +
      currentdate.getMinutes() +
      ':' +
      currentdate.getSeconds() +
      '.' +
      currentdate.getMilliseconds();

    blockToVote = creator.constructNewBlock(chain.txn_pool);
    creator.startCosig();

    const seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);
    for (let i = 0; i < seqList.length; i++) {
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
      SeqNum: seq, CreatorUrl: chain.currentNodeUrl, Time: datetime, tempBlock: blockToVote,
    });
  } else {
    creator = null;

    res.json('Error: Not Creator');
  }
});

app.post('/Voter', function(req, res) {
  console.log('********** Voter start  **********');
  const seq = req.body.SeqNum;

  if (seqList.indexOf(seq) == -1) {
    voter = new Voter(port, wallet, chain);
    if (voter.isValid()) {
      console.log('this is a voter');
      voter.creatorUrl(req.body.CreatorUrl);

      const requestPromises = [];

      const requestOptions = {
        uri: voter.CreatorUrl + '/Creator/Challenge',
        method: 'POST',
        body: {
          VoterUrl: chain.currentNodeUrl,
          publicKey: wallet.publicKey.encode('hex'),
          publicV: voter.publicV.encode('hex'),
        },
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    } else {
      voter = null;
      res.json('Error: Not Voter');
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

  // res.json("Voter triggered");
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
    FirstRountSetTimeout = setTimeout(() => {
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
    // console.log(challenge);

    const response = voter.GenerateResponse(challenge);
    // console.log(response);

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
      console.log('there are ' + creator.voterResponse.length + ' Voter now');
      // console.log("Creator owns tax:", creator.MPT.Search(creator.wallet.publicKey.encode("hex")));
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
      GetResponsesSetTimeout = setTimeout(() => {
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
  let seq = req.body.seqNum; // has fault

  if (seqList.indexOf(seq) == -1) {
    seqList.push(seq);

    seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/update-blockchain',
        method: 'POST',
        body: {SeqNum: seq, Blockchain: creator.blockchain},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
    chain = creator.blockchain;
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

app.post('/update-blockchain', function(req, res) {
  console.log('********** update-blockchain start  **********');
  const seq = req.body.SeqNum;
  const updatedChain = req.body.Blockchain;
  if (seqList.indexOf(seq) == -1) {
    // chain.chain = updatedChain.chain;
    chain.chain = Object.setPrototypeOf(updatedChain.chain, Array.prototype);
    instantiateMPT(updatedChain.MPT);
    chain.MPT = updatedChain.MPT;
    chain.txn_pool = Object.setPrototypeOf(updatedChain.txn_pool, tx_pool.prototype);
    // console.log(chain);
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/update-blockchain',
        method: 'POST',
        body: {SeqNum: seq, Blockchain: updatedChain},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  } else {
    res.sendStatus(200);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port} ...`);
});

// createtxs(3);
