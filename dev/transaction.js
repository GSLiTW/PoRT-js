

function Transaction(amount, sender, recipient) {
    this.amount = amount,
    this.sender = sender,
    this.recipient = recipient,
    this.transactionId = uuid.split('-').join("")
}

module.exports = Transaction;