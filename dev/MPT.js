const Web3 = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY');

function MPT(){
    this.mode = none;
    this.key  = none;
    this.value = none;
    this.next = none;
    this.branch = [ None, None, None, None,
        None, None, None, None,
        None, None, None, None,
        None, None, None, None ]
    this.Update_flag = None
    this.Update_value = None
    this.root = root
}

MPT.prototype.Display() = function() {

    if(this.mode==none)return;
    else if(this.mode==leaf){
        if(len(this.key)%2==0){
            prefix = '20';
        }
        else{
            prefix = '3';
        }
        console.log(">"+"\t"* level + "leaf: (" + prefix +")" + this.key + ", " + this.value);
        return;
    }
    else if(this.mode==extension){
        if(len(this.key)%2==0){
            prefix = '00';
        }
        else{
            prefix = '1';
        }
        console.log(">"+"\t"* level + "extension: (" + prefix +")" + this.key);
        return;
    }
    else if(this.mode==branch){
        console.log(">" + '\t' * level + "branch");
        for(i = 0; i < len(self.branch); i++){
            if(i != None){
                console.log(">" + '\t' * level + "      " + j.toString(16) + ":");
                i.Display(level+1);
                j += 1;
            }
        }
        return;
    }
};
MPT.prototype.Insert() = function() {
    if(this.mode!=none){
        if(key==this.key){
            console.log(">Weird request. User already exist");
        }
    }
    if(this.mode==none){
        this.mode = 'leaf';
        this.key = key;
        this.value = value;
    }
    else if(this.mode=='branch'){
        if(key.length==0){
            this.value = value;
        }
        else{
            ch = 1;//
            if(this.branch[ch] == none){
                this.branch[ch] = MPT();
            }
            this.branch[ch].Insert(key.substring(1,1000),value);
        }

    }
    else if(this.mode=='extension'){
        i = 0;
        while(key[i] == self.key[i]){
            i += 1;
            if(i == this.key.length)
                break;
        }
        if(i == 0){
            this.mode = 'branch';
            if(this.key.length == 1){
                this.branch
            }
        }
    }
    else if(this.mode=='leaf'){

    }

};
MPT.prototype.Search() = function() {

};
MPT.prototype.Update() = function() {

};
MPT.prototype.Cal_back_nibble() = function() {

};
MPT.prototype.Cal_hash() = function(){

};