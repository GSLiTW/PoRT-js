const keccak256 = require('keccak256');
const rlp = require('rlp');
const Branch = require('./MPT_Branch');
const Leaf = require('./MPT_Leaf');
const NodeVal = require('./NodeVal');

/**
 * Constructor of the MPT Extension Class
 * @class Data Structure for Merkle Patricia Trie (MPT) Extension Nodes
 * @param  {Boolean} [root=false]
 * @param  {String} [type='account']
 */
 function Extension(root = false, type = 'account') {
    this.type = type;
    this.key = null;
    this.value = null;
    this.next = null;
    this.oldHash = null;
    this.saved=false;
    this.root = root;
};

Extension.prototype.Insert = function (key, balance, tax = 0, dbit = 0) {
    var i = 0;
    while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length)
            break;
    }
    if (i == 0) {
        var newCurNode = new Branch();
        newCurNode.value = null;
        if (this.key.length == 1) {
            newCurNode.branch[parseInt(key[0], 16)] = new Leaf();
            newCurNode.branch[parseInt(key[0], 16)] = newCurNode.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
            newCurNode.branch[parseInt(this.key[0], 16)] = this.next;
            return newCurNode;
        } else {
            newCurNode.branch[parseInt(key[0], 16)] = new Leaf();
            newCurNode.branch[parseInt(key[0], 16)] = newCurNode.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
            newCurNode.branch[parseInt(this.key[0], 16)] = this.next;
            var newNextNode = new Extension();
            newNextNode.key = this.key.substr(1);
            newNextNode.next = this.next;
            newCurNode.branch[parseInt(this.key[0], 16)] = newNextNode;
            return newCurNode;
        }
        /*
        this.mode = 'branch';
        this.value = null;
        if (this.key.length == 1) {
            this.branch[parseInt(key[0], 16)] = new MPT();
            this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
            this.branch[parseInt(this.key[0], 16)] = this.next;
        } else {
            this.branch[parseInt(key[0], 16)] = new MPT();
            this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
            var NewNode = new MPT()
            NewNode.mode = 'extension';
            NewNode.key = this.key.substr(1);
            NewNode.next = this.next;
            this.branch[parseInt(this.key[0], 16)] = NewNode;
        }
        */
    } else if (i == this.key.length) {
        return this.next.Insert(key.substr(i), balance, tax, dbit);
    } else {
        if (i == (this.key.length - 1)) {
            var newNextNode = new Branch();
            newNextNode.branch[parseInt(key[i], 16)] = new Leaf();
            newNextNode.branch[parseInt(key[i], 16)] = newNextNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
            newNextNode.branch[parseInt(this.key[i], 16)] = this.next;
            this.key = key.substr(0, i);
            this.value = null;
            this.next = newNextNode;
            return this;

            /*
            var NewNode = new MPT();
            NewNode.mode = 'branch';
            NewNode.branch[parseInt(key[i], 16)] = new MPT();
            NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
            NewNode.branch[parseInt(this.key[i], 16)] = this.next;
            this.key = key.substr(0, i);
            this.value = null;
            this.next = NewNode;
            */
        } else {
            var newNextNode = new Branch();
            newNextNode.branch[parseInt(key[i], 16)] = new Leaf();
            newNextNode.branch[parseInt(key[i], 16)] = newNextNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
            newNextNode.branch[parseInt(this.key[i], 16)] = new Extension();
            newNextNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i + 1);
            newNextNode.branch[parseInt(this.key[i], 16)].next = this.next;
            this.key = key.substr(0, i);
            this.value = null;
            this.next = newNextNode;
            return this;

            /*
            var NewNode = new MPT();
            NewNode.mode = 'branch';
            NewNode.branch[parseInt(key[i], 16)] = new MPT();
            NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
            NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
            NewNode.branch[parseInt(this.key[i], 16)].mode = 'extension';
            NewNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i + 1);
            NewNode.branch[parseInt(this.key[i], 16)].next = this.next;
            this.key = key.substr(0, i);
            this.value = null;
            this.next = NewNode;
            */
        }
    }
}

module.exports = Extension;