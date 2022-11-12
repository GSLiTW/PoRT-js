/* eslint-disable max-len */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.argv[2];
const rp = require('promise-request-retry');

// const fs = require('fs');
// const elliptic = require('elliptic');

// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require('./Block/Blockchain');
const Transaction = require('./Transaction/transaction');
const backup = require('./Utility/backup');

const Preprocess = require('./Block/Preprocess');

const Backup = new backup();
const Creator = require('./Creator/creator');
const Voter = require('./Voter/voter');

const Block = require('./Block/block.js');
const Cosig = require('./cosig.js');

// constants
const BASE = 1000000000000

// will be set to false in ("/Creator/GetBlock")
let CreatorStartThisRound = false; // if true, means Creator already call ("Creator"), don't let him call again
let FirstRoundLock = false; // if is true, means ("/Creator/Challenge") overtime, Creator will not wait for rest of voters
let FirstRountSetTimeout = null; // record setTimeout in ("/Creator/Challenge"), confirm that only one timeout a time
let FirstRoundVoterNum = 0; // record when First Round Lock, how many Voters attend this round
let GetResponsesSetTimeout = null;

// preprocess

console.log("Preprocess init ")
const init_data = new Preprocess();
init_data.initialize(port);
const chain = init_data.chain;
const Tree = init_data.tree;
const pending_txn_pool=init_data.pending_txn_pool;
const wallet=init_data.wallet;


if (port >= 3002) {
  for (let p = port - 2; p < port; p++) {
    const newNodeUrl = 'http://localhost:' + p;
    console.log(newNodeUrl);
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

let tmp = 2; 

seqList = [0];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function(req, res) {
  res.send(chain);
});

app.get('/wallet', function(req, res) {
  res.send({wallet: wallet, backupinfo: Backup});
});

app.get('/MPT', function(req, res) {
  res.send(chain.MPT);
});

app.get('/transaction-pool', function(req, res) {
  res.send(chain.txn_pool);
});

app.get('/MPT/Search/:key', function(req, res) {
  const key = req.params.key;
  res.json({key: key, balance: chain.MPT.Search(key)});
});
// ! preprocess
app.post('/MPT/UpdateValues', function(req, res) {
  const UpdateList = req.body.UpdateList;
  for (let i = 0; i < UpdateList.length; i++) {
    Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
  }

  const seq = seqList[seqList.length - 1] + 1;
  seqList.push(seq);

  const requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/MPT/ReceiveUpdateValues',
      method: 'POST',
      body: {SeqNum: seq, UpdateList: UpdateList},
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  res.json({
    note: 'Update Successfully.',
  });
});

// ! add ckeck
app.post('/MPT/ReceiveUpdateValues', function(req, res) {
  const UpdateList = req.body.UpdateList;
  const seq = req.body.SeqNum;

  if (seqList.indexOf(seq) == -1) {
    for (let i = 0; i < UpdateList.length; i++) {
      Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
    }
    seqList.push(seq);


    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/MPT/ReceiveUpdateValues',
        method: 'POST',
        body: {SeqNum: seq, UpdateList: UpdateList},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  }

  res.sendStatus(200);
});

// !
app.post('/MPT/UpdateTax', function(req, res) {
  const UpdateList = req.body.UpdateList;
  for (let i = 0; i < UpdateList.length; i++) {
    Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
  }

  const seq = seqList[seqList.length - 1] + 1;
  seqList.push(seq);

  const requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/MPT/ReceiveUpdateTax',
      method: 'POST',
      body: {SeqNum: seq, UpdateList: UpdateList},
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  res.json({
    note: 'Update Successfully.',
  });
});

app.post('/MPT/ReceiveUpdateTax', function(req, res) {
  const UpdateList = req.body.UpdateList;
  const seq = req.body.SeqNum;

  if (seqList.indexOf(seq) == -1) {
    for (let i = 0; i < UpdateList.length; i++) {
      Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
    }
    seqList.push(seq);


    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/MPT/ReceiveUpdateTax',
        method: 'POST',
        body: {SeqNum: seq, UpdateList: UpdateList},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  }

  res.sendStatus(200);
});

app.post('/MPT/UpdateDbit', function(req, res) {
  const UpdateList = req.body.UpdateList;
  for (let i = 0; i < UpdateList.length; i++) {
    Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
  }

  const seq = seqList[seqList.length - 1] + 1;
  seqList.push(seq);

  const requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/MPT/ReceiveUpdateDbit',
      method: 'POST',
      body: {SeqNum: seq, UpdateList: UpdateList},
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  res.json({
    note: 'Update Successfully.',
  });
});

app.post('/blockchain/createblock', function (req, res) {
  console.log("trash");
  const lastBlock = chain.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const newBlock = chain.createNewBlock(pending_txn_pool.transactions, previousBlockHash);

  const seq = seqList[seqList.length - 1] + 1;
  seqList.push(seq);

  const requestPromises = [];
  chain.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: {SeqNum: seq, newBlock: newBlock},
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });


  for (let i = 0, UpdateList = chain.getLastBlock().transactions; i < UpdateList.length; i++) {
    Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
  }

  pending_txn_pool.clean();
  if (req.body.num == 2) {
    
    init_data.createTxs(3)
  }

  res.json({
    note: 'Create Successfully.',
  });
});

app.post('/MPT/ReceiveUpdateDbit', function(req, res) {
  const UpdateList = req.body.UpdateList;
  const seq = req.body.SeqNum;
  if (SeqList.indexOf(seq) == -1) {
    for (let i = 0; i < UpdateList.length; i++) {
      Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
    }
    seqList.push(seq);


    const requestPromises = [];
    chain.networkNodes.forEach((networkNodeUrl) => {
      const requestOptions = {
        uri: networkNodeUrl + '/MPT/ReceiveUpdateDbit',
        method: 'POST',
        body: {SeqNum: seq, UpdateList: UpdateList},
        json: true,
      };
      requestPromises.push(rp(requestOptions));
    });
  }

  res.sendStatus(200);
});

app.get('/transaction/third-block', function(req, res) {
  init_data.createTxs(3)
  res.json({note: `push transactions of the third etherscan into pending txn pool.`});
});

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
  const newTransaction = new Transaction(rawtx.id, rawtx.sender, rawtx.receiver, rawtx.value, sig.recoveryParam, sig.r, sig.s, chain.MPT);
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
  // const newTransaction = Transaction(req.body.amount, req.body.sender, req.body.recipient)
  //console.log(121212)
  console.log("before add");
  const isexist = chain.addTransactionToPendingTransaction(req.body.NewTxs);
  console.log("after add");
  // console.log(isexist)
  // var seq = seqList[seqList.length - 1] + 1;
  // seqList.push(seq);
  
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

// app.post('/receive-new-block', function(req, res) {
//   console.log('********** /receive-new-block start  **********');
//   const seq = req.body.SeqNum;
//   if (seqList.indexOf(seq) == -1) {
//     const newBlock = req.body.newBlock;
//     const lastBlock = chain.getLastBlock();
//     const correctHash = lastBlock.hash === tempBlock.previousBlockHash;
//     const correctIndex = lastBlock['height'] + 1 == tempBlock['height'];

//     if (!Tree.saved) {
//       Tree.Cal_old_hash();
//     }


//     for (let i = 0, UpdateList = tempBlock.transactions; i < UpdateList.length; i++) {
//       Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
//     }

//     if (tempBlock.height%2 === 1) {
//       Tree.UpdateDbit(lastBlock.nextCreator, [0, 0]);
//       Tree.UpdateDbit(tempBlock.nextCreator, [1, 1]);
//       for (let i = 0; i < tempBlock.nextVoters.length; i++) {
//         Tree.UpdateDbit(lastBlock.nextVoters[i], [0, 0]);
//         Tree.UpdateDbit(tempBlock.nextVoters[i], [1, 2]);
//       }
//     } else {
//       Tree.UpdateDbit(lastBlock.nextCreator, [0, 0]);
//       Tree.UpdateDbit(tempBlock.nextCreator, [2, 1]);
//       for (let i = 0; i < tempBlock.nextVoters.length; i++) {
//         Tree.UpdateDbit(lastBlock.nextVoters[i], [0, 0]);
//         Tree.UpdateDbit(tempBlock.nextVoters[i], [2, 2]);
//       }
//     }


//     if (correctHash && correctIndex) {
//       // refund creator's & voter's tax
//       if (lastBlock['height'] >= 1) {
//         Tree.RefundTax(lastBlock.nextCreator, Tree.Search(lastBlock.nextCreator)[1]);
//         for (let i = 0; i < lastBlock.nextVoters.length; i++) {
//           Tree.RefundTax(lastBlock.nextVoters[i], (Tree.Search(lastBlock.nextVoters[i])[1]) * 0.7);
//         }
//       }

//       console.log('push tempblock' + tempBlock.height + ' into chain');
//       chain.chain.push(tempBlock);

//       /* pending_txn_pool.clean();
//             if (newBlock.height == 4000720) pending_txn_pool.create(3);*/

//       // only delete txs which are in new block
//       console.log('before delete all tx: '+pending_txn_pool.transactions);
//       for (let i=0; i<newBlock.transactions.length; i++) {
//         pending_txn_pool.transactions.forEach(function(tx, index, arr) {
//           if (tx.id == newBlock.transactions[i].id) {
//             arr.splice(index, 1);
//           }
//         });
//       }
//       console.log('after delete all tx: '+pending_txn_pool.transactions);

//       const currentdate = new Date();
//       const datetime = 'Last Sync: ' + currentdate.getDate() + '/' +
//                 (currentdate.getMonth() + 1) + '/' +
//                 currentdate.getFullYear() + ' @ ' +
//                 currentdate.getHours() + ':' +
//                 currentdate.getMinutes() + ':' +
//                 currentdate.getSeconds() + '.' +
//                 currentdate.getMilliseconds();
//       console.log(datetime);
//       res.json({
//         note: 'New block received and accepted.',
//         newBlock: newBlock,
//       });
//     } else {
//       res.json({
//         note: 'New block rejected.',
//         newBlock: newBlock,
//       });
//     }

//     seqList.push(seq);

//     tempBlock = newBlock;
//     Tree.ResetSaved();
//     // console.log(tempBlock);

//     const requestPromises = [];
//     chain.networkNodes.forEach((networkNodeUrl) => {
//       const requestOptions = {
//         uri: networkNodeUrl + '/receive-new-block',
//         method: 'POST',
//         body: {SeqNum: seq, newBlock: newBlock},
//         json: true,
//       };
//       requestPromises.push(rp(requestOptions));
//     });
//   } else {
//     res.sendStatus(200);
//   }
// });

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
  let count = 0; let i;
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
  ownerShare = (await Backup.recovery(wallet.privateKey, req.body.publicKey, req.body.share));

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
app.post('/register-node', function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
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
    init_data.createTxs(tmp);
    CreatorStartThisRound = true;
    const currentdate = new Date();
    const datetime = 'Last Sync: ' + currentdate.getDate() + '/' +
            (currentdate.getMonth() + 1) + '/' +
            currentdate.getFullYear() + ' @ ' +
            currentdate.getHours() + ':' +
            currentdate.getMinutes() + ':' +
            currentdate.getSeconds() + '.' +
            currentdate.getMilliseconds();

    blockToVote = creator.constructNewBlock(chain.txn_pool);
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
      console.log("this is a voter");
      voter.creatorUrl(req.body.CreatorUrl);

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
  console.log('********** update-blockchain start  **********');
  const seq = req.body.SeqNum;
  let updatedChain = req.body.Blockchain;
  if (seqList.indexOf(seq) == -1) {
    chain = updatedChain;
    tmp += 1;
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
