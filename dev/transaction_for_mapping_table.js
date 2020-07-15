const sha256 = require('sha256')

function Transaction_MT(id, sender, receiver, value) {
    this.id = id;
    this.sender = sender;
    this.receiver = receiver;
    this.value = value;
}

module.exports = Transaction_MT;