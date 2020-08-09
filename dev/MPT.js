const keccak256 = require('keccak256');
const rlp = require('rlp');

// Convert a hex string to a byte array
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}

function MPT(root=false){
    this.mode = null;
    this.key  = null;
    this.value = null;
    this.next = null;
    this.branch = [ null, null, null, null,
        null, null, null, null,
        null, null, null, null,
        null, null, null, null ]
    this.Update_flag = null
    this.Update_value = null
    this.root = root
};

MPT.prototype.Display = function(level) {
    if(level == 0) console.log("**********START PRINTING TRIE**********");
    if(this.mode == null) {
        console.log("Empty Trie")
    } else if(this.mode == 'leaf') {
        if((this.key.length)%2==0){
            prefix = '20';
        }
        else{
            prefix = '3';
        }
        console.log( ">" + '\t'.repeat(level) + "leaf: (" + prefix +")" + this.key + ", " + this.value);
    } else if(this.mode == 'extension') {
        if((this.key.length)%2==0){
            prefix = '00';
        }
        else{
            prefix = '1';
        }
        console.log(">" + '\t'.repeat(level) + "extension: (" + prefix +")" + this.key);
        this.next.Display(level+1);
    } else if(this.mode == 'branch'){
        console.log(">" + '\t'.repeat(level) + "branch");
        var j = 0;
        for(var i in this.branch){
            if(this.branch[i] != null){
                if(j == 16) {
                    console.log(">" + '\t'.repeat(level) + "      value:");
                } else {
                    console.log(">" + '\t'.repeat(level) + "      " + j.toString(16) + ":");
                }
                this.branch[i].Display(level+1);
            }
            j += 1;
        }
    }
    if(level == 0) console.log("**********FINiSH PRINTING TRIE**********");
};

MPT.prototype.Insert = function(key, value) {
    if(this.mode != null){
        if(key == this.key){
            console.log(">Weird request. User already exist");
            return;
        }
    }
    if(this.mode == null){
        this.mode = 'leaf';
        this.key = key;
        this.value = value;
    } else if(this.mode == 'branch'){
        if(key.length == 0){
            this.value = value;
        } else {
            ch = parseInt(key[0], 16);
            if(this.branch[ch] == null){
                this.branch[ch] = new MPT();
            }
            this.branch[ch].Insert(key.substr(1),value);
        }

    } else if(this.mode=='extension') {
        var i = 0;
        while(key[i] == this.key[i]){
            i++;
            if(i == this.key.length)
                break;
        }
        if(i == 0){
            this.mode = 'branch';
            if(this.key.length == 1){
                this.branch[parseInt(key[0],16)] = new MPT();
                this.branch[parseInt(key[0],16)].Insert(key.substr(1),value);
                this.branch[parseInt(this.key[0],16)] = this.next;
            } else {
                this.branch[parseInt(key[0],16)] = new MPT();
                this.branch[parseInt(key[0],16)].Insert(key.substr(1),value);
                var NewNode = new MPT()
                NewNode.mode = 'extension';
                NewNode.key = this.key.substr(1);
                NewNode.next = this.next;
                this.branch[parseInt(this.key[0],16)] = NewNode;
            }
        } else if(i == this.key.length) {
            this.next.Insert(key.substr(i),value);
        } else {
            if(i == (this.key.length - 1)) {
                var NewNode = new MPT();
                NewNode.mode = 'branch';
                NewNode.branch[parseInt(key[i], 16)] = new MPT();
                NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i+1),value);
                NewNode.branch[parseInt(this.key[i], 16)] = this.next;
                this.key = key.substr(0,i);
                this.next = NewNode;
            } else {
                var NewNode = new MPT();
                NewNode.mode = 'branch';
                NewNode.branch[parseInt(key[i], 16)] = new MPT();
                NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i+1),value);
                NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
                NewNode.branch[parseInt(this.key[i], 16)].mode = 'extension';
                NewNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i+1);
                NewNode.branch[parseInt(this.key[i], 16)].next = this.next;
                this.key = key.substr(0,i);
                this.next = NewNode;
            }
        }
    }
    else if(this.mode == 'leaf'){
        var i = 0;
        while(key[i] == this.key[i]) {
            i++;
            if(i == key.length) break;
        }
        if(i == 0) {
            this.mode = 'branch';
            this.branch[parseInt(key[0],16)] = new MPT();
            this.branch[parseInt(key[0],16)].Insert(key.substr(1), value);
            this.branch[parseInt(this.key[i], 16)] = new MPT();
            this.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(1), this.value);

        } else {
            this.mode = 'extension';
            var NewNode = new MPT();
            NewNode.mode = 'branch';
            NewNode.branch[parseInt(key[i],16)] = new MPT();
            NewNode.branch[parseInt(key[i],16)].Insert(key.substr(i+1),value);
            NewNode.branch[parseInt(this.key[i],16)] = new MPT();
            NewNode.branch[parseInt(this.key[i],16)].Insert(this.key.substr(i+1),this.value);
            this.key = key.substr(0,i);
            this.next = NewNode;
        }
    }

};

MPT.prototype.Search = function(key, Update_flag=null, Update_value=null) {
    if(this.mode == 'leaf') {
        if(this.key == key) {
            if(Update_flag == '-') {
                if(this.value >= Update_value) {
                    this.value -= Update_value;
                    return this.value;
                } else {
                    return null;
                }
            } else if(Update_flag == '+') {
                this.value += Update_value;
                return this.value;
            } else {
                return this.value;
            }
        }
    } else if(this.mode == 'extension') {
        var i = 0;
        while(key[i] == this.key[i]) {
            i++;
            if(i == this.key.length)
                break;
        }
        if(i == this.key.length) {
            return this.next.Search(key.substr(i),Update_flag,Update_value);
        } else {
            return null;
        }
    } else if(this.mode == 'branch') {
        if(this.branch[parseInt(key[0], 16)] != null) {
            return this.branch[parseInt(key[0],16)].Search(key.substr(1), Update_flag, Update_value);
        } else {
            return null;
        }
    }
};

MPT.prototype.Update = function(from, to, value) {
    if(value <= 0) {
        console.log("> Weird request: Update value should be larger than 0.");
        return;
    }

    var val1 = this.Search(from, '-', value);
    if(val1 == null) {
        console.log("> An error occurred when updating " + from + "'s value.");
        return;
    }

    var val2 = this.Search(to, '+', value);
    if(val2 == null) {
        console.log("> An error occurred when updating " + to + "'s value.");
        return;
    }

    console.log("> Update successfully.\nNow " + from + " has value " + val1 + ", " + to + " has value " + val2 + ".");
    return;
};

MPT.prototype.Cal_pack_nibble = function() {
    var element = null;
    if(this.mode == 'leaf') {
        element = 2;
    } else if(this.mode == 'extension') {
        element = 0;
    } else {
        return;
    }

    var odd = this.key.length % 2;
    element |= odd;
    ///console.log(element)

    if(odd == 0) {
        // console.log(Buffer.from(element.toString() + "0" + this.key, 'hex'))
        return Buffer.from(element.toString() + "0" + this.key, 'hex');
    } else {
        // console.log(Buffer.from(element.toString() + this.key, 'hex'))
        return Buffer.from(element.toString() + this.key, 'hex');
    }
};

MPT.prototype.Cal_hash = function(){
    var Node = [];
    if(this.mode == null) {
        return "Root Not Found Error: Trie is not built yet.";
    } else if(this.mode == 'leaf') {
        Node = [this.Cal_pack_nibble(), Buffer.from(this.value.toString())];
    } else if(this.mode == 'extension') {
        Node = [this.Cal_pack_nibble(), this.next.Cal_hash()];
    } else if(this.mode == 'branch') {
        Node = [];
        for(var i in this.branch) {
            if(this.branch[i] == null) {
                Node.push(Buffer(''));
            } else {
                Node.push(this.branch[i].Cal_hash());
            }
        }
        Node.push(Buffer(''));
    }

    // console.log(Node)
    if(this.root == true) {
        return keccak256(rlp.encode(Node)).toString('hex');
    } else {
        if(rlp.encode(Node).length >= 32) {
            return keccak256(rlp.encode(Node));
        } else {
            return Node;
        }
    }
};

module.exports = MPT;

// TestCase 1: 5838ad5578f346f40d3e6b71f9a82ae6e5198dd39c52e18deec63734da512055
Tree = new MPT(true);
Tree.Insert('a711355',45);
Tree.Insert('a77d337',1);
Tree.Insert('a7f9365',2);
Tree.Insert('a77d397',12);
Tree.Display(0);
console.log("State Root: " + Tree.Cal_hash());

// TestCase 2: b3506d16d769a8aaf5e2fe2f4449a673b408472c04ba0e0837aba0bc9d5364cd
Tree = new MPT(true);
Tree.Insert('7c3002ad756d76a643cb09cd45409608abb642d9',10);
Tree.Insert('7c303333756d555643cb09cd45409608abb642d9',20);
Tree.Insert('7c303333756d777643cb09c999409608abb642d9',30);
Tree.Insert('7c303333756d777643cb09caaa409608abb642d9',40);
Tree.Insert('111102ad756d76a643cb09cd45409608abb642d9',50);
Tree.Display(0);
console.log("State Root: " + Tree.Cal_hash());

// TestCase 3: eff402b46c2b81e230797cf224c5440aefde9335594271e19da8c75ecc476d08
Tree.Update('7c3002ad756d76a643cb09cd45409608abb642d9',
            '7c303333756d777643cb09caaa409608abb642d9',2);
Tree.Insert('11113333756d76a643cb09cd45409608abb642d9',0);
Tree.Update('7c303333756d777643cb09c999409608abb642d9',
            '11113333756d76a643cb09cd45409608abb642d9',6);
Tree.Display(0);
console.log("State Root: " + Tree.Cal_hash());