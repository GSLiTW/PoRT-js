var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const port = process.argv[2];
const rp = require("request-promise");
const fs = require("fs");

// local modules
const Blockchain = require("./blockchain.js");
const Transaction = require("./transaction.js")
const MPT = require('./MPT');
const Pending_Txn_Pool = require('./pending_transaction_pool');
const Wallet = require('./wallet');
const Creator = require('./creator');
const Voter = require('./voter');
const nodeAddress = uuid().split("-").join("");

const chain = new Blockchain();

// preprocess
var data = fs.readFileSync('./node_address_mapping_table.csv')
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim())); // split each line to array
//console.log(data[0][1]);

var w = fs.readFileSync('./private_public_key.csv')
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim())); // split each line to array
const wallet = new Wallet(w[port-3000][1], w[port-3000][2], 10);
w = undefined;


const Tree = new MPT(true);
for(var i = 0; i < 157; i++) {
    if(i == 4) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 1); // dbit == 1 means creator
    else if(i == 15) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 23) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 36) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 0);
}

for(var i=0, UpdateList=chain.chain[0].transactions; i<UpdateList.length; i++) {
    Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
}


var pending_txn_pool = new Pending_Txn_Pool();
pending_txn_pool.create(2);

// 3004 for debugging, should be 3157
if(port == 3157) {
    for(var p=3000; p<3157; p++) {
        const newNodeUrl = "http://localhost:" + p;
        if(chain.networkNodes.indexOf(newNodeUrl) == -1)
            chain.networkNodes.push(newNodeUrl);
        
        const regNodesPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/register-node",
                method: "POST",
                body: {newNodeUrl: newNodeUrl},
                json: true
            };

            regNodesPromises.push(rp(requestOptions));
        });

        Promise.all(regNodesPromises).then(data => {
            //use the data
            const bulkRegisterOptions = {
                uri: newNodeUrl + "/register-nodes-bulk",
                method: "POST",
                body: {allNetworkNodes: [ ...chain.networkNodes, chain.currentNodeUrl]},
                json: true
            }

            return rp(bulkRegisterOptions);
        })
    }
}

voter = null;
currentVoters = [];
nextVoters = [];
publicKeys = [];
commitments = [];
nonces = [];
creator = null;
creatorUrl = 0;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/blockchain", function(req, res){
    res.send(chain);
});

app.get("/wallet", function(req, res) {
    res.send(wallet);
})

app.get("/MPT", function(req, res) {
    res.send(Tree);
});

app.get("/transaction-pool", function(req, res) {
    res.send(pending_txn_pool);
});

// app.post("/transaction", function(req, res){
//     var para = JSON.parse(req.body)
//     const newTransaction = Transaction(para['from'], para['to'], para['amount'], para['type']);
//     const blockIndex = chain.addTransactionToPendingTransaction(newTransaction);
//     res.json({note: `Transaction will be created in block ${blockIndex}.`});
// });

app.get("/MPT/Search/:key", function(req,res) {
    const key = req.params.key;
    res.json({key: key, balance: Tree.Search(key)});
});

app.post("/MPT/UpdateValues", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
    }

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateValues",
            method: "POST",
            body: {UpdateList: UpdateList},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})


app.post("/MPT/ReceiveUpdateValues", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
    }
});

app.post("/MPT/UpdateTax", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
    }

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateTax",
            method: "POST",
            body: {UpdateList: UpdateList},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})


app.post("/MPT/ReceiveUpdateTax", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
    }
});

app.post("/MPT/UpdateDbit", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
    }

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateDbit",
            method: "POST",
            body: {UpdateList: UpdateList},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})


app.post("/blockchain/createblock", function(req, res) {
    const lastBlock = chain.getLastBlock();
    const previousBlockHash = lastBlock["hash"];
    const newBlock = chain.createNewBlock(pending_txn_pool.transactions, previousBlockHash);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/receive-new-block",
            method: "POST",
            body: {newBlock: newBlock},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });


    for(var i=0, UpdateList=chain.getLastBlock().transactions; i<UpdateList.length; i++) {
        Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
    }

    pending_txn_pool.clean();
    if(req.body.num == 2)
        pending_txn_pool.create(3);

    res.json({
        note: "Create Successfully."
    })
})

app.post("/MPT/ReceiveUpdateDbit", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
    }
});

app.get("/transaction/third-block", function(req, res) {
    pending_txn_pool.create(3);
    res.json({note: `push transactions of the third etherscan into pending txn pool.`})
})

app.post("/transaction/broadcast", function(req, res){
    const newTransaction = Transaction(req.body.amount, req.body.sender, req.body.recipient)
    chain.addTransactionToPendingTransaction(newTransaction);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/transaction",
            method: "POST",
            body: newTransaction,
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        res.json({note: "Transaction created and broadcast successfully."});
    });
});

app.post("/voter", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);

    if(isVoter == 2){
        const newBlock = req.body.newBlock;
        const lastBlock = chain.getLastBlock();
        const correctHash = lastBlock.hash === newBlock.previousBlockHash;
        const correctIndex = lastBlock["height"]+1 == newBlock["height"];
    
        if(correctHash && correctIndex){
            const voter = new Voter(Tree, newBlock, pending_txn_pool);
            chain.pendingTransactions = [];
            res.json({
                note: 'New block received and accepted.',
                newBlock: newBlock
            });
        }
        else{
            res.json({
                note: 'New block rejected.',
                newBlock: newBlock
            });
        }
    }
});

//register a new node and broadcast it to network nodes
app.get("/register-and-broadcast-node", function(req, res){
    const newNodeUrl = "http://localhost:" + port;
    if(chain.networkNodes.indexOf(newNodeUrl) == -1)
        chain.networkNodes.push(newNodeUrl);
    
    const regNodesPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/register-node",
            method: "POST",
            body: {newNodeUrl: newNodeUrl},
            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises).then(data => {
        //use the data
        const bulkRegisterOptions = {
            uri: newNodeUrl + "/register-nodes-bulk",
            method: "POST",
            body: {allNetworkNodes: [ ...chain.networkNodes, chain.currentNodeUrl]},
            json: true
        }

        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note : "New node registered with network successfully."});
    });
});

//network nodes register the new node
app.post("/register-node", function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = chain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = chain.currentNodeUrl !== newNodeUrl;
    if(nodeNotAlreadyPresent && notCurrentNode)
        chain.networkNodes.push(newNodeUrl);
    res.json({note: "New node registerd successfully with node."});
});

//new node registers all network nodes
app.post("/register-nodes-bulk", function(req, res){
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = chain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
        if(nodeNotAlreadyPresent && notCurrentNode)
            chain.networkNodes.push(networkNodeUrl);
    });

    res.json({note: "Bulk registeration successful."});
});

// app.get('/consensus', function(req, res){
  
//     const requestPromises = [];
//     chain.networkNodes.forEach(networkNodeUrl =>{
//         const requestOptions = {
//             uri : networkNodeUrl + "/blockchain",
//             method: "GET",
//             json: true
//         };

//         requestPromises.push(rp(requestOptions));
//     });

//     Promise.all(requestPromises)
//     .then(blockchains =>{
//         const currentChainLength = chain.chain.length;
//         let maxChainLength = currentChainLength;
//         let newLongestChain = null;
//         let newPendingTransactions = null;

//         blockchains.forEach(blockchain =>{
//             if(blockchain.chain.length > maxChainLength)
//             {
//                 maxChainLength = blockchain.chain.length;
//                 newLongestChain = blockchain.chain;
//                 newPendingTransactions = blockchain.pendingTransactions;
//             };
//         });

//         if(!newLongestChain || (newLongestChain && !chain.chainIsValid(newLongestChain)))
//         {
//             res.json({
//                 note: "Current chain has not been replaced.",
//                 chain: chain.chain
//             });
//         }
//         else if(newLongestChain&& chain.chainIsValid(newLongestChain))
//         {
//             chain.chain = newLongestChain;
//             chain.pendingTransactions = newPendingTransactions;
//             res.json({
//                 note: "This chain has been replaced.",
//                 chain: chain.chain
//             });

//         }
//     });
// });

app.get('/block/:blockHash', function(req, res){
    const blockHash = req.params.blockHash;
    const correctBlock = chain.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function(req, res){
    const transactionId = req.params.transactionId;
    const transactionData = chain.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    });
});

app.get('/address/:address', function(req, res){
    const address = req.params.address;
    const addressData = chain.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

app.get("/block-explorer", function(req, res){
    res.sendFile("./block-explorer/index.html", {root: __dirname});
});

app.post("/creator/sendCreatorID", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    if(isCreator == 1){
        creator = new Creator(Tree, pending_txn_pool);
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri : networkNodeUrl + "/voter/sendPublicKey",
                method: "POST",
                body: {creatorUrl: chain.currentNodeUrl
                },
                json: true
            };
            rp(requestOptions);
        });
    }
    
});

app.post("/voter/sendPublicKey", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        voter = new Voter(Tree, pending_txn_pool);
        creatorUrl = req.body.creatorUrl;
        const requestOptions = {
            uri : creatorUrl + "/creator/createPublicData",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                   publicKey: wallet.publicKey
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/creator/createPublicData", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    if(publicKeys.length == 3 && isCreator == 1){
        currentVoters.push(req.body.voterUrl);
        publicKeys.push(req.body.publicKey);
        const lastBlock = chain.getLastBlock();
        const previousBlockHash = lastBlock["hash"];

        //const creator = new Creator(Tree, pending_txn_pool);
        const newBlock = creator.Create(lastBlock["height"]+1, previousBlockHash);

        /*const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/voter",
                method: "POST",
                body: {newBlock: newBlock},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });*/

        creator.Cosig_createAndCombinePublicData(publicKeys[0], publicKeys[1], publicKeys[2], newBlock);
        
        const requestPromises = [];
        currentVoters.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/voter/recordCurrentVoters",
                method: "POST",
                body: {currentVoters: [...currentVoters]},
                json: true
            };
            //requestPromises.push(rp(requestOptions));
            rp(requestOptions);
        });
        
        //const creatorUrl = req.body.creatorUrl;
        /*Promise.all(requestPromises).then(data => {
            const rOs = {
                uri : creatorUrl + "/creator/updatePublicData",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                    partialSignature: wallet.signerPrivateData.session.partialSignature
                },
                json: true
            };
            rp(rOs);
        });*/
        
    }
});

app.post("/voter/recordCurrentVoters", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        for(var i=0; i<req.body.currentVoters.length(); i++){
            if(req.body.currentVoters[i] != currentNodeUrl){
                currentVoters.push(req.body.currentVoters[i]);
            }
        }
    }
});

app.post("/voter/vote", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        wallet.signerPrivateData = voter.Cosig_setSignerPrivateData(wallet.signerPrivateData, port);
        const commitment = voter.Cosig_commitment(wallet.signerPrivateData);
        const nonce = voter.Cosig_Cosig_nonce(wallet.signerPrivateData);
        //wallet.signerPrivateData = voter.Cosig_Cosig_nonce(wallet.signerPrivateData);
        //wallet.signerPrivateData = voter.Cosig_Cosig_combineNonces_check(wallet.signerPrivateData, wallet.signerPrivateData.session);
        
        //const creatorUrl = req.body.creatorUrl;
        const requestOptions = {
            uri : creatorUrl + "/creator/updatePublicData",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                publicKey: wallet.publicKey,
                commitment: commitment,
                nonce: nonce
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/creator/updatePublicData", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    if(isCreator == 1){
        //currentVoters.push(req.body.voterUrl);
        const index = publicKeys.indexOf(req.body.publicKey);
        commitments[index] = req.body.commitment;
        nonces[index] = req.body.nonce;
        creator.Cosig_commitments(index, req.body.commitment);
        creator.Cosig_nonces(index, req.body.nonce);
        //creator.Cosig_combineNonces_combine(req.body.session);

        if(commitments.length() == 3){
            const requestOptions = {
                uri : currentVoters[0] + "/voter/combine",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                    publicData: creator.publicData
                },
                json: true
            };
            rp(requestOptions);
        }        
    }
});

app.post("/voter/combine", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        const publicData = req.body.publicData;
        const combineNonce = voter.Cosig_combineNonces_check(wallet.signerPrivateData.session, publicData);
        wallet.signerPrivateData = voter.Cosig_combineNonces_combine(wallet.signerPrivateData, wallet.signerPrivateData.session.nonceIsNegated);

        //const creatorUrl = req.body.creatorUrl;
        const requestOptions = {
            uri : creatorUrl + "/creator/combine",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                publicKey: wallet.publicKey,
                combineNonce: combineNonce,
            },
            json: true
        };
        rp(requestOptions);

        currentVoters.forEach(voterNodeUrl => {
            const requestPromises = {
                uri: voterNodeUrl + "/voter/partialSign",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                    publicKey: wallet.publicKey,
                    publicData: publicData,
                    signerNonceIsNegated: wallet.signerPrivateData.session.nonceIsNegated
                },
                json: true
            };

            rp(requestPromises);
        });
    }
});

app.post("/creator/combine", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    if(isCreator == 1){
        //const voter = new Voter(Tree, pending_txn_pool);
        creator.Cosig_combineNonces(req.body.combineNonce);
    }
});

app.post("/voter/partialSign", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        const publicData = req.body.publicData;
        wallet.signerPrivateData = voter.Cosig_combineNonces_combine(wallet.signerPrivateData, req.body.signerNonceIsNegated);
        wallet.signerPrivateData = voter.Cosig_generatePartialSignature(wallet.signerPrivateData, publicData);

        //const creatorUrl = req.body.creatorUrl;
        const requestOptions = {
            uri : creatorUrl + "/creator/partialSign",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                publicKey: wallet.publicKey,
                partialSignature: wallet.signerPrivateData.session.partialSignature
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/creator/partialSign", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    if(isCreator == 1){
        const index = publicKeys.indexOf(req.body.publicKey);
        creator.Cosig_exchangePartialSignature(index, req.body.partialSignature);
        
        currentVoters.forEach(voterNodeUrl => {
            const requestOptions = {
                uri : voterNodeUrl + "/voter/verifyPartialSign",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                    publicKey: wallet.publicKey,
                    publicData: creator.publicData
                },
                json: true
            };
            rp(requestOptions);
        });
    }
});

app.post("/voter/verifyPartialSign", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        creator.Cosig_verifyIndividualPartialSignatures(wallet.signerPrivateData.session, req.body.publicData);
        const requestOptions = {
            uri : voterNodeUrl + "/creator/cosig",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                publicKey: wallet.publicKey
            },
            json: true
        };
        rp(requestOptions);
    }
});

countSig = [];

app.post("/creator/cosig", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey);
    const isVoter = Tree.Verify(req.body.publicKey);
    const index = countSig.indexOf(req.body.publicKey);
    if(isCreator == 1 && isVoter == 2){
        if(index == -1){
            countSig.push(req.body.voterUrl);
        }
        if(countSig.length == publicKeys.length){
            creator.Cosig_combinePartialSignatures();
            creator.Cosig_verifySignature();
        }
    }
});

/*app.get("/creator/sendPoRT", function(req, res){
    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/PoRT",
            method: "POST",
            creatorUrl: chain.currentNodeUrl,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });
});

app.post("/PoRT", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey);
    if(isVoter == 2){
        const requestPromises = [];
        const requestOptions = {
            uri: req.creatorUrl + "/creator/nextVoter",
            method: "POST",
            voterUrl: chain.currentNodeUrl,
            //nextVoterUrl:,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    }
});

app.post("/creator/nextVoter", function(req, res){
    nextVoters.push(req.voterID);
    res.json({
        note: "VoterID: " + req.voterID + " has been pushed into nextVoters[] !"
    });
});*/

app.get("/creator", function(req, res){
    const lastBlock = chain.getLastBlock();
    const previousBlockHash = lastBlock["hash"];

    const isCreator = Tree.Verify(wallet.publicKey);
    if(isCreator == 1){
        const creator = new Creator(Tree, pending_txn_pool);
        const newBlock = creator.Create(lastBlock["height"]+1, previousBlockHash);

        const requestPromises = [];
        /*chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/nextVoter",
                method: "POST",
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });*/
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/voter",
                method: "POST",
                body: {newBlock: newBlock},
                json: true
            };
            rp(requestOptions);
        });
        /*Promise.all(requestPromises).then(data => {
            const newBlock = creator.Create(nextVoters, lastBlock["height"]+1, previousBlockHash);
            const requestOptions = {
                uri: chain.currentNodeUrl + "/transaction/broadcast",
                method: "POST",
                body: {newBlock: newBlock},
                json: true
            };
            return rp(requestOptions);
        });*/
    }
    else{
        res.json({
            note: "ERROR: Creator is invalid !"
        });
    }
});


app.listen(port, function(){
    console.log(`Listening on port ${port} ...`);
});
