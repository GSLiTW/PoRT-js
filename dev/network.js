var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const port = process.argv[2];
const rp = require("promise-request-retry");
const fs = require("fs");
const uuid = require('uuid/v1');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

// local modules
const Blockchain = require("./blockchain.js");
const Transaction = require("./transaction.js")
const MPT = require('./MPT');
const Pending_Txn_Pool = require('./pending_transaction_pool');
const Wallet = require('./wallet');
const backup =require('./backup');
const requestPromise = require('request-promise');

const Backup =new backup();
const chain = new Blockchain();
const Creator = require('./creator');
const Voter = require('./voter');
const nodeAddress = uuid().split("-").join("");


// preprocess
var data = fs.readFileSync('./node_address_mapping_table.csv')
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim())); // split each line to array

var w = fs.readFileSync('./private_public_key.csv')
            .toString() // convert Buffer to string
            .split('\n') // split string to lines
            .map(e => e.trim()) // remove white spaces for each line
            .map(e => e.split(',').map(e => e.trim())); // split each line to array
const wallet = new Wallet(w[port-3000][1], w[port-3000][2], 10);
console.log(wallet);

//const PKA ={};
// for(i=0;i<10;i++){
//     let R =Math.floor(Math.random()*158);
//     if(Backup.pka[R]==undefined&&(R+3000)!=port){
//         //PKA[R]=w[R][2];
//         Backup.generatePKA(R+3000,w[R][2]);
//     }else{
//         if(Backup.pka[R]!=undefined)console.log("the same !!!!");
//         i--;
//     }
// }
// console.log(Backup.pka);

w = undefined;


const Tree = new MPT(true);
for(var i = 0; i < 157; i++) {
    if(i == 0) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 1); // dbit == 1 means creator
    else if(i == 1) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 2) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 3) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 0);
}

const chain = new Blockchain(Tree);

for(var i=0, UpdateList=chain.chain[0].transactions; i<UpdateList.length; i++) {
    Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
}


var pending_txn_pool = new Pending_Txn_Pool();
pending_txn_pool.create(2);

if(port >= 3002) {
    for(var p=port-2; p<port; p++) {
        const newNodeUrl = "http://localhost:" + p;
        if(chain.networkNodes.indexOf(newNodeUrl) == -1)
            chain.networkNodes.push(newNodeUrl);
        
        const regNodesPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/register-node",
                method: "POST",
                body: {newNodeUrl: newNodeUrl},
                json: true,
                retry: 10,
                delay: 1000
            };

            regNodesPromises.push(rp(requestOptions));
        });

        Promise.all(regNodesPromises).then(data => {
            //use the data
            const bulkRegisterOptions = {
                uri: newNodeUrl + "/register-nodes-bulk",
                method: "POST",
                body: {allNetworkNodes: [ ...chain.networkNodes, chain.currentNodeUrl]},
                json: true,
                retry: 10,
                delay: 1000
            }

            return rp(bulkRegisterOptions);
        })
    }
}

voter = null;
currentVoters = [];
nextVoters = [];
publicKeyPairs = [];
commitments = [];
nonces = [];
creator = null;
creatorUrl = 0;


seqList = [0];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/blockchain", function(req, res){
    res.send(chain);
});

app.get("/wallet", function(req, res) {
    res.send({wallet: wallet, backupinfo: Backup});
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
    
    var seq = seqList[seqList.length-1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateValues",
            method: "POST",
            body: {SeqNum: seq, UpdateList: UpdateList},
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
    const seq = req.body.SeqNum;
    
    if(seqList.indexOf(seq) == -1) {
        for(var i=0; i<UpdateList.length; i++) {
            Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
        }
	    seqList.push(seq);
    
    
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateValues",
                method: "POST",
                body: {SeqNum: seq, UpdateList: UpdateList},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }
});

app.post("/MPT/UpdateTax", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
    }

    var seq = seqList[seqList.length-1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateTax",
            method: "POST",
            body: {SeqNum: seq, UpdateList: UpdateList},
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
    const seq = req.body.SeqNum;

    if(seqList.indexOf(seq) == -1) {
        for(var i=0; i<UpdateList.length; i++) {
            Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
        }
        seqList.push(seq);
    
    
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateTax",
                method: "POST",
                body: {SeqNum: seq, UpdateList: UpdateList},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }
});

app.post("/MPT/UpdateDbit", function(req, res) {
    const UpdateList = req.body.UpdateList;
    for(var i=0; i<UpdateList.length; i++) {
        Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
    }

    var seq = seqList[seqList.length-1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateDbit",
            method: "POST",
            body: {SeqNum: seq, UpdateList: UpdateList},
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

    var seq = seqList[seqList.length-1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/receive-new-block",
            method: "POST",
            body: {SeqNum: seq, newBlock: newBlock},
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
    const seq = req.body.SeqNum;
    if(SeqList.indexOf(seq) == -1) {
        for(var i=0; i<UpdateList.length; i++) {
                Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
        }
        seqList.push(seq);
    
    
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateDbit",
                method: "POST",
                body: {SeqNum: seq, UpdateList: UpdateList},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }
    
});

app.get("/transaction/third-block", function(req, res) {
    pending_txn_pool.create(3);
    res.json({note: `push transactions of the third etherscan into pending txn pool.`})
})

app.post("/transaction/broadcast", function(req, res){
    const newTransaction = Transaction(req.body.amount, req.body.sender, req.body.recipient)
    chain.addTransactionToPendingTransaction(newTransaction);

    var seq = seqList[seqList.length-1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/transaction",
            method: "POST",
            body: {SeqNum: seq, NewTxs: newTransaction},
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        res.json({note: "Transaction created and broadcast successfully."});
    });
});

app.post("/receive-new-block", function(req, res){
    const seq = req.body.SeqNum;
    if(SeqList.indexOf(seq)==-1) {
        const newBlock = req.body.newBlock;
        const lastBlock = chain.getLastBlock();
        const correctHash = lastBlock.hash === newBlock.previousBlockHash;
        const correctIndex = lastBlock["height"]+1 == newBlock["height"];

        for(var i=0, UpdateList=chain.getLastBlock().transactions; i<UpdateList.length; i++) {
            Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
        }

        if(correctHash && correctIndex){
            chain.chain.push(newBlock);
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

        seqList.push(seq);
    
    
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/receive-new-block",
                method: "POST",
                body: {SeqNum: seq, newBlock: newBlock},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }
});

app.get("/PKA",function(req,res){

    res.send(Backup.pka);

})
app.post("/addPKA/:port",function(req,res){
    let trusteeport =req.params.port;
    const requestPromises = [];
    const requestOptions = {
        uri: "http://localhost:"+trusteeport+"/returnPK",
        method: "POST",
        body: {
            note:"hello from owner" ,
            ownerPort:port
        },
        json: true
    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data=>{
        res.json({PKA:Backup.pka});
    })


})

app.post("/returnPK",function(req,res){
    let ownerport=req.body.ownerPort;
    const requestPromises = [];
    const requestOptions = {
        uri: "http://localhost:"+ownerport+"/getPK",
        method: "POST",
        body: {
            note:"respones from trustee" ,
            trusteePK:wallet.publicKey,
            trusteeport:port
        },
        json: true
    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data=>{
        res.json({note: "return pk finish"});
    })
    
})

app.post("/getPK",function(req,res){
    Backup.pka[req.body.trusteeport]=req.body.trusteePK;
    res.json({note:"get PK finish"});
})

app.post("/deletePKA/:port",function(req,res){
    delete Backup.pka[req.params.port];
    res.json({PKA:Backup.pka});
})

app.get("/backup",async function(req,res){
    var count=0,i;
    for(i in Backup.pka){
        count++;
    }
    if(count<6){
        res.json({message:"Please add more trustee !"});
    }else{
        myPrivateKey = wallet.privateKey;
        await Backup.init(myPrivateKey);
        res.json({message:"create file success !"});
    }
    
})

app.post("/recoveryReq/:trusteeport",function(req,res){
    let data =Backup.inputfile();
    let file =JSON.parse(data);
    let pkshar=file['PK_Shares'];
    const trusteeUrl = "http://localhost:" + req.params.trusteeport;
    const requestPromises = [];
    const requestOptions = {
        uri: trusteeUrl + "/decrypt",
        method: "POST",
        body: {
            share: pkshar,
            publicKey:wallet.publicKey,
            ownerurl:"http://localhost:"+port 
        },
        json: true
    };
    
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data=>{
        res.json({
            message:"finish",
            share: Backup.recoveryshare
    });
    })

})

app.post("/recoveryReq",function(req,res){
    let data =Backup.inputfile();
    let file =JSON.parse(data);
    let pkshar=file['PK_Shares'];
    const requestPromises = [];
    for(var i in Backup.pka){
        const trusteeUrl = "http://localhost:" + i;
        const requestOptions = {
            uri: trusteeUrl + "/decrypt",
            method: "POST",
            body: {
                share: pkshar,
                publicKey:wallet.publicKey,
                ownerurl:"http://localhost:"+port 
            },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    }
    Promise.all(requestPromises).then(data=>{
        res.json({
            message:"finish",
            share: Backup.recoveryshare
    });
    })
})

app.post("/decrypt",async function(req,res){
    ownerShare =(await Backup.recovery(wallet.privateKey,req.body.publicKey,req.body.share));
    //console.log("ownerShare:"+JSON.stringify(ownerShare));
    const requestPromises = [];
    const requestOptions = {
        uri: req.body.ownerurl + "/getResponse",
        method: "POST",
        body: {
            // share: pkshar,
            // publicKey:Wallet.publicKey,
            // ownerurl:"http://localhost:"+port 
            share: ownerShare
        },
        json: true

    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data=>{
        res.json({
            message: "success",
            decript_share: ownerShare 
        })
    })



})
app.post("/getResponse",function(req,res){
    let share =req.body.share;//???
    console.log(share);
    Backup.recoveryshare.push(share);
    res.json({shares:Backup.recoveryshare});
})

app.get("/combine",function(req,res){
    let data =Backup.inputfile();
    let file =JSON.parse(data);
//    console.log(file);
//    console.log('-------------------------------------------');
    let tksk =file['TK_SK'];
    res.json({your_privateKey:Backup.combine(Backup.recoveryshare,tksk)});
})







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
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    if(isCreator == 1){
        creator = new Creator(Tree, pending_txn_pool);
        //console.log(creator);
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

    res.json({note: "sendCreatorID successful."});
    
});

app.post("/voter/sendPublicKey", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    //console.log("isVoter: ", isVoter);
    if(isVoter == 2){
        //console.log("--------------");
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

    res.json({note: "sendPublicKey successful."});
});

app.post("/creator/createPublicData", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    currentVoters.push(req.body.voterUrl);
    publicKeyPairs.push(ec.keyFromPublic(req.body.publicKey, "hex").getPublic());
    //console.log("publicKeyPairs.length: ", publicKeyPairs.length);
    //console.log("isCreator: ", isCreator);
    if(publicKeyPairs.length == 3 && isCreator == 1){
        const lastBlock = chain.getLastBlock();
        const previousBlockHash = lastBlock["hash"];

        creator = new Creator(Tree, pending_txn_pool);
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

        // creator.Cosig_createAndCombinePublicData(publicKeyPairs[0], publicKeyPairs[1], publicKeyPairs[2], JSON.stringify(newBlock));
        creator.Cosig_createAndCombinePublicData(publicKeyPairs[0], publicKeyPairs[1], publicKeyPairs[2], 'muSig is awesome!');

        for(let i in publicKeyPairs){
            //console.log("***publicKeyPairs[i]: ", publicKeyPairs[i]);
            publicKeyPairs[i] = JSON.stringify(publicKeyPairs[i]);
            //console.log("publicKeyPairs[i]: ", publicKeyPairs[i]);
            //console.log("type: ", typeof publicKeyPairs[i]);
        }
        
        currentVoters.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/voter/recordCurrentVoters",
                method: "POST",
                body: {currentVoters: [...currentVoters],
                       publicData: creator.publicData
                    },
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
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    if(isVoter == 2){
        //console.log("req.body.currentVoters: ", req.body.currentVoters);
        for(var i in req.body.currentVoters){
            if(req.body.currentVoters[i] != chain.currentNodeUrl){
                currentVoters.push(req.body.currentVoters[i]);
            }
        }
        
        const requestOptions = {
            uri : chain.currentNodeUrl + "/voter/vote",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                   publicData: req.body.publicData
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/voter/vote", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    if(isVoter == 2){
        voter = new Voter(Tree, pending_txn_pool);
        wallet.signerPrivateData = voter.Cosig_setSignerPrivateData(wallet.signerPrivateData, port, req.body.publicData);
        const commitment = voter.Cosig_commitment(wallet.signerPrivateData);
        const nonce = voter.Cosig_nonce(wallet.signerPrivateData);
        //console.log("////////////commitment: ", commitment);
        //console.log("////////////commitment: ", JSON.stringify(commitment));
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

    res.json({note: "Vote successful."});
});

app.post("/creator/updatePublicData", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    if(isCreator == 1){
        //currentVoters.push(req.body.voterUrl);
        const index = publicKeyPairs.indexOf(JSON.stringify(ec.keyFromPublic(req.body.publicKey, "hex").getPublic()));
        //console.log("~publicKeyPairs: ", publicKeyPairs);
        //console.log("~type: ", typeof publicKeyPairs);
        //console.log("index: ", index);
        commitments[index] = Buffer.from(req.body.commitment.data);
        nonces[index] = Buffer.from(req.body.nonce.data);
        //console.log("///req.body.nonce: ", nonces[index]);
        //console.log("///JSON req.body.nonce: ", JSON.stringify(req.body.nonce));
        creator.Cosig_commitments(index, commitments[index]);
        creator.Cosig_nonces(index, nonces[index]);
        //creator.Cosig_combineNonces_combine(req.body.session);

        //console.log("*********************************************commitments.length: ", commitments.length);
        if(commitments.length == 3 && commitments[0] != null && commitments[1] != null && commitments[2] != null){
            const requestOptions = {
                uri : currentVoters[0] + "/voter/combine",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                       publicData: creator.publicData,
                       voterLeader: currentVoters[0]
                },
                json: true
            };
            rp(requestOptions);
        }        
    }
});

app.post("/voter/combine", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    //console.log("||||||||||||||||||||||||||||||||||||||");
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        //console.log("~~~~~~~~~~~req.body.publicData.nonces.data: ", req.body.publicData.nonces);
        const combineNonce = voter.Cosig_combineNonces_check(wallet.signerPrivateData.session, req.body.publicData.nonces);
        //console.log("---------------------combineNonce: ", combineNonce);
        //console.log("&&&&&&&&&&&&&&&&&&&&&wallet.signerPrivateData: ", wallet.signerPrivateData);
        //wallet.signerPrivateData = voter.Cosig_combineNonces_combine(wallet.signerPrivateData, wallet.signerPrivateData.session.nonceIsNegated);

        //const creatorUrl = req.body.creatorUrl;
        //console.log("&&&&&&&&&&&&&&&&&&&&&wallet.signerPrivateData.session.nonceIsNegated: ", wallet.signerPrivateData.session.nonceIsNegated);
        currentVoters.push(chain.currentNodeUrl);   //ensure everyone will do partialSign
        const requestOptions = {
            uri : creatorUrl + "/creator/combine",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                publicKey: wallet.publicKey,
                combineNonce: combineNonce,
                signerNonceIsNegated: wallet.signerPrivateData.session.nonceIsNegated
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/creator/combine", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    if(isCreator == 1){
        //const voter = new Voter(Tree, pending_txn_pool);
        creator.Cosig_combineNonces(req.body.combineNonce);
        //console.log("^^^^^^^^^^^^^^^^^^^^^creator.publicData: ", creator.publicData);
        const requestOptions = {
            uri : req.body.voterUrl + "/voter/nonceIsNegated",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                   publicKey: wallet.publicKey,
                   publicData: creator.publicData,
                   signerNonceIsNegated: req.body.signerNonceIsNegated
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/voter/nonceIsNegated", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        currentVoters.forEach(voterNodeUrl => {
            const requestPromises = {
                uri: voterNodeUrl + "/voter/partialSign",
                method: "POST",
                body: {voterUrl: chain.currentNodeUrl,
                    publicKey: wallet.publicKey,
                    publicData: req.body.publicData,
                    signerNonceIsNegated: req.body.signerNonceIsNegated
                },
                json: true
            };

            rp(requestPromises);
        });
    }
});

app.post("/voter/partialSign", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    if(isVoter == 2){
        //const voter = new Voter(Tree, pending_txn_pool);
        //console.log("$$$$$$$$$$$$$$req.body.signerNonceIsNegated: ", req.body.signerNonceIsNegated);
        wallet.signerPrivateData = voter.Cosig_combineNonces_combine(wallet.signerPrivateData, req.body.signerNonceIsNegated);
        wallet.signerPrivateData = voter.Cosig_generatePartialSignature(wallet.signerPrivateData, req.body.publicData);
        //console.log("$$$$$$$$$$$$$$wallet.signerPrivateData: ", wallet.signerPrivateData);
        //console.log("~~~~~~~~~~~req.body.publicData: ", req.body.publicData);


        // console.log("TOHEX: ", wallet.signerPrivateData.session.partialSignature);
        //const creatorUrl = req.body.creatorUrl;
        const requestOptions = {
            uri : creatorUrl + "/creator/partialSign",
            method: "POST",
            body: {voterUrl: chain.currentNodeUrl,
                   publicKey: wallet.publicKey,
                   partialSignature: wallet.signerPrivateData.session.partialSignature.toHex()
            },
            json: true
        };
        rp(requestOptions);
    }
});

app.post("/creator/partialSign", function(req, res){
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    if(isCreator == 1){
        const index = publicKeyPairs.indexOf(JSON.stringify(ec.keyFromPublic(req.body.publicKey, "hex").getPublic()));
        //console.log("::::::::::::::::::::: ", index, req.body.partialSignature);
        creator.Cosig_exchangePartialSignature(index, req.body.partialSignature);
        //console.log(";;;;;;;;;;;;;;;;;;;;; ", creator.publicData.partialSignatures);
        
                //currentVoters.forEach(voterNodeUrl => {
                    if(creator.publicData.partialSignatures[0] != null && creator.publicData.partialSignatures[1] != null && creator.publicData.partialSignatures[2] != null){
                        const requestOptions = {
                            uri : currentVoters[0] + "/voter/verifyPartialSign",
                            method: "POST",
                            body: {voterUrl: chain.currentNodeUrl,
                                publicKey: wallet.publicKey,
                                publicData: creator.publicData
                            },
                            json: true
                        };
                        rp(requestOptions);
                    }
                    //});
    }
});

app.post("/voter/verifyPartialSign", function(req, res){
    const isVoter = Tree.Verify(wallet.publicKey)[2];
    if(isVoter == 2){
        //console.log("?????????????????????????: ", req.body.publicData);
        voter.Cosig_verifyIndividualPartialSignatures(wallet.signerPrivateData.session, req.body.publicData);
        const requestOptions = {
            uri : creatorUrl + "/creator/cosig",
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
    const isCreator = Tree.Verify(wallet.publicKey)[2];
    const isVoter = Tree.Verify(req.body.publicKey)[2];
    const index = countSig.indexOf(req.body.publicKey);
    if(isCreator == 1 && isVoter == 2){
        if(index == -1){
            countSig.push(req.body.voterUrl);
        }
        if(countSig.length == publicKeyPairs.length){
            creator.Cosig_combinePartialSignatures();
            res.send(creator.publicData.signature);
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
    res.send(creator.publicData.signature);
});


app.listen(port, function(){
    console.log(`Listening on port ${port} ...`);
});
