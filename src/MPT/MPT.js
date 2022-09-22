/* eslint-disable max-len */
const keccak256 = require('keccak256');
const rlp = require('rlp');
const NodeVal = require('../NodeVal');
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
MPT.prototype.Display = function(level) {
  if (level == 0) console.log('**********START PRINTING TRIE**********');
  if (this.mode == null) {
    console.log('Empty Trie');
  } else if (this.mode == 'leaf') {
    if ((this.key.length) % 2 == 0) {
      prefix = '20';
    } else {
      prefix = '3';
    }
    console.log('>' + '\t'.repeat(level) + 'leaf: (' + prefix + ')' + this.key + ', ' + this.value);
  } else if (this.mode == 'extension') {
    if ((this.key.length) % 2 == 0) {
      prefix = '00';
    } else {
      prefix = '1';
    }
    console.log('>' + '\t'.repeat(level) + 'extension: (' + prefix + ')' + this.key);
    this.next.Display(level + 1);
  } else if (this.mode == 'branch') {
    console.log('>' + '\t'.repeat(level) + 'branch');
    let j = 0;
    for (const i in this.branch) {
      if (this.branch[i] != null) {
        console.log('>' + '\t'.repeat(level) + '      ' + j.toString(16) + ':');
        this.branch[i].Display(level + 1);
      }
      j += 1;
    }
    if (this.value != null) {
      console.log('>' + 't'.repeat(level) + 'value: ' + this.value);
    }
  }
  if (level == 0) console.log('**********FINiSH PRINTING TRIE**********');
};

/**
 * Insert new data to MPT
 * @param  {String} key - public key of the inserted wallet
 * @param  {Number} balance - initial wallet balance
 * @param  {Number} [tax=0] - initial tax value
 * @param  {String={[0,0],[1,1],[1,2],[2,1],[2,2]}} [dbit=[0, 0]] - initial dirty bit value
 */
MPT.prototype.Insert = function(key, balance, tax = 0, dbit = [0, 0]) {
  /* FOR DEBUGGING: TAX = 0.1 * VALUE */
  // tax = 0.1 * value;
  /* FOR DEBUGGING*/

  if (this.type == 'account') {
    if (this.mode == 'leaf') {
      if (key == this.key) {
        console.log('>Weird request. User already exist');
        return null;
      }
    }
    if (this.mode == null) {
      this.mode = 'leaf';
      this.key = key;
      this.value = new NodeVal(balance, tax, dbit);
    } else if (this.mode == 'branch') {
      if (key.length == 0) {
        this.value = new NodeVal(balance, tax, dbit);
      } else {
        this.value = null;
        this.key = null;
        ch = parseInt(key[0], 16);
        if (this.branch[ch] == null) {
          this.branch[ch] = new MPT();
        }
        this.branch[ch].Insert(key.substr(1), balance, tax, dbit);
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
      }
      if (i == 0) {
        this.mode = 'branch';
        this.value = null;
        if (this.key.length == 1) {
          this.branch[parseInt(key[0], 16)] = new MPT();
          this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
          this.branch[parseInt(this.key[0], 16)] = this.next;
        } else {
          this.branch[parseInt(key[0], 16)] = new MPT();
          this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
          const NewNode = new MPT();
          NewNode.mode = 'extension';
          NewNode.key = this.key.substr(1);
          NewNode.next = this.next;
          this.branch[parseInt(this.key[0], 16)] = NewNode;
        }
      } else if (i == this.key.length) {
        this.next.Insert(key.substr(i), balance, tax, dbit);
      } else {
        if (i == (this.key.length - 1)) {
          const NewNode = new MPT();
          NewNode.mode = 'branch';
          NewNode.branch[parseInt(key[i], 16)] = new MPT();
          NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
          NewNode.branch[parseInt(this.key[i], 16)] = this.next;
          this.key = key.substr(0, i);
          this.value = null;
          this.next = NewNode;
        } else {
          const NewNode = new MPT();
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
        }
      }
    } else if (this.mode == 'leaf') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == key.length) break;
      }
      if (i == 0) {
        this.mode = 'branch';
        this.branch[parseInt(key[0], 16)] = new MPT();
        this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance, tax, dbit);
        this.branch[parseInt(this.key[i], 16)] = new MPT();
        this.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(1), this.value.Balance(), this.value.Tax(), this.value.Dbit());
        this.value = null;
      } else {
        this.mode = 'extension';
        const NewNode = new MPT();
        NewNode.mode = 'branch';
        NewNode.branch[parseInt(key[i], 16)] = new MPT();
        NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance, tax, dbit);
        NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
        NewNode.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(i + 1), this.value.Balance(), this.value.Tax(), this.value.Dbit());
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
        console.log('>Weird request. User already exist');
        return null;
      }
    }
    if (this.mode == null) {
      this.mode = 'leaf';
      this.key = key;
      this.value = balance;
    } else if (this.mode == 'branch') {
      if (key.length == 0) {
        this.value = balance;
      } else {
        this.value = null;
        ch = parseInt(key[0], 16);
        if (this.branch[ch] == null) {
          this.branch[ch] = new MPT();
        }
        this.branch[ch].Insert(key.substr(1), balance);
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
      }
      if (i == 0) {
        this.mode = 'branch';
        this.value = null;
        if (this.key.length == 1) {
          this.branch[parseInt(key[0], 16)] = new MPT();
          this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance);
          this.branch[parseInt(this.key[0], 16)] = this.next;
        } else {
          this.branch[parseInt(key[0], 16)] = new MPT();
          this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance);
          const NewNode = new MPT();
          NewNode.mode = 'extension';
          NewNode.key = this.key.substr(1);
          NewNode.next = this.next;
          this.branch[parseInt(this.key[0], 16)] = NewNode;
        }
      } else if (i == this.key.length) {
        this.next.Insert(key.substr(i), balance, tax);
      } else {
        if (i == (this.key.length - 1)) {
          const NewNode = new MPT();
          NewNode.mode = 'branch';
          NewNode.branch[parseInt(key[i], 16)] = new MPT();
          NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance);
          NewNode.branch[parseInt(this.key[i], 16)] = this.next;
          this.key = key.substr(0, i);
          this.next = NewNode;
        } else {
          const NewNode = new MPT();
          NewNode.mode = 'branch';
          NewNode.branch[parseInt(key[i], 16)] = new MPT();
          NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance);
          NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
          NewNode.branch[parseInt(this.key[i], 16)].mode = 'extension';
          NewNode.branch[parseInt(this.key[i], 16)].key = this.key.substr(i + 1);
          NewNode.branch[parseInt(this.key[i], 16)].next = this.next;
          this.key = key.substr(0, i);
          this.next = NewNode;
        }
      }
    } else if (this.mode == 'leaf') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == key.length) break;
      }
      if (i == 0) {
        this.mode = 'branch';
        this.branch[parseInt(key[0], 16)] = new MPT();
        this.branch[parseInt(key[0], 16)].Insert(key.substr(1), balance);
        this.branch[parseInt(this.key[i], 16)] = new MPT();
        this.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(1), this.balance);
      } else {
        this.mode = 'extension';
        const NewNode = new MPT();
        NewNode.mode = 'branch';
        NewNode.branch[parseInt(key[i], 16)] = new MPT();
        NewNode.branch[parseInt(key[i], 16)].Insert(key.substr(i + 1), balance);
        NewNode.branch[parseInt(this.key[i], 16)] = new MPT();
        NewNode.branch[parseInt(this.key[i], 16)].Insert(this.key.substr(i + 1), this.balance);
        this.key = key.substr(0, i);
        this.next = NewNode;
      }
    }
  } else {
    console.log('Error: MPT Type Error');
    return;
  }
};

/**
* Check if a node with input address (key) exist
* @param  {string} key - public key of the wallet
*/
MPT.prototype.KeyExist = function(key) {
  if (this.type == 'account') {
    if (this.mode == 'leaf') {
      if (this.key == key) {
        return true;
      } else {
        return false;
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
      }
      if (i == this.key.length) {
        return this.next.KeyExist(key.substr(i));
      } else {
        return false;
      }
    } else if (this.mode == 'branch') {
      if (key.length == 0) {
        return true;
      }
      if (this.branch[parseInt(key[0], 16)] != null) {
        return this.branch[parseInt(key[0], 16)].KeyExist(key.substr(1));
      } else {
        return false;
      }
    }
  } else if (this.type == 'receipt') {
    return null;
  }
};


/**
* Search for current status of the input address, or check if a transaction can be successfully processed
* @param  {string} key - public key of the wallet
*/

MPT.prototype.Search = function(key) {
  if (this.type == 'account') {
    if (this.mode == 'leaf') {
      if (this.key == key) {
        return this.value;
      } else {
        return null;
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
      }
      if (i == this.key.length) {
        return this.next.Search(key.substr(i));
      } else {
        return null;
      }
    } else if (this.mode == 'branch') {
      if (key.length == 0) {
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

MPT.prototype.ModifyValue = function(key, Update_flag = null, Update_value = null) {
  if (this.type == 'account') {
    if (this.mode == 'leaf') {
      if (this.key == key) {
        if (Update_flag == '-') {
          if (this.value.balance >= Update_value) {
            tx_tax = (Update_value * 0.0001).toFixed(0)
            this.value.balance = this.value.balance - Update_value - tx_tax;
            this.value.tax += tx_tax;
            return this.value.balance;
          } else {
            return null;
          }
        } else if (Update_flag == '+') {
          this.value.balance += Update_value;
          return this.value.balance;
        } else {
          console.log('>An error has happened when modifying value');
          return null;
        }
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
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
MPT.prototype.Verify = function(key) {
  if (this.type == 'account') {
    if (this.mode == 'leaf') {
      if (this.key == key) {
        return this.value.DirtyBit;
      } else {
        return -1;
      }
    } else if (this.mode == 'extension') {
      let i = 0;
      while (key[i] == this.key[i]) {
        i++;
        if (i == this.key.length) {
          break;
        }
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
    console.log('TypeError: No Verify function in receipt tree!');
    return -2;
  }
};

/**
 * Refund taxes for creator/voter.
 * @param  {String} to - public key/ address to refund
 * @param  {Number} [value=0] - amount to refund
 * @param  {Boolean} forced - force refund if destination does not originally exist
 */
MPT.prototype.RefundTax = function(to, refund = 0, forced = false) {
  // check refund value > 0
  if (refund < 0) {
    console.log('> Warning, refunding negative tax');
  }
  // check destination exist
  if (this.Search(to) == null) {
    console.log('> Refund destination does not exist');
    if (forced) {
      this.Insert(to, refund);
      console.log('> Inserted new node with starting balance = ' + refund);
      return 0;
    }
    return null;
  }
  // check enough tax to deduct
  if (refund > this.Search(to).tax) {
    console.log('> Not enough tax to deduct from ' + to);
    return null;
  }
  const val1 = this.ModifyValue(to, '+', refund);
  if (val1 == null) {
    console.log('> An error occurred when updating ' + to + '\'s value.');
    return null;
  }
  if (this.UpdateTax(to, -refund) == null) {
    console.log('> An error happened in UpdatedTax of RefundTax');
    return null;
  }
  return 0;
};

/**
 * Update balance for wallets after a specific transaction
 * @param  {String} from - sender of the transaction
 * @param  {String} to - receiver of the transaction
 * @param  {Number} [value=0] - amount of the transaction
 */
MPT.prototype.UpdateValue = function(from, to, value = 0) {
  if (this.type == 'account') {
    if (value <= 0) {
      console.log('> UpdateValue with invalid value input');
      return null;
    }
    if (this.Search(from) == null) {
      console.log('> Error, UpdateValue with inexisted source address');
      return null;
    }
    if (this.Search(to) == null) {
      console.log('> Warning, destination address does not exist, now created');
      this.Insert(to, 0);
    }

    const val1 = this.ModifyValue(from, '-', value);
    if (val1 == null) {
      console.log('> An error occurred when updating ' + from + '\'s value.');
      return null;
    }

    const val2 = this.ModifyValue(to, '+', value);
    if (val2 == null) {
      console.log('> An error occurred when updating ' + to + '\'s value.');
      this.ModifyValue(from, '+', value);
      return null;
    }

    return 0;
  } else if (this.type == 'receipt') {
    console.log('Error: A node in receipt tree should not be updated once inserted.');
    return null;
  }
};

/**
 * Update tax balance for wallets after a specific transaction
 * @param  {String} key - public key/ address of the wallet to update
 * @param  {Number} Update_value - amount of tax to add
 */
MPT.prototype.UpdateTax = function(key, Update_value) {
  if (this.mode == 'leaf') {
    if (this.key == key) {
      if (this.value.tax + Update_value >= 0) {
        this.value.tax += Update_value;
        return this.value.tax;
      } else {
        console.log('Error: Updated Tax should not be negative.');
        return -1;
      }
    } else {
      return null;
    }
  } else if (this.mode == 'extension') {
    let i = 0;
    while (key[i] == this.key[i]) {
      i++;
      if (i == this.key.length) {
        break;
      }
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
};

/**
 * Update the dirty bit value to indicate the creator/voter bits
 * @param  {String} key - public key/ address of the wallet to update
 * @param  {String={[0,0],[1,1],[1,2],[2,1],[2,2]}} [dbit=[0, 0]] - new dirty bit value of the wallet
 */
MPT.prototype.UpdateDbit = function(key, dbit = [0, 0]) {
  if ( !((dbit[0]===0 && dbit[1]===0) || (dbit[0]===1 && dbit[1]===1) || (dbit[0]===1 && dbit[1]===2) || (dbit[0]===2 && dbit[1]===1) || (dbit[0]===2 && dbit[1]===2)) ) {
    console.error('Error: fail to update dbit: '+key+' ' + dbit);
    return null;
  }
  if (this.mode == 'leaf') {
    if (this.key == key) {
      this.value.DirtyBit = dbit;
      return 0;
    } else {
      return null;
    }
  } else if (this.mode == 'extension') {
    let i = 0;
    while (key[i] == this.key[i]) {
      i++;
      if (i == this.key.length) {
        break;
      }
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
};

/**
 * Intermediate function to generate merkle root, not designed to be called directly
 */
MPT.prototype.Cal_pack_nibble = function() {
  let element = null;
  if (this.mode == 'leaf') {
    element = 2;
  } else if (this.mode == 'extension') {
    element = 0;
  } else {
    return;
  }

  const odd = this.key.length % 2;
  element |= odd;


  if (odd == 0) {
    return Buffer.from(element.toString() + '0' + this.key, 'hex');
  } else {
    return Buffer.from(element.toString() + this.key, 'hex');
  }
};

/**
 * Generate merkle root of the Merkle Patricia Trie
 * @return {String} merkle root of the Merkle Patricia Trie
 */
MPT.prototype.Cal_hash = function() {
  let Node = [];
  if (this.mode == null) {
    return 'Root Not Found Error: Trie is not built yet.';
  } else if (this.mode == 'leaf') {
    Node = [this.Cal_pack_nibble(), Buffer.from(this.value.toString())];
  } else if (this.mode == 'extension') {
    Node = [this.Cal_pack_nibble(), this.next.Cal_hash()];
  } else if (this.mode == 'branch') {
    Node = [];
    for (const i in this.branch) {
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
MPT.prototype.Cal_old_hash = function() {
  this.oldHash = this.Cal_hash();
  this.saved=true;
};

/**
 * @param  {String} h - hash (from PoRT)
 * @param  {integer={0,1}} flag - indicate what taxcnt means: 0 for tax count; 1 for key
 * @param  {Number} taxcnt - Ti (from PoRT) if flag==0; Selected Creator's address(key) if flag==1
 */
MPT.prototype.Select = function(h, flag, taxcnt) {
  if (this.mode == 'leaf') {
    if ((h - taxcnt) < this.value.tax) {
      return [1, this.key];
    } else {
      return [0, (taxcnt + this.value.tax)];
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
      if ((h - taxcnt) < this.value.tax) {
        return [1, ''];
      } else {
        taxcnt += this.value.tax;
      }
    }
    for (const i in this.branch) {
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
MPT.prototype.TotalTax = function() {
  if (this.mode == null) {
    return -1;
  } else if (this.mode == 'leaf') {
    return this.value.tax;
  } else if (this.mode == 'extension') {
    return this.next.TotalTax();
  } else if (this.mode == 'branch') {
    let taxcnt = 0;
    for (const i in this.branch) {
      if (this.branch[i] != null) {
        taxcnt += this.branch[i].TotalTax();
      }
    }
    if (this.value != null) {
      taxcnt += this.value.tax;
    }
    return taxcnt;
  }
};

// modified
/**
 * reset Saved before next round
 */
MPT.prototype.ResetSaved = function() {
  this.saved=false;
};

module.exports = MPT;
