const _bst = require("./binary_search_tree.js");
const sha256 = require("sha256");


function Cosig(id) {
    this.leader = id,
    this.bst = new _bst(),
    this.witness = [],
    this.count = -1
};

Cosig.prototype.announcement = function(id){
    if(this.count == -1){
        this.bst.insert(id);
        this.count++;
    }
    else{
        this.bst.insert(id);
        this.witness.push(id);
    }
}

Cosig.prototype.commitment = function(node){
    if (node == null){
        return 1;
    }
    else if(node !== null)
    { 
        return node.sign * this.commitment(node.left) * this.commitment(node.right);
    }
}

Cosig.prototype.challenge = function(cosig, message){
    return sha256(cosig + message);
    //return sha256(cosig.concat(message));
}

Cosig.prototype.response = function(node, C){
    if (node == null){
        return 0;
    }
    else if(node !== null)
    { 
        return (node.sign - node.privateKey * C) + this.response(node.left) + this.response(node.right);
    }
}

/*var BST = new bst();
BST.insert(15); 
BST.insert(25); 
BST.insert(10); 
BST.insert(7); 
BST.insert(22); 
BST.insert(17); 
BST.insert(13); 
BST.insert(5); 
BST.insert(9); 
BST.insert(27);

BST.remove(5);
BST.remove(7);
BST.remove(15);

var root = BST.getRootNode();
BST.inorder(root);*/

module.exports = Cosig;