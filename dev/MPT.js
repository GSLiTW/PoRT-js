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
        console.log(">" + '\t' * level + "branch")
        for(i = 0; i < len(self.branch); i++){
            if(i != None){
                print(">" + '\t' * level + "      " + hex(j)[2:] + ":");
                i.Display(level+1);
                j += 1;
            }
        }
        return;
    }
};
MPT.prototype.Insert() = function() {

};
MPT.prototype.Search() = function() {

};
MPT.prototype.Update() = function() {

};
MPT.prototype.Cal_back_nibble() = function() {

};
MPT.prototype.Cal_hash() = function(){

};