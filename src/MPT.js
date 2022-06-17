const keccak256 = require('keccak256');
const rlp = require('rlp');
const NodeVal = require('./NodeVal');
/**
 * Constructor of the MPT Class
 * @class Data Structure for Merkle Patricia Trie (MPT)
 * @param  {Boolean} [root=false]
 * @param  {String} [type='account']
 */
function MPT(root = false, type = 'account') {
    this.type = type;
    this.mode = null;
    this.key = null;
    this.value = null;
    this.oldHash = null;
    this.saved=false;
    this.next = null;
    this.branch = [null, null, null, null,
        null, null, null, null,
        null, null, null, null,
        null, null, null, null];
    this.root = root;
};

/**
 * Print current MPT status to terminal
 * @param  {integer} level - specify which level (height) of trie to display
 */
MPT.prototype.Display = function (level) {
    if (level == 0) console.log("**********START PRINTING TRIE**********");
    if (this.mode == null) {
        console.log("Empty Trie")
    } else if (this.mode == 'leaf') {
        if ((this.key.length) % 2 == 0) {
            prefix = '20';
        }
        else {
            prefix = '3';
        }
        console.log(">" + '\t'.repeat(level) + "leaf: (" + prefix + ")" + this.key + ", " + this.value);
    } else if (this.mode == 'extension') {
        if ((this.key.length) % 2 == 0) {
            prefix = '00';
        }
        else {
            prefix = '1';
        }
        console.log(">" + '\t'.repeat(level) + "extension: (" + prefix + ")" + this.key);
        this.next.Display(level + 1);
    } else if (this.mode == 'branch') {
        console.log(">" + '\t'.repeat(level) + "branch");
        var j = 0;
        for (var i in this.branch) {
            if (this.branch[i] != null) {
                console.log(">" + '\t'.repeat(level) + "      " + j.toString(16) + ":");
                this.branch[i].Display(level + 1);
            }
            j += 1;
        }
        if (this.value != null) {
            console.log(">" + 't'.repeat(level) + "value: " + this.value);
        }
    }
    if (level == 0) console.log("**********FINiSH PRINTING TRIE**********");
};

/**
 * Insert new data to MPT
 * @param  {String} key - public key of the inserted wallet
 * @param  {Number} value - initial wallet balance
 * @param  {Number} [tax=0] - initial tax value
 * @param  {integer={0,1,2}} [dbit=0] - initial dirty bit value
 */
MPT.prototype.Insert = function (key, value, tax = 0, dbit = 0) {
    /* FOR DEBUGGING: TAX = 0.1 * VALUE */
    // tax = 0.1 * value;
    /* FOR DEBUGGING*/

    if (this.type == 'account') {
        if (this.mode == 'leaf') {
            if (key == this.key) {
                console.log(this.mode);
                console.log(key);
                console.log(">Weird request. User already exist");
                return null;
            }
        }
        if (this.mode == null) {
            this.mode = 'leaf';
            this.key = key;
            this.value = [value, tax, dbit];
        } else if (this.mode == 'branch') {
            if (key.length == 0) {
                this.value = [value, tax, dbit];
                console.log('inserted check')
            } else {
                this.value = null;
                this.key = null;
                ch = parseInt(key[0], 16);
                if (this.branch[ch] == null) {
                    this.branch[ch] = new MPT();
                }
                this.branch[ch].Insert(key.substr(1), value, tax, dbit);
            }

        } else if (this.mode == 'extension') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == this.key.length)
                    break;
            }
            if (i == 0) {
                this.mode = 'branch';
                this.value = null;
                if (this.key.length == 1) {
                    this.branch[parseInt(key[0], 16)] = new MPT();
                    this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value, tax, dbit);
                    this.branch[parseInt(this.key[0], 16)] = this.next;
                } else {
                    this.branch[parseInt(key[0], 16)] = new MPT();
                    this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value, tax, dbit);
                    var NewNode = new MPT()
                    NewNode.mode = 'extension';
                    NewNode.key = this.key.substr(1);
                    NewNode.next = this.next;
                    this.branch[parseInt(this.key[0], 16)] = NewNode;
                }
            } else if (i == this.key.length) {
                console.log('entering branch');
                console.log(key.substr(i));
                this.next.Insert(key.substr(i), value, tax, dbit);
            } else {
                if (i == (this.key.length - 1)) {
                    var NewNode = new MPT();
                    NewNode.mode = 'branch';
                    NewNode.branch[parseInt(key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value, tax, dbit);
                    NewNode.branch[parseInt(this.key[i], 16)] = this.next;
                    this.key = key.substr(0, i);
                    this.value = null;
                    this.next = NewNode;
                } else {
                    var NewNode = new MPT();
                    NewNode.mode = 'branch';
                    NewNode.branch[parseInt(key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value, tax, dbit);
                    NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(this.key[i], 16)].mode = 'extension';
                    NewNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i + 1);
                    NewNode.branch[parseInt(this.key[i], 16)].next = this.next;
                    this.key = key.substr(0, i);
                    this.value = null;
                    this.next = NewNode;
                }
            }
        }
        else if (this.mode == 'leaf') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == key.length) break;
            }
            if (i == 0) {
                this.mode = 'branch';
                this.branch[parseInt(key[0], 16)] = new MPT();
                this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value, tax, dbit);
                this.branch[parseInt(this.key[i], 16)] = new MPT();
                this.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(1), this.value[0], this.value[1], this.value[2]);
                this.value = null;
            } else {
                this.mode = 'extension';
                var NewNode = new MPT();
                NewNode.mode = 'branch';
                NewNode.branch[parseInt(key[i], 16)] = new MPT();
                NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value, tax, dbit);
                NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
                NewNode.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(i + 1), this.value[0], this.value[1], this.value[2]);
                this.key = key.substr(0, i);
                this.next = NewNode;
                this.value = null;
            }
        }
    } else if (this.type == 'tx') {
        return null;
        // Omitted
    } else if (this.type == 'receipt') {
        if (this.mode != null) {
            if (key == this.key) {
                console.log(">Weird request. User already exist");
                return null;
            }
        }
        if (this.mode == null) {
            this.mode = 'leaf';
            this.key = key;
            this.value = value;
        } else if (this.mode == 'branch') {
            if (key.length == 0) {
                this.value = value;
            } else {
                this.value = null;
                ch = parseInt(key[0], 16);
                if (this.branch[ch] == null) {
                    this.branch[ch] = new MPT();
                }
                this.branch[ch].Insert(key.substr(1), value);
            }

        } else if (this.mode == 'extension') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == this.key.length)
                    break;
            }
            if (i == 0) {
                this.mode = 'branch';
                this.value = null;
                if (this.key.length == 1) {
                    this.branch[parseInt(key[0], 16)] = new MPT();
                    this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value);
                    this.branch[parseInt(this.key[0], 16)] = this.next;
                } else {
                    this.branch[parseInt(key[0], 16)] = new MPT();
                    this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value);
                    var NewNode = new MPT()
                    NewNode.mode = 'extension';
                    NewNode.key = this.key.substr(1);
                    NewNode.next = this.next;
                    this.branch[parseInt(this.key[0], 16)] = NewNode;
                }
            } else if (i == this.key.length) {
                this.next.Insert(key.substr(i), value, tax);
            } else {
                if (i == (this.key.length - 1)) {
                    var NewNode = new MPT();
                    NewNode.mode = 'branch';
                    NewNode.branch[parseInt(key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value);
                    NewNode.branch[parseInt(this.key[i], 16)] = this.next;
                    this.key = key.substr(0, i);
                    this.next = NewNode;
                } else {
                    var NewNode = new MPT();
                    NewNode.mode = 'branch';
                    NewNode.branch[parseInt(key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value);
                    NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
                    NewNode.branch[parseInt(this.key[i], 16)].mode = 'extension';
                    NewNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i + 1);
                    NewNode.branch[parseInt(this.key[i], 16)].next = this.next;
                    this.key = key.substr(0, i);
                    this.next = NewNode;
                }
            }
        }
        else if (this.mode == 'leaf') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == key.length) break;
            }
            if (i == 0) {
                this.mode = 'branch';
                this.branch[parseInt(key[0], 16)] = new MPT();
                this.branch[parseInt(key[0], 16)].Insert(key.substr(1), value);
                this.branch[parseInt(this.key[i], 16)] = new MPT();
                this.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(1), this.value);

            } else {
                this.mode = 'extension';
                var NewNode = new MPT();
                NewNode.mode = 'branch';
                NewNode.branch[parseInt(key[i], 16)] = new MPT();
                NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), value);
                NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
                NewNode.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(i + 1), this.value);
                this.key = key.substr(0, i);
                this.next = NewNode;
            }
        }
    } else {
        console.log("Error: MPT Type Error");
        return;
    }

};

/**
* Search for current status of the input address, or check if a transaction can be successfully processed
* @param  {string} key - public key of the wallet 
*/

MPT.prototype.Search = function (key) {
   if (this.type == 'account') {
       if (this.mode == 'leaf') {
           if (this.key == key) {
                return this.value;
           }
           else {
               return null;
           }
       } else if (this.mode == 'extension') {
           var i = 0;
           while (key[i] == this.key[i]) {
               i++;
               if (i == this.key.length)
                   break;
           }
           if (i == this.key.length) {
               return this.next.Search(key.substr(i));
           } else {
               return null;
           }
       } else if (this.mode == 'branch') {
           if (key.length == 0) {
               console.log('returned this value')
               return this.value;
           }
           if (this.branch[parseInt(key[0], 16)] != null) {
               return this.branch[parseInt(key[0], 16)].Search(key.substr(1));
           } else {
               return null;
           }
       }
   } else if (this.type == 'receipt') {
       return null;
   }
};

/**
* Search for current status of the input address, or check if a transaction can be successfully processed
* @param  {string} key - public key of the wallet 
* @param  {char={'+','-'}} [Update_flag=null] - specify transaction type (send or receive)
* @param  {Number} [Update_value=null] - specify transaction value
*/

MPT.prototype.ModifyValue = function (key, Update_flag = null, Update_value = null) {
    if (this.type == 'account') {
        if (this.mode == 'leaf') {
            if (this.key == key) {
                if (Update_flag == '-') {
                    if (this.value[0] >= Update_value) {
                        this.value[0] -= Update_value * 1.0001;
                        this.value[1] += Update_value * 0.0001;
                        return this.value[0];
                    } else {
                        return null;
                    }
                } else if (Update_flag == '+') {
                    this.value[0] += Update_value;
                    return this.value[0];
                } else {
                    console.log(">An error has happened when modifying value")
                    return null;
                }
            }
        } else if (this.mode == 'extension') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == this.key.length)
                    break;
            }
            if (i == this.key.length) {
                return this.next.ModifyValue(key.substr(i), Update_flag, Update_value);
            } else {
                return null;
            }
        } else if (this.mode == 'branch') {
            if (this.branch[parseInt(key[0], 16)] != null) {
                return this.branch[parseInt(key[0], 16)].ModifyValue(key.substr(1), Update_flag, Update_value);
            } else {
                return null;
            }
        }
    } else if (this.type == 'receipt') {
        return null;
    }
 };

/**
 * Verify the dirty bit of the input address
 * @param  {string} key - public key of the wallet
 * @return {integer={0,1,2}} 1 if input address is Creator; 2 if input address is Voter; 0 otherwise
 */
MPT.prototype.Verify = function (key) {
    if (this.type == 'account') {
        if (this.mode == 'leaf') {
            if (this.key == key) {
                return this.value[2];
            }
            else {
                return -1;
            }
        } else if (this.mode == 'extension') {
            var i = 0;
            while (key[i] == this.key[i]) {
                i++;
                if (i == this.key.length)
                    break;
            }
            if (i == this.key.length) {
                return this.next.Verify(key.substr(i));
            } else {
                return -1;
            }
        } else if (this.mode == 'branch') {
            if (this.branch[parseInt(key[0], 16)] != null) {
                return this.branch[parseInt(key[0], 16)].Verify(key.substr(1));
            } else {
                return -1;
            }
        }
    } else if (this.type == 'receipt') {
        console.log("TypeError: No Verify function in receipt tree!")
        return -2;
    }
};

/**
 * Refund taxes for creator/voter.
 * @param  {String} to - public key/ address to refund
 * @param  {Number} [value=0] - amount to refund
 */
MPT.prototype.RefundTax = function (to, value = 0) {
    var val1 = this.ModifyValue(to, '+', value);
    if (val1 == null) {
        console.log("> An error occurred when updating " + to + "'s value.");
        return;
    }
    this.UpdateTax(to, -value);
}

/**
 * Update balance for wallets after a specific transaction
 * @param  {String} from - sender of the transaction
 * @param  {String} to - receiver of the transaction
 * @param  {Number} [value=0] - amount of the transaction
 */
MPT.prototype.UpdateValue = function (from, to, value = 0) {
    if (this.type == 'account') {
        if (value <= 0) {
            return;
        }

        var val1 = this.ModifyValue(from, '-', value);
        if (val1 == null) {
            console.log("> An error occurred when updating " + from + "'s value.");
            return;
        }

        var val2 = this.ModifyValue(to, '+', value);
        if (val2 == null) {
            console.log("> An error occurred when updating " + to + "'s value.");
            return;
        }

        return;
    } else if (this.type == 'receipt') {
        console.log("Error: A node in receipt tree should not be updated once inserted.");
    }
};

/**
 * Update tax balance for wallets after a specific transaction
 * @param  {String} key - public key/ address of the wallet to update
 * @param  {Number} Update_value - amount of tax to add
 */
MPT.prototype.UpdateTax = function (key, Update_value) {
    if (this.mode == 'leaf') {
        if (this.key == key) {
            if (this.value[1] + Update_value >= 0) {
                this.value[1] += Update_value;
                return this.value[1];
            } else {
                console.log("Error: Updated Tax should not be negative.");
                return -1;
            }
        }
        else {
            return null;
        }
    } else if (this.mode == 'extension') {
        var i = 0;
        while (key[i] == this.key[i]) {
            i++;
            if (i == this.key.length)
                break;
        }
        if (i == this.key.length) {
            return this.next.UpdateTax(key.substr(i), Update_value);
        } else {
            return null;
        }
    } else if (this.mode == 'branch') {
        if (this.branch[parseInt(key[0], 16)] != null) {
            return this.branch[parseInt(key[0], 16)].UpdateTax(key.substr(1), Update_value);
        } else {
            return null;
        }
    }
}

/**
 * Update the dirty bit value to indicate the creator/voter bits
 * @param  {String} key - public key/ address of the wallet to update
 * @param  {Integer={0,1,2}} [dbit=0] - new dirty bit value of the wallet 
 */
MPT.prototype.UpdateDbit = function (key, dbit = 0) {
    if (dbit != 0 && dbit != 1 && dbit != 2) {
        console.error("Error: dbit should be 0, 1 or 2.");
        return null;
    }
    if (this.mode == 'leaf') {
        if (this.key == key) {
            this.value[2] = dbit;
            return 0;
        }
        else {
            return null;
        }
    } else if (this.mode == 'extension') {
        var i = 0;
        while (key[i] == this.key[i]) {
            i++;
            if (i == this.key.length)
                break;
        }
        if (i == this.key.length) {
            return this.next.UpdateDbit(key.substr(i), dbit);
        } else {
            return null;
        }
    } else if (this.mode == 'branch') {
        if (this.branch[parseInt(key[0], 16)] != null) {
            return this.branch[parseInt(key[0], 16)].UpdateDbit(key.substr(1), dbit);
        } else {
            return null;
        }
    }
}

/**
 * Intermediate function to generate merkle root, not designed to be called directly
 */
MPT.prototype.Cal_pack_nibble = function () {
    var element = null;
    if (this.mode == 'leaf') {
        element = 2;
    } else if (this.mode == 'extension') {
        element = 0;
    } else {
        return;
    }

    var odd = this.key.length % 2;
    element |= odd;


    if (odd == 0) {
        return Buffer.from(element.toString() + "0" + this.key, 'hex');
    } else {
        return Buffer.from(element.toString() + this.key, 'hex');
    }
};

/**
 * Generate merkle root of the Merkle Patricia Trie
 * @return {String} merkle root of the Merkle Patricia Trie
 */
MPT.prototype.Cal_hash = function () {
    var Node = [];
    if (this.mode == null) {
        return "Root Not Found Error: Trie is not built yet.";
    } else if (this.mode == 'leaf') {
        Node = [this.Cal_pack_nibble(), Buffer.from(this.value.toString())];
    } else if (this.mode == 'extension') {
        Node = [this.Cal_pack_nibble(), this.next.Cal_hash()];
    } else if (this.mode == 'branch') {
        Node = [];
        for (var i in this.branch) {
            if (this.branch[i] == null) {
                Node.push(Buffer.from(''));
            } else {
                Node.push(this.branch[i].Cal_hash());
            }
        }
        Node.push(Buffer.from(''));
    }


    if (this.root == true) {
        return keccak256(rlp.encode(Node)).toString('hex');
    } else {
        if (rlp.encode(Node).length >= 32) {
            return keccak256(rlp.encode(Node));
        } else {
            return Node;
        }
    }
};

/**
 * Generate old merkle root of the Merkle Patricia Trie
 * @return {String} old merkle root of the Merkle Patricia Trie
 */
 MPT.prototype.Cal_old_hash = function () {
    this.oldHash = this.Cal_hash();
    this.saved=true;
};

/**
 * @param  {String} h - hash (from PoRT)
 * @param  {integer={0,1}} flag - indicate what taxcnt means: 0 for tax count; 1 for key
 * @param  {Number} taxcnt - Ti (from PoRT) if flag==0; Selected Creator's address(key) if flag==1
 */
MPT.prototype.Select = function (h, flag, taxcnt) {

    if (this.mode == 'leaf') {
        if ((h - taxcnt) < this.value[1]) {
            return [1, this.key];
        } else {
            return [0, (taxcnt + this.value[1])];
        }
    } else if (this.mode == 'extension') {
        [flag, taxcnt] = this.next.Select(h, flag, taxcnt);
        if (flag == 1) {
            return [flag, this.key + taxcnt];
        } else {
            return [flag, taxcnt];
        }
    } else if (this.mode == 'branch') {
        if (this.value != null) {
            if ((h - taxcnt) < this.value[1]) {
                return [1, ""];
            } else {
                taxcnt += this.value[1];
            }
        }
        for (var i in this.branch) {
            if (this.branch[i] != null) {
                [flag, t] = this.branch[i].Select(h, flag, taxcnt);
                if (flag == 1) {
                    taxcnt = parseInt(i).toString(16) + t;
                    break;
                } else {
                    taxcnt = t;
                }
            }
        }

        return [flag, taxcnt];
    }
};

/**
 * Calculate the sum of taxes accumulated in every wallet in the MPT
 * @return {Number} the sum of taxes accumulated in the MPT
 */
MPT.prototype.TotalTax = function () {
    if (this.mode == null) {
        return -1;
    } else if (this.mode == 'leaf') {
        return this.value[1];
    } else if (this.mode == 'extension') {
        return this.next.TotalTax();
    } else if (this.mode == 'branch') {
        var taxcnt = 0;
        for (var i in this.branch) {
            if (this.branch[i] != null) {
                taxcnt += this.branch[i].TotalTax();
            }
        }
        if (this.value != null) {
            taxcnt += this.value[1];
        }
        return taxcnt;
    }
}

//modified
/**
 * reset Saved before next round
 */
 MPT.prototype.ResetSaved = function () {
    this.saved=false;
}

module.exports = MPT;
