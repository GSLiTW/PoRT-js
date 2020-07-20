// data structure for single transaction
const sha256 = require('sha256');

function Transaction_MT(id, sender, receiver, value) {
    this.id = id;
    this.sender = sender;
    this.receiver = receiver;
    this.value = value;
}

Transaction_MT.prototype.get_id = function() {
    return this.id;
}

Transaction_MT.prototype.get_sender = function() {
    return this.sender;
}

Transaction_MT.prototype.get_receiver = function() {
    return this.receiver;
}

Transaction_MT.prototype.get_value = function() {
    return this.value;
}

module.exports = Transaction_MT;