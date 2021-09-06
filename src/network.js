var express = require('express');
var app = express();
const bodyParser = require("body-parser");
const port = process.argv[2];
const rp = require("promise-request-retry");
const fs = require("fs");

// macros
const VOTER_NUM = 3;

// local modules
const Blockchain = require("./blockchain.js");
const Transaction = require("./transaction.js")
const MPT = require('./MPT');
const Pending_Txn_Pool = require('./pending_transaction_pool');
const Wallet = require('./wallet');
const backup = require('./backup');

const Backup = new backup();
const Creator = require('./creator');
const Voter = require('./voter');

const Block = require('./block.js');

// preprocess
var data = fs.readFileSync('./data/node_address_mapping_table.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map(e => e.trim()) // remove white spaces for each line
    .map(e => e.split(',').map(e => e.trim())); // split each line to array

var w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map(e => e.trim()) // remove white spaces for each line
    .map(e => e.split(',').map(e => e.trim())); // split each line to array
const wallet = new Wallet(w[port - 3000][1], w[port - 3000][2], 10);
w = undefined;


const Tree = new MPT(true);

for (var i = 0; i < 157; i++) {
    if (i == 2) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 1); // dbit == 1 means creator
    else if (i == 4) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 6) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 8) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 0);
}


const chain = new Blockchain(Tree);

for (var i = 0, UpdateList = chain.chain[0].transactions; i < UpdateList.length; i++) {
    Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
}

Tree.Cal_old_hash();
Tree.ResetSaved();

var pending_txn_pool = new Pending_Txn_Pool();
pending_txn_pool.create(2);

var tempBlock = new Block(4000719, pending_txn_pool.transactions,chain.chain[0].hash, Tree);
tempBlock.timestamp = 1604671786702;
tempBlock.hash = '0f274ddbe0d9031e4c599c494bddbdea481a5a5caf3d7f0ec28a05708b2302f1';
tempBlock.nextCreator = '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8';
tempBlock.nextVoters = ['040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b', '04471e6c2ec29e66b89e816217d6f172959b60a2f13071cfeb698fdaed2e23e23b7693ed687088a736b8912f5cc81f3af46e6c486f64165e6818da2da713407f92', '04665d86db1e1be975cca04ca255d11da51928b1d5c4e18d5f3163dbc62d6a5536fa4939ced9ae9faf9e1624db5c9f4d9d64da3a9af93b9896d3ea0c52b41c296d'];

pending_txn_pool.clean();
pending_txn_pool.create(3);


if (port >= 3002) {
    for (var p = port - 2; p < port; p++) {
        const newNodeUrl = "http://localhost:" + p;
        if (chain.networkNodes.indexOf(newNodeUrl) == -1)
            chain.networkNodes.push(newNodeUrl);

        const regNodesPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/register-node",
                method: "POST",
                body: { newNodeUrl: newNodeUrl },
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
                body: { allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl] },
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
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", function (req, res) {
    res.send(chain);
});

app.get("/wallet", function (req, res) {
    res.send({ wallet: wallet, backupinfo: Backup });
})

app.get("/MPT", function (req, res) {
    res.send(Tree);
});

app.get("/transaction-pool", function (req, res) {
    res.send(pending_txn_pool);
});

app.get("/MPT/Search/:key", function (req, res) {
    const key = req.params.key;
    res.json({ key: key, balance: Tree.Search(key) });
});

app.post("/MPT/UpdateValues", function (req, res) {
    const UpdateList = req.body.UpdateList;
    for (var i = 0; i < UpdateList.length; i++) {
        Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
    }

    var seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateValues",
            method: "POST",
            body: { SeqNum: seq, UpdateList: UpdateList },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})

app.post("/MPT/ReceiveUpdateValues", function (req, res) {
    const UpdateList = req.body.UpdateList;
    const seq = req.body.SeqNum;

    if (seqList.indexOf(seq) == -1) {
        for (var i = 0; i < UpdateList.length; i++) {
            Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, UpdateList[i].value);
        }
        seqList.push(seq);


        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateValues",
                method: "POST",
                body: { SeqNum: seq, UpdateList: UpdateList },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }

    res.sendStatus(200)
});

app.post("/MPT/UpdateTax", function (req, res) {
    const UpdateList = req.body.UpdateList;
    for (var i = 0; i < UpdateList.length; i++) {
        Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
    }

    var seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateTax",
            method: "POST",
            body: { SeqNum: seq, UpdateList: UpdateList },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})

app.post("/MPT/ReceiveUpdateTax", function (req, res) {
    const UpdateList = req.body.UpdateList;
    const seq = req.body.SeqNum;

    if (seqList.indexOf(seq) == -1) {
        for (var i = 0; i < UpdateList.length; i++) {
            Tree.UpdateTax(UpdateList[i].taxpayer, UpdateList[i].value);
        }
        seqList.push(seq);


        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateTax",
                method: "POST",
                body: { SeqNum: seq, UpdateList: UpdateList },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }

    res.sendStatus(200);
});

app.post("/MPT/UpdateDbit", function (req, res) {
    const UpdateList = req.body.UpdateList;
    for (var i = 0; i < UpdateList.length; i++) {
        Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
    }

    var seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/MPT/ReceiveUpdateDbit",
            method: "POST",
            body: { SeqNum: seq, UpdateList: UpdateList },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    res.json({
        note: "Update Successfully."
    })

})

app.post("/blockchain/createblock", function (req, res) {
    const lastBlock = chain.getLastBlock();
    const previousBlockHash = lastBlock["hash"];
    const newBlock = chain.createNewBlock(pending_txn_pool.transactions, previousBlockHash);

    var seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/receive-new-block",
            method: "POST",
            body: { SeqNum: seq, newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });


    for (var i = 0, UpdateList = chain.getLastBlock().transactions; i < UpdateList.length; i++) {
        Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
    }

    pending_txn_pool.clean();
    if (req.body.num == 2)
        pending_txn_pool.create(3);

    res.json({
        note: "Create Successfully."
    })
})

app.post("/MPT/ReceiveUpdateDbit", function (req, res) {
    const UpdateList = req.body.UpdateList;
    const seq = req.body.SeqNum;
    if (SeqList.indexOf(seq) == -1) {
        for (var i = 0; i < UpdateList.length; i++) {
            Tree.UpdateDbit(UpdateList[i].maintainer, UpdateList[i].dbit);
        }
        seqList.push(seq);


        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/MPT/ReceiveUpdateDbit",
                method: "POST",
                body: { SeqNum: seq, UpdateList: UpdateList },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }

    res.sendStatus(200);

});

app.get("/transaction/third-block", function (req, res) {
    pending_txn_pool.create(3);
    res.json({ note: `push transactions of the third etherscan into pending txn pool.` })
})

app.post("/transaction/broadcast", function (req, res) {
    const newTransaction = Transaction(req.body.amount, req.body.sender, req.body.recipient)
    chain.addTransactionToPendingTransaction(newTransaction);

    var seq = seqList[seqList.length - 1] + 1;
    seqList.push(seq);

    const requestPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/transaction",
            method: "POST",
            body: { SeqNum: seq, NewTxs: newTransaction },
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then(data => {
        res.json({ note: "Transaction created and broadcast successfully." });
    });
});

app.post("/receive-new-block", function (req, res) {
    const seq = req.body.SeqNum;
    if (seqList.indexOf(seq) == -1) {
        const newBlock = req.body.newBlock;
        const lastBlock = chain.getLastBlock();
        const correctHash = lastBlock.hash === tempBlock.previousBlockHash;
        const correctIndex = lastBlock["height"] + 1 == tempBlock["height"];

        if(!Tree.saved)
        Tree.Cal_old_hash();


        for (var i = 0, UpdateList = tempBlock.transactions; i < UpdateList.length; i++) {
            Tree.UpdateValue(UpdateList[i].sender, UpdateList[i].receiver, parseFloat(UpdateList[i].value));
        }


        Tree.UpdateDbit(lastBlock.nextCreator, 0);
        Tree.UpdateDbit(tempBlock.nextCreator, 1);

        for (var i = 0; i < tempBlock.nextVoters.length; i++) {
            Tree.UpdateDbit(lastBlock.nextVoters[i], 0);
            Tree.UpdateDbit(tempBlock.nextVoters[i], 2);
        }


        if (correctHash && correctIndex) {
            // refund creator's & voter's tax
            if (lastBlock["height"] >= 4000718) {
                Tree.RefundTax(lastBlock.nextCreator, Tree.Search(lastBlock.nextCreator)[1]);
                for (var i = 0; i < lastBlock.nextVoters.length; i++) {
                    Tree.RefundTax(lastBlock.nextVoters[i], (Tree.Search(lastBlock.nextVoters[i])[1]) * 0.7);
                }
                
            }

            console.log(tempBlock);

            chain.chain.push(tempBlock);
            

            console.log('hi');
            

            console.log('old hash: '+Tree.oldHash);
            console.log('new hash: '+Tree.Cal_hash());

            pending_txn_pool.clean();
            if (newBlock.height == 4000720) pending_txn_pool.create(3);
            var currentdate = new Date();
            var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "."
                + currentdate.getMilliseconds();
            console.log(datetime);
            res.json({
                note: 'New block received and accepted.',
                newBlock: newBlock
            });
        }
        else {
            res.json({
                note: 'New block rejected.',
                newBlock: newBlock
            });
        }

        seqList.push(seq);

        tempBlock = newBlock;
        Tree.ResetSaved();
        console.log(tempBlock);

        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/receive-new-block",
                method: "POST",
                body: { SeqNum: seq, newBlock: newBlock },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    } else {
        res.sendStatus(200);
    }
    
});

app.get("/PKA", function (req, res) {
    res.send(Backup.pka);
})

app.post("/addPKA/:port", function (req, res) {
    let trusteeport = req.params.port;
    const requestPromises = [];
    const requestOptions = {
        uri: "http://localhost:" + trusteeport + "/returnPK",
        method: "POST",
        body: {
            note: "hello from owner",
            ownerPort: port
        },
        json: true
    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data => {
        res.json({ PKA: Backup.pka });
    })


})

app.post("/returnPK", function (req, res) {
    let ownerport = req.body.ownerPort;
    const requestPromises = [];
    const requestOptions = {
        uri: "http://localhost:" + ownerport + "/getPK",
        method: "POST",
        body: {
            note: "respones from trustee",
            trusteePK: wallet.publicKey,
            trusteeport: port
        },
        json: true
    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data => {
        res.json({ note: "return pk finish" });
    })

})

app.post("/getPK", function (req, res) {
    Backup.pka[req.body.trusteeport] = req.body.trusteePK;
    res.json({ note: "get PK finish" });
})

app.post("/deletePKA/:port", function (req, res) {
    delete Backup.pka[req.params.port];
    res.json({ PKA: Backup.pka });
})

app.get("/backup", async function (req, res) {
    var count = 0, i;
    for (i in Backup.pka) {
        count++;
    }
    if (count < 6) {
        res.json({ message: "Please add more trustee !" });
    } else {
        myPrivateKey = wallet.privateKey;
        await Backup.init(myPrivateKey);
        res.json({ message: "create file success !" });
    }

})

app.post("/recoveryReq/:trusteeport", function (req, res) {
    let data = Backup.inputfile();
    let file = JSON.parse(data);
    let pkshar = file['PK_Shares'];
    const trusteeUrl = "http://localhost:" + req.params.trusteeport;
    const requestPromises = [];
    const requestOptions = {
        uri: trusteeUrl + "/decrypt",
        method: "POST",
        body: {
            share: pkshar,
            publicKey: wallet.publicKey,
            ownerurl: "http://localhost:" + port
        },
        json: true
    };

    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data => {
        res.json({
            message: "finish",
            share: Backup.recoveryshare
        });
    })

})

app.post("/recoveryReq", function (req, res) {
    let data = Backup.inputfile();
    let file = JSON.parse(data);
    let pkshar = file['PK_Shares'];
    const requestPromises = [];
    for (var i in Backup.pka) {
        const trusteeUrl = "http://localhost:" + i;
        const requestOptions = {
            uri: trusteeUrl + "/decrypt",
            method: "POST",
            body: {
                share: pkshar,
                publicKey: wallet.publicKey,
                ownerurl: "http://localhost:" + port
            },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    }
    Promise.all(requestPromises).then(data => {
        res.json({
            message: "finish",
            share: Backup.recoveryshare
        });
    })
})

app.post("/decrypt", async function (req, res) {
    ownerShare = (await Backup.recovery(wallet.privateKey, req.body.publicKey, req.body.share));

    const requestPromises = [];
    const requestOptions = {
        uri: req.body.ownerurl + "/getResponse",
        method: "POST",
        body: {
            share: ownerShare
        },
        json: true

    };
    requestPromises.push(rp(requestOptions));
    Promise.all(requestPromises).then(data => {
        res.json({
            message: "success",
            decript_share: ownerShare
        })
    })



})

app.post("/getResponse", function (req, res) {
    let share = req.body.share;
    console.log(share);
    Backup.recoveryshare.push(share);
    res.json({ shares: Backup.recoveryshare });
})

app.get("/combine", function (req, res) {
    let data = Backup.inputfile();
    let file = JSON.parse(data);
    let tksk = file['TK_SK'];
    res.json({ your_privateKey: Backup.combine(Backup.recoveryshare, tksk) });
})

//register a new node and broadcast it to network nodes
app.get("/register-and-broadcast-node", function (req, res) {
    const newNodeUrl = "http://localhost:" + port;
    if (chain.networkNodes.indexOf(newNodeUrl) == -1)
        chain.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    chain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/register-node",
            method: "POST",
            body: { newNodeUrl: newNodeUrl },
            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises).then(data => {
        //use the data
        const bulkRegisterOptions = {
            uri: newNodeUrl + "/register-nodes-bulk",
            method: "POST",
            body: { allNetworkNodes: [...chain.networkNodes, chain.currentNodeUrl] },
            json: true
        }

        return rp(bulkRegisterOptions);
    })
        .then(data => {
            res.json({ note: "New node registered with network successfully." });
        });
});

//network nodes register the new node
app.post("/register-node", function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = chain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = chain.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
        chain.networkNodes.push(newNodeUrl);
    res.json({ note: "New node registerd successfully with node." });
});

//new node registers all network nodes
app.post("/register-nodes-bulk", function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = chain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = chain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode)
            chain.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: "Bulk registeration successful." });
});

app.get('/block/:blockHash', function (req, res) {
    const blockHash = req.params.blockHash;
    const correctBlock = chain.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function (req, res) {
    const transactionId = req.params.transactionId;
    const transactionData = chain.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    });
});

app.get('/address/:address', function (req, res) {
    const address = req.params.address;
    const addressData = chain.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

app.get("/block-explorer", function (req, res) {
    res.sendFile("./block-explorer/index.html", { root: __dirname });
});

app.get("/Creator", function (req, res) {
    creator = new Creator(port, wallet, Tree);
    
    if (creator.IsValid()) {
        
        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds() + "."
            + currentdate.getMilliseconds();

        // Create new temporary block
        blockToVote = creator.Create(pending_txn_pool, tempBlock.height + 1, tempBlock.hash);

        var seq = seqList[seqList.length - 1] + 1;
        seqList.push(seq);
        for(var i=0;i<seqList.length;i++)
        {
            console.log(seqList[i]);
        }

        // Broadcast to find Voters
        const requestPromises = [];
        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter",
                method: "POST",
                body: { SeqNum: seq, CreatorUrl: chain.currentNodeUrl },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });

        res.json({
            SeqNum: seq, CreatorUrl: chain.currentNodeUrl, Time: datetime
        })
    } else {
        creator = null;

        res.json("Error: Not Creator");
    }

})

app.post("/Voter", function (req, res) {
    const seq = req.body.SeqNum;

    if (seqList.indexOf(seq) == -1) {
        voter = new Voter(port, wallet, Tree);
        if (voter.IsValid()) {
            console.log('i am voter');

            voter.CreatorUrl(req.body.CreatorUrl);

            const requestPromises = [];

            const requestOptions = {
                uri: voter.CreatorUrl + "/Creator/Challenge",
                method: "POST",
                body: { VoterUrl: chain.currentNodeUrl, 
                    publicKey: wallet.publicKey.encode('hex'),
                    publicV: voter.publicV.encode('hex') },
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
                body: { SeqNum: seq, CreatorUrl: req.body.CreatorUrl },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });
    }

    res.json("Voter triggered")
})

app.post("/Creator/Challenge", function (req, res) {
    const VoterUrl = req.body.VoterUrl;
    const VoterPubKeyHex = req.body.publicKey;
    const VoterPubVHex = req.body.publicV;

    const VoterPubKey = wallet.PublicKeyFromHex(VoterPubKeyHex);
    const VoterPubV = wallet.PublicKeyFromHex(VoterPubVHex);

    creator.GetVoter(VoterUrl, VoterPubKey, VoterPubV);
    

    if (creator.VoterUrl.length == VOTER_NUM) {
        
        const challenge = creator.GenerateChallenge();
        
        const requestPromises = [];
        creator.VoterUrl.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/Voter/Response",
                method: "POST",
                body: {
                    challenge: challenge,
                    message: tempBlock,
                },
                json: true
            };
            requestPromises.push(rp(requestOptions));
        });

    }

    res.json("GetVoters success!");
})

app.post("/Voter/Response", function (req, res) {
    const isBlockValid = voter.VerifyBlock(req.body.message.merkleRoot, voter.MPT);
    if (isBlockValid) {
        const challenge = req.body.challenge;
        //console.log(challenge);
        
        const response = voter.GenerateResponse(challenge);
        //console.log(response);

        const requestPromises = [];

        const requestOptions = {
            uri: voter.CreatorUrl + "/Creator/GetResponses",
            method: "POST",
            body: { response: response },
            json: true
        };
        requestPromises.push(rp(requestOptions));

        res.json("Response Generated");
    }
    else {
        console.log("Error: Block verification failed !");
    }
})

app.post("/Creator/GetResponses", function (req, res) {
    const response = req.body.response;
    creator.GetResponses(response);

    if (creator.VoterResponse.length == VOTER_NUM) {
        creator.AggregateResponse();

        var seq = seqList[seqList.length - 1] + 1;

        const requestPromises = [];
        const requestOptions = {
            uri: "http://localhost:" + creator.port + "/Creator/GetBlock",
            method: "POST",
            body: { seqNum: seq },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    }
    res.sendStatus(200);
})

app.post("/Creator/GetBlock", function (req, res) {
    var seq = req.body.seqNum;//has fault

    if (seqList.indexOf(seq) == -1) {
        seqList.push(seq);
        var lastBlock = chain.getLastBlock();

        if(!Tree.saved)
        Tree.Cal_old_hash();

        // refund creator's & voter's tax
        if (lastBlock["height"] >= 4000718) {
            Tree.RefundTax(lastBlock.nextCreator, Tree.Search(lastBlock.nextCreator)[1]);
            for (var i = 0; i < lastBlock.nextVoters.length; i++) {
                Tree.RefundTax(lastBlock.nextVoters[i], (Tree.Search(lastBlock.nextVoters[i])[1]) * 0.7);
            }
        }

        var newBlock = creator.GetBlock(tempBlock.hash);

        Tree.UpdateDbit(lastBlock.nextCreator, 0);
        Tree.UpdateDbit(tempBlock.nextCreator, 1);

        for (var i = 0; i < lastBlock.nextVoters.length; i++) {
            Tree.UpdateDbit(lastBlock.nextVoters[i], 0);
            Tree.UpdateDbit(tempBlock.nextVoters[i], 2);
        }
        console.log(tempBlock);
        chain.chain.push(tempBlock);
        pending_txn_pool.clean();
        if (newBlock.height == 4000720) pending_txn_pool.create(3);

        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds() + "."
            + currentdate.getMilliseconds();
        console.log(datetime);

        seq = seqList[seqList.length - 1] + 1;
        seqList.push(seq);

        chain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + "/receive-new-block",
                method: "POST",
                body: { SeqNum: seq, newBlock: newBlock },
                json: true
            };
            rp(requestOptions);
        });

        res.send("Create Block Succeed.")
    } else {
        res.sendStatus(200);
    }
})

app.listen(port, function () {
    console.log(`Listening on port ${port} ...`);
});
