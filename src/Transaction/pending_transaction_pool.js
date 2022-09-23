// data structure for pending txns
const CSV_data = require('./CSV_data.js');
const Transaction_MT = require('./transaction.js');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

function Pending_Transaction_Pool(tx = []) {
  this.transactions = tx;
};

Pending_Transaction_Pool.prototype.create = function(num, MPT) {
  const data = new CSV_data();
  const data_ = data.getData(num); // get data of block1
  if (num == 1 || num == 2) {
    Pending_Transaction_Pool.prototype.addTxs.call(this, Pending_Transaction_Pool.prototype.insertCSVData.call(this, 4, data_, MPT));
  } else if (num == 3) {
    Pending_Transaction_Pool.prototype.addTxs.call(this, Pending_Transaction_Pool.prototype.insertCSVData.call(this, 4, data_, MPT));
  } else console.log('wrong block number.');
};

Pending_Transaction_Pool.prototype.insertCSVData = function(quantity, data, MPT) {
  txns = [];
  for (let i = 1; i < quantity; i++) {
    txns.push(new Transaction_MT(data[i][0], data[i][2], data[i][3], data[i][4], MPT));
  }
  return txns;
};

Pending_Transaction_Pool.prototype.clean = function() {
  this.transactions = [];
};

Pending_Transaction_Pool.prototype.get_transaction = function() {
  return this.transactions;
};

Pending_Transaction_Pool.prototype.get_num_of_transaction = function() {
  return this.transactions.length;
};

Pending_Transaction_Pool.prototype.isRepeat = function(tx) {
  if (this.transactions.filter((e) => e.id === tx.id).length > 0) {
    return true;
  } else {
    return false;
  }
};

Pending_Transaction_Pool.prototype.validate = function(tx) {
  if (tx.value < 0) {
    return false;
  }
  pubkey = ecdsa.recoverPubKey(tx.id, {r:tx.r, s:tx.s}, tx.v-27, "hex");
  if (!ecdsa.verify(tx.id, {r:tx.r, s:tx.s}, pubkey)){
    return false
  }
  return true;
};

Pending_Transaction_Pool.prototype.addTx = function(tx) {
  if (Pending_Transaction_Pool.prototype.validate.call(this, tx) && !Pending_Transaction_Pool.prototype.isRepeat.call(this, tx)) {
    this.transactions.push(tx);
  }
};

Pending_Transaction_Pool.prototype.addTxs = function(txs) {
  txs.forEach((tx) => {
    Pending_Transaction_Pool.prototype.addTx.call(this, tx);
  });
};

Pending_Transaction_Pool.prototype.remove = function(tx) {
  this.transactions.forEach((element, index) => {
    if (tx.id === element.id) {
      this.transactions.splice(index, 1);
    }
  });
};

module.exports = Pending_Transaction_Pool;
