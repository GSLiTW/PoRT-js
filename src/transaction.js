const TRANSACTION_FEE = 1;
// const uuid = require('uuid/v1')
const sha256 = require('sha256')
const ec = require('elliptic')

function Transaction(senderWallet, to, amount, type) {
    // this.id = uuid(),
    this.type = type,

    this.output = {
        to: to,
        amount: amount - TRANSACTION_FEE,
        fee: TRANSACTION_FEE
    }

    this.input = {
        timestamp: Date.now(),
        from: senderWallet.publicKey,
        signature: senderWallet.sign(sha256(JSON.stringify(this.output).toString()))
    }

}

Transaction.prototype.newTransaction = function(senderWallet, to, amount, type) {
    if (amount + TRANSACTION_FEE > senderWallet.balance) {
      console.log(`Amount : ${amount} exceeds the balance`);
      return;
    }

    return Transaction(senderWallet, to, amount, type);
}



Transaction.prototype.verifyTransaction = function() {
    return ec.ec.KeyFromPublic(this.input.from).verify(sha256(JSON.stringify(this.output).toString(), this.input.signature))
}

module.exports = Transaction;