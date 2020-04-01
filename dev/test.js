const Blockchain = require("./Blockchain");

const chain = new Blockchain();

var block1 = {
    "chain": [
    {
    "index": 1,
    "timestamp": 1580980994224,
    "transactions": [],
    "nonce": 100,
    "hash": "0",
    "previousBlockHash": "0"
    },
    {
    "index": 2,
    "timestamp": 1580981053445,
    "transactions": [],
    "nonce": 18140,
    "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
    "previousBlockHash": "0"
    },
    {
    "index": 3,
    "timestamp": 1580981155931,
    "transactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "4d13f3f048c211ea80dcfb54c3d9848b",
    "transactionId": "70616db048c211ea80dcfb54c3d9848b"
    },
    {
    "amount": 100,
    "sender": "Ricky",
    "recipient": "Titan",
    "transactionId": "96554f5048c211ea80dcfb54c3d9848b"
    }
    ],
    "nonce": 20094,
    "hash": "00005eeb80858a0aa7f7a5e71378db7eda4e0d9e98d5330434bdc1e4e90ebd2a",
    "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
    },
    {
    "index": 4,
    "timestamp": 1580998167318,
    "transactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "25817d8048c211ea8c1e97199c4c20f7",
    "transactionId": "ad7c962048c211ea8c1e97199c4c20f7"
    }
    ],
    "nonce": 28058,
    "hash": "0000081b37ee1f96d5e4cbe8ea0a764e0fa7d6b46c3a2c7410217723efb18670",
    "previousBlockHash": "00005eeb80858a0aa7f7a5e71378db7eda4e0d9e98d5330434bdc1e4e90ebd2a"
    },
    {
    "index": 5,
    "timestamp": 1580998460696,
    "transactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "4d13f3f048c211ea80dcfb54c3d9848b",
    "transactionId": "492bb61048ea11ea80dcfb54c3d9848b"
    },
    {
    "amount": 100,
    "sender": "Ricky",
    "recipient": "Titan"
    },
    {
    "amount": 99,
    "sender": "Ricky",
    "recipient": "Titan"
    }
    ],
    "nonce": 39139,
    "hash": "0000a20eb961e7bf4ffffe62d14d316d3eefc75118964a88eda85fcb56dc3005",
    "previousBlockHash": "0000081b37ee1f96d5e4cbe8ea0a764e0fa7d6b46c3a2c7410217723efb18670"
    }
    ],
    "pendingTransactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "4d13f3f048c211ea80dcfb54c3d9848b",
    "transactionId": "f7e923e048ea11ea80dcfb54c3d9848b"
    },
    {
    "amount": 1,
    "sender": "Ricky",
    "recipient": "Titan"
    },
    {
    "amount": 752782782,
    "sender": "Ricky",
    "recipient": "Titan"
    }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": [
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004"
    ]
    }

    console.log("valid: " + chain.chainIsValid(block1.chain));

// const previousHash = "4046c0daccd13c94709599ad208314a35dc8758ad34dcead29b0e0f2c4dcd607";

// const currentBlockData = [
//     {
//         amount: 20,
//         sender: "Benky",
//         recipient: "Titan"
//     },
//     {
//         amount: 120,
//         sender: "Allen",
//         recipient: "Titan"
//     }
// ];

// console.log(chain.proofOfWork(previousHash, currentBlockData));

// chain.createNewBlock(124, "abc", "bcd");

// chain.createNewTransaction(20, "Benky", "Titan");

// chain.createNewBlock(125, "bcd", "cde");

// chain.createNewTransaction(20, "Benky", "Titan");
// chain.createNewTransaction(5000, "Allen", "Titan");
// chain.createNewTransaction(798600, "Robin", "Titan");

// chain.createNewBlock(126, "cde", "def");

//console.log(chain);