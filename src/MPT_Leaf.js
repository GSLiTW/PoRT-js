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

module.exports = Leaf;