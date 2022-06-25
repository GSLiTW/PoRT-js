const keccak256 = require('keccak256');
const rlp = require('rlp');
const Extension = require('./MPT_Extension');
const Branch = require('./MPT_Branch');
const NodeVal = require('./NodeVal');

/**
 * Constructor of the MPT Leaf Class
 * @class Data Structure for Merkle Patricia Trie (MPT) Leaf Nodes
 * @param  {Boolean} [root=false]
 * @param  {String} [type='account']
 */
 function Leaf(root = false, type = 'account') {
    this.type = type;
    this.key = null;
    this.value = null;
    this.oldHash = null;
    this.saved=false;
    this.root = root;
};

Leaf.prototype.Insert = function (key, balance, tax = 0, dbit = 0) {
    if (this.value == null) {
        this.key = key;
        this.value = new NodeVal(balance, tax, dbit);
        return this;
    } else if (key == this.key) {
        console.log(">Weird request. User already exist");
        return null;
    } else {
        var i = 0;
        while (key[i] == this.key[i]) {
            i++;
            if (i == key.length)
                break;
        }
        if (i == 0) {
            let newCurNode = new Branch();
            newCurNode.branch[parseInt(key[0], 16)] = new Leaf();
            newCurNode.branch[parseInt(key[0], 16)] = newCurNode.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
            newCurNode.branch[parseInt(this.key[0], 16)] = new Leaf();
            newCurNode.branch[parseInt(this.key[0], 16)] = newCurNode.branch[parseInt(this.key[0], 16)].Insert(this.key.substr(1), this.value.Balance(), this.value.Tax(), this.value.Dbit());
            return newCurNode;
            
        } else {
            let newCurNode = new Extension();
            let newNextNode = new Branch();
            newNextNode.branch[parseInt(key[i], 16)] = new Leaf();
            newNextNode.branch[parseInt(key[i], 16)] = newNextNode.Insert(key.substr(i + 1), balance, tax, dbit);
            newNextNode.branch[parseInt(this.key[i], 16)] = new Leaf();
            newNextNode.branch[parseInt(this.key[i], 16)] = newNextNode.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(i + 1), this.value.Balance(), this.value.Tax(), this.value.Dbit());
            newCurNode.key = key.substr(0, i);
            newCurNode.next = newNextNode;
            newCurNode.value = null;
            return newCurNode;
        }
    }
}

module.exports = Leaf;