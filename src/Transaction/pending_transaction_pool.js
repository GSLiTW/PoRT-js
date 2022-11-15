// data structure for pending txns
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

function Pending_Transaction_Pool(tx = []) {
  this.transactions = tx;
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

  const hexToDecimal = (x) => ecdsa.keyFromPrivate(x, 'hex').getPrivate().toString(10);
  const pubkey = ecdsa.recoverPubKey(
      hexToDecimal(tx.id.substr(2)), tx.sig, tx.sig.recoveryParam, 'hex');

  if (!pubkey) {
    console.log('verifyfail');
    return false;
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
