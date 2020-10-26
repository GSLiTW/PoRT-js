var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const port = process.argv[2];
const rp = require("promise-request-retry");
const fs = require("fs");
const uuid = require('uuid/v1');


// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require("./blockchain.js");
const Transaction = require("./transaction.js")
const MPT = require('./MPT');
const Pending_Txn_Pool = require('./pending_transaction_pool');
const Wallet = require('./wallet');
const backup =require('./backup');

const Backup =new backup();
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
// console.log(wallet);

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
    if(i == 2) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 1); // dbit == 1 means creator
    else if(i == 4) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 6) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if(i == 8) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
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

app.get("/Creator", function(req, res){
    creator = new Creator(port, wallet.publicKey, Tree);
    if(creator.IsValid()) {
        blockToVote = creator.Create(pending_txn_pool, chain.getLastBlock().height+1, chain.getLastBlock().hash);
        
        var seq = seqList[seqList.length-1] + 1;
        seqList.push(seq);

        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter",
                method: "POST",
                body: {SeqNum: seq, CreatorUrl: chain.currentNodeUrl},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });

        res.json({
            SeqNum: seq, CreatorUrl: chain.currentNodeUrl
        })
    } else {
        creator = null;

        res.json("Error: Not Creator");
    }
    
})

app.post("/Creator/GetVoters", function(req, res){
    const VoterUrl = req.body.VoterUrl;
    const VoterPubKey = req.body.publicKey;
    creator.GetVoter(VoterUrl, VoterPubKey);

    if(creator.VoterUrl.length == VOTER_NUM) {

        const requestPromises = [];
        creator.VoterUrl.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter/GetData",
                method: "POST",
                body: {
                    pubKeys: creator.VoterPubKey,
                    message: creator.block,
                },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
            
    }

    res.json("GetVoters success!");
})

app.post("/Creator/GetCommitments", function(req, res){
    const VoterCommitment = req.body.Commitment;
    const VoterPubKey = req.body.publicKey;
    const SignerSession = req.body.SignerSession;
    if(SignerSession != null) {
        creator.GetSignerSession(SignerSession);
    }

    var flag = creator.GetCommitments(VoterCommitment, VoterPubKey);
    if(flag) {
        const requestPromises = [];
        creator.VoterUrl.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter/ExchangeCommitment",
                method: "POST",
                body: {
                    Commitments: creator.commitments,
                    SignerSession: creator.SignerSession
                },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        })
    }
})

app.post("/Creator/GetNonces", function(req, res){
    const VoterNonce = req.body.Nonce;
    const VoterPubKey = req.body.publicKey;

    var flag = creator.GetNonces(VoterNonce, VoterPubKey);
    if(flag) {
        const requestPromises = [];
        creator.VoterUrl.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter/ExchangeNonce",
                method: "POST",
                body: {
                    Nonces: creator.nonces
                },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        })
    }
})

app.post("/Creator/GetPartialSigns", function(req, res){
    const VoterPartialSign = req.body.PartialSign;
    const VoterPubKey = req.body.publicKey;

    var flag = creator.GetPartialSigns(VoterPartialSign, VoterPubKey);
    if(flag) {
        const requestPromises = [];
        creator.VoterUrl.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter/ExchangePartialSign",
                method: "POST",
                body: {
                    PartialSigns: creator.partialsigns
                },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        })
    }
})

app.post("/Voter", function(req, res){
    const seq = req.body.SeqNum;

    if(seqList.indexOf(seq) == -1) {
        voter = new Voter(port, wallet.publicKey, Tree);
        if(voter.IsValid()) {
            voter.CreatorUrl(req.body.CreatorUrl);

            const requestPromises = [];
        
            const requestOptions = {
                uri: voter.CreatorUrl + "/Creator/GetVoters",
                method: "POST",
                body: {VoterUrl: chain.currentNodeUrl, publicKey: wallet.publicKeyCompressed},
                json: true
            };
            requestPromises.push(rp(requestOptions));

        } else {
            voter = null;
        }

        seqList.push(seq);
    
    
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter",
                method: "POST",
                body: {SeqNum: seq, CreatorUrl: req.body.CreatorUrl},
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }

    res.json("Voter triggered")
})

app.post("/Voter/GetData", function(req, res) {
    const pubKeys = req.body.pubKeys;
    const message = req.body.message;
    voter.GetPublicData(pubKeys, message);
    const SignerSession = voter.PrivateSign(wallet.signerPrivateData);

    const requestPromises = [];
        
    const requestOptions = {
        uri: voter.CreatorUrl + "/Creator/GetCommitments",
        method: "POST",
        body: {Commitment: voter.signerPrivateData.session.commitment, publicKey: wallet.publicKeyCompressed, SignerSession: SignerSession},
        json: true
    };
    requestPromises.push(rp(requestOptions));

    res.json("GetData success!")
})

app.post("/Voter/ExchangeCommitment", function(req, res) {
    const commitments = req.body.Commitments;
    const SignerSession = req.body.SignerSession;
    voter.GetSignerSession(SignerSession);
    voter.ExchangeCommitment(commitments);

    const requestPromises = [];
        
    const requestOptions = {
        uri: voter.CreatorUrl + "/Creator/GetNonces",
        method: "POST",
        body: {Nonce: voter.signerPrivateData.session.nonce, publicKey: wallet.publicKeyCompressed},
        json: true
    };
    requestPromises.push(rp(requestOptions));
})

app.post("/Voter/ExchangeNonce", function(req, res) {
    const nonces = req.body.Nonces;
    voter.ExchangeNonce(nonces);

    const requestPromises = [];
        
    const requestOptions = {
        uri: voter.CreatorUrl + "/Creator/GetPartialSigns",
        method: "POST",
        body: {PartialSign: voter.signerPrivateData.session.partialSignature.toHex(), publicKey: wallet.publicKeyCompressed},
        json: true
    };
    requestPromises.push(rp(requestOptions));
})

app.post("/Voter/ExchangePartialSign", function(req, res) {
    const partialsigns = req.body.PartialSigns;
    voter.ExchangePartialSign(partialsigns);
})

app.listen(port, function(){
    console.log(`Listening on port ${port} ...`);
});
