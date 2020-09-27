const crypto =require('crypto');
const Decimal = require('decimal.js');
const Shamir=require("./shamir.js");
//const sha256 = require("sha256");
//const Str = require('@supercharge/strings');
const secureRandom = require('secure-random');
//const web3=require('Web3');
const fs = require('fs') ;
const EthCrypto = require('eth-crypto');
//const base64 =require('base64-js');

//const ecdsa = require('ecdsa')
const elliptic = require('elliptic');
//const pemtool =require('pemtools');
//var CoinKey = require('coinkey')
//const { random } = require('@supercharge/strings');
//const { timeStamp, Console } = require('console');
const { constants, Buffer } = require('buffer');
//const { parse } = require('path');
//const { type } = require('os');
//const { start } = require('repl');
var M = 3;
var N = 4;
var a = 2;//delete
var b = 7;//delete
var I ="I'm Eric. I've just lost my device,so I need to recovery my Private Key.\nPlease follow the instruction bellow:\n1. Please verify the identity of the owner by signature.\n2. Contact me by my email:XXX@gmail.com or phone:09xx-xxx-xxx.\n3. Send back the secret you just decrypted.\n4. Thank you!"

function backup(){
    this.TK_SK = null;
    this.PK_Shares =[];
    this.backupfile=null;
    this.pka=[];
}

backup.prototype.SelectTrustee =function(){

}

backup.prototype.init =async function(){
    this.generatePKA();
    var TK =this.GenerateTK(64); //TK is a hex string ,len =112;
    console.log("TK :"+ TK);
    console.log('-------------------------------------------');
  //  console.log(typeof TK);
    this.TK_SK =this.GenerateTK_SK(TK);
    console.log("TK@SK :"+ this.TK_SK);
    console.log('-------------------------------------------');
   // console.log('')
    this.PK_Shares=await this.GeneratePk_Share(TK).then(function(r){
        //outputfile(this.TK_SK,this.PK_Shares);
        console.log("Finsish generating pk@share");
        console.log('-------------------------------------------');
        
       // console.log(r);
       return r;
    });
   // console.log("PK@Share :"+this.PK_Shares);
    this.outputfile(this.TK_SK,this.PK_Shares);
    console.log("output file finish.");
}

backup.prototype.GenerateTK_SK =function(TK){
    console.log("generating TK@SK ...");
    var iv = "spamshog";
    var key = TK;
    var Sk = "My private key";
    var cipher = crypto.createCipheriv('bf-cbc', key, iv);
   // console.log(cipher);
   // decipher.setAutoPadding(false);
    var encrypted = cipher.update(Sk, 'utf-8', "hex");
    encrypted += cipher.final('hex');
  //  console.log(encrypted);
    // var decipher = crypto.createDecipheriv('bf-cbc', key, iv);
    // var decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    // decrypted += decipher.final('utf-8');
    // console.log(decrypted);
    return encrypted;
}

  backup.prototype.GeneratePk_Share =async function(TK){// y= a*x^2 + b*x + c , c = TK
    console.log("Generating PK@share ...");
    console.log();
    console.log("Start generating secret shares (tki, i=1~4)");
    var sol = [];
    const example = "0x"+TK;
    const prime3217 = Decimal('2').pow(3217).sub(1);
    const shares =Shamir.split(example,N,M,prime3217);
    console.log('secret shares =');
    console.log(shares);
    console.log('-------------------------------------------');
    // const secret = Shamir.combine([shares[0], shares[1], shares[2]], prime3217).toHex();
    // console.log(secret);
    var ds =this.Generate_DS(shares);
    console.log('-------------------------------------------');
    // console.log("ds :");
    // console.log(ds);
    console.log('Use (tki, dsi, I) to create PK@Shares ....');
    for(i=0;i<N;i++){
        let share = await this.CreateShare(shares[i],ds[i],i).then(function(result){
           // console.log(result);
            return result;//dont need to return??
            //console.log(typeof result);
            //this.PK_Shares.push(result);
        });
        sol.push(share);
    }
   // console.log('---------------PK@Shares-------------------');
   console.log();
    console.log(sol);
   // console.log('-------------------------------------------');
    return sol;
}
backup.prototype.Generate_DS=function(share){
    console.log("Start generating Signature (dsi, i=1~4) ...");
    var myprivatekey =this.pka[0][0];//temp
    var mypublickey =this.pka[0][1];
 //   console.log(tk);
    var ds =[];
    for(i=0;i<N;i++){
        
        var tki =share[i]['x']+','+share[i]['y'];
        var hash = 0, chr;
        var str =tki+','+I;
      //  console.log(str);
        const ecdsa = new elliptic.ec('secp256k1');

        var hash = crypto.createHash('sha256').update(str).digest();
        var buf2 =Buffer.from(myprivatekey,'hex');
        var buf3 =Buffer.from(mypublickey,'hex');
        var signature =ecdsa.sign(hash,buf2,'hex',{canonical: true});
        ds[i]=signature;
        console.log("signature=",signature);
        console.log('-------------------------------------------');
       // console.log(buf3);
       // console.log(ecdsa.verify(hash,signature,buf3,'hex'));

    }
    console.log('finsish generating ds.');
    return ds;
}

backup.prototype.GenerateTK=function(length){
    console.log("generating TK...");
    var ret = "";
    while (ret.length < length) {
      ret += Math.random().toString(16).substring(2);
    }
    // console.log('--------------------TK---------------------');
    // console.log(ret);
    // console.log('-------------------------------------------');
    return ret;
}

backup.prototype.CreateShare=async function(tki,dsi,index){
    var obj =new Object();
    obj={
        'tk': tki,
        'ds': dsi,
        'Instruction': I
    }
  //  console.log(obj);
    var str = JSON.stringify(obj);
  //  console.log(str);
    var encrypted =  await EthCrypto.encryptWithPublicKey(
              this.pka[index+1][1],
              str
          );
    return encrypted;
}


backup.prototype.generatePKA=function() {
    console.log("generating pka...");
    for(i=0;i<10;i++){
        privateKey = secureRandom.randomBuffer(32);
        const ecdsa = new elliptic.ec('secp256k1');
        const keys = ecdsa.keyFromPrivate(privateKey);
        privateKey =keys.getPrivate('hex');
        publicKey = keys.getPublic('hex')
        //console.log("Private Key: ", keys);
        //console.log("Public Key: ", publicKey);
        this.pka.push([privateKey,publicKey]);
    }   
    console.log('--------------------PKA--------------------');    
    console.log(this.pka);
    console.log('-------------------------------------------');
}

  function signaturetest(){
    k =secureRandom.randomBuffer(32);
    const ecdsa =new elliptic.ec('secp256k1');
    const key =ecdsa.keyFromPrivate(k);
    privateKey=key.getPrivate();
    publicKey =key.getPublic();

    text='secret';
    var hash =crypto.createHash('sha256').update(text).digest();
    var signature =ecdsa.sign(hash,privateKey,'hex',{canonical:true});
    var valid = ecdsa.verify(hash,signature,publicKey,'hex');
    console.log('signature:',valid);
  }

  async function publicencrpttest(p){
        const secretMessage = 'My name is Satoshi Buterin';
        const encrypted =  await EthCrypto.encryptWithPublicKey(
            this.pka[0][1],
            secretMessage
        );
        return encrypted;
  }

  async function privatdecrypttest(p,a){
      const decrypted =  await EthCrypto.decryptWithPrivateKey(
            p,
            a
        );
        const secretMessage = 'My name is Satoshi Buterin';
        if(decrypted === secretMessage) console.log('success');
        console.log(decrypted);
  }

backup.prototype.outputfile=async function(tksk,pkshare){
   // pkshare=JSON.stringify(pkshare);
   console.log('Start writing backup file ...');
    let data = {
        TK_SK:tksk,
        PK_Shares:pkshare 
    }
    data=JSON.stringify(data)
    fs.writeFileSync('backup.txt', data);
}


backup.prototype.inputfile =function(){
    console.log("Start load backup file ...");
    var data = fs.readFileSync("backup.txt",'utf-8');
  //  console.log(data);
    this.backupfile =data;
    return data;
}

//---------------------------------------------trustee 1~3--------------------------------------------------------

backup.prototype.recovery=async function(trusteeIndex,pksh){
   // console.log("-------------------0---------------------");
    var DecriptedShare;
    var find =false;
    console.log('Trustee ',trusteeIndex," :");
    for(j=0;j<N;j++){
     //  console.log('-----------------------1-----------------------');
       try{
            console.log('Decrypt with PrivateKey ...'); 
            const decrypt =await EthCrypto.decryptWithPrivateKey(this.pka[trusteeIndex][0],pksh[j]); 
            DecriptedShare=decrypt;
           // console.log(decrypt);
            DecriptedShare=JSON.parse(DecriptedShare.toString());
            console.log(DecriptedShare);
            console.log();
            console.log(DecriptedShare['Instruction']);
            console.log();
            find=true;
            //console.log('true!');
          //  console.log(DecriptedShare);
            if(this.verification(DecriptedShare['tk'],DecriptedShare['ds'],DecriptedShare['Instruction'])){
                console.log('verified success !');
                console.log();
               // console.log( DecriptedShare['tk'])
                return DecriptedShare['tk'];
            }else{
                console.log('verified fail ..');
                console.log();
                return null;
            }
       }catch(err){
           console.log('You cant decrypt this share QQ');
          // console.log(err);

       }
      //  console.log('---------------------2--------------------------');
      console.log('continue ...');
    }

    if(!find){
        console.log('cant find my share...');
        console.log();
        return null;
    }
 
}

backup.prototype.verification=function(tk,ds,I){
    console.log('verify with signature ...');
    const ecdsa = new elliptic.ec('secp256k1');
    const tki =tk['x']+','+tk['y'];
    const str =tki+','+I;
    var hash = crypto.createHash('sha256').update(str).digest();
    var OwnerPublicKey =Buffer.from(this.pka[0][1],'hex');
    return ecdsa.verify(hash,ds,OwnerPublicKey,'hex');
}

//----------------------------------------test---------------------------------------------
//signaturetest();
// var temp;
// generatePKA();
// publicencrpttest(PKA[0][1]).then(async function(r){
//     const decrypted =  await EthCrypto.decryptWithPrivateKey(
//         p,
//         a
//     );
//     const secretMessage = 'My name is Satoshi Buterin';
//     if(decrypted === secretMessage) console.log('success');
//     console.log(decrypted);
// });
//privatdecrypttest("0x"+PKA[0][0],a);

// ~async function(){
//     Backup =new backup();
//     await Backup.init();
//     console.log('*******************************************');
//     console.log('*******************************************');
//     console.log('*******************************************');
//     console.log("recovery start");
//     var data =Backup.inputfile();
//     this.backupfile = data;
//     //console.log(this.backupfile);
//     const file =JSON.parse(this.backupfile);


//     console.log(file);
//     console.log('-------------------------------------------');
//     const tksk =file['TK_SK'];
//     const pkshar=file['PK_Shares']
//     //console.log(pkshar);
//     var RecoveryShare=[];

//     for(i=1;i<8;i++){
//             RecoveryShare[i-1]=await Backup.recovery(i,pkshar);
//            // console.log(RecoveryShare[i-1]);
//     }
//     console.log('-----------recovery-share------------------');
//     console.log(RecoveryShare);
//     console.log();
//     const prime3217 = Decimal('2').pow(3217).sub(1);
//     const secret = Shamir.combine([RecoveryShare[0],RecoveryShare[1],RecoveryShare[2]], prime3217).toHex();
//     var KEY=secret.substring(2,);
//     console.log("Combine all shares to TK");
//   //  console.log('-----------------My-TK---------------------');
//     console.log("TK: ",KEY);
//     console.log('-------------------------------------------');
//     console.log('Decrypt TK@SK by TK');
//     var iv = "spamshog";
//     var decipher = crypto.createDecipheriv('bf-cbc', KEY, iv);
//     var decrypted = decipher.update(tksk, 'hex', 'utf-8');
//     decrypted += decipher.final('utf-8');
//     console.log("SK: ",decrypted);
// }();
  

module.exports = backup;

