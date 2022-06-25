const keccak256 = require('keccak256');
const rlp = require('rlp');
const NodeVal = require('./NodeVal');
const Leaf = require('./MPT_Leaf');
const Extension = require('./MPT_Extension');

/**
 * Constructor of the MPT Branch Class
 * @class Data Structure for Merkle Patricia Trie (MPT) Branch Nodes
 * @param  {Boolean} [root=false]
 * @param  {String} [type='account']
 */
 function Branch(root = false, type = 'account') {
    this.type = type;
    this.key = null;
    this.value = null;
    this.oldHash = null;
    this.saved=false;
    this.branch = [null, null, null, null,
        null, null, null, null,
        null, null, null, null,
        null, null, null, null];
    this.root = root;
};

Branch.prototype.Insert = function (key, balance, tax = 0, dbit = 0) {
    if (key.length == 0) {
        this.value = new NodeVal(balance, tax, dbit);
        return this;
    } else {
        this.value = null;
        this.key = null;
        ch = parseInt(key[0], 16);
        if (this.branch[ch] == null) {
            this.branch[ch] = new Leaf();
        }
        this.branch[ch] = this.branch[ch].Insert(key.substr(1), balance, tax, dbit);
        return this;
    }
}

Branch.prototype.Search = function (key) {
    if (key.length == 0) {
        return this.value;
    }
    if (this.branch[parseInt(key[0], 16)] != null) {
        return this.branch[parseInt(key[0], 16)].Search(key.substr(1));
    } else {
        return null;
    }
}

module.exports = Branch;