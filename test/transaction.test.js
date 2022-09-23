const Txn_Pool = require("../src/Transaction/pending_transaction_pool");
const Txn = require("../src/Transaction/transaction");
const Blockchain = require("../src/Block/blockchain");
const MPT = require("../MPT/MPT");
const fs = require("fs");
const wallet = require("../src/wallet");

describe("txpooltest", () => {
  // Applies only to tests in this describe block
  const data = fs
    .readFileSync("./data/node_address_mapping_table.csv")
    .toString() // convert Buffer to string
    .split("\n") // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(",").map((e) => e.trim())); // split each line to array

  const Tree = new MPT(true);

  for (var i = 0; i < 157; i++) {
    if (i == 2)
      Tree.Insert(
        data[i][2],
        1000,
        1000 * 0.0001,
        1
      ); // dbit == 1 means creator
    else if (i == 4)
      Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 6)
      Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 8)
      Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 0);
  }

  test("test tx get value", () => {
    var txpool = new Txn_Pool();
    txpool.create(1, Tree);
    txs = txpool.get_transaction();
    expect(Number(txs[0].get_value(0))).toBe(0);
  });

  test("test tx get ID", () => {
    var txpool = new Txn_Pool();
    txpool.create(1, Tree);
    txs = txpool.get_transaction();
    expect(txs[0].get_id(0)).toMatch(
      "0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012"
    );
  });

  test("test tx get sender", () => {
    var txpool = new Txn_Pool();
    txpool.create(1, Tree);
    txs = txpool.get_transaction();
    expect(txs[0].get_sender(0)).toMatch(
      "04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc"
    );
  });

  test("test tx get receiver", () => {
    var txpool = new Txn_Pool();
    txpool.create(1, Tree);
    txs = txpool.get_transaction();
    expect(txs[0].get_receiver(0)).toMatch(
      "04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8"
    );
  });

  test("test tx get receiver", () => {
    var txpool = new Txn_Pool();
    txpool.create(1, Tree);
    txpool.addTx(
      new Txn(
        "0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012",
        "04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc",
        "04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e1",
        "1",
        Tree
      ),
      Tree
    );
    txs = txpool.get_transaction();
    searchrslt = Tree.Search(
      "04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e1"
    );
    expect(searchrslt).toBeDefined();
  });

  test("wallet port map", () => {
    expect(wallet.getAddress(3000)).toMatch(
      "0x76f72b060b2f0a702f5fada34d005578f3b0e8f8"
    );
  });
});
