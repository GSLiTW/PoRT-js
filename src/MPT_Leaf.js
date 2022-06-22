const keccak256 = require('keccak256');
const rlp = require('rlp');
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
    } else {
        console.log(">Weird request. User already exist");
        return null;
    }
}

module.exports = Leaf;