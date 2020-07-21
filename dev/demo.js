const PendingTx = require('./pending_transaction_pool.js');
const MPT = require('./mapping_table.js');
const _Creator = require('./creator.js');
const _Voter = require('./voter.js');


GlobalMPT = new MPT();
GlobalMPT.initialize();
GlobalMPT.createJSONFile(1);
PendingTxPool = new PendingTx();

for(var blockidx = 2; blockidx <= 3; blockidx++) {
    PendingTxPool.create(blockidx);

    for(var i = 0; i < GlobalMPT.numOfAddress; i++){
        GlobalMPT.account[i].creator_bit = 0;
        GlobalMPT.account[i].voter_bit = 0;
    }

    CreatorIdx = Math.floor(Math.random() * Math.floor(GlobalMPT.numOfAddress));
    // console.log(Math.floor(Math.random() * Math.floor(GlobalMPT.numOfAddress)))

    CreatorAddr = GlobalMPT.account[CreatorIdx].address;
    GlobalMPT.account[CreatorIdx].creator_bit = 1;

    VoterIdx = [];
    VoterAddr = [];

    for(var i = 0; i < 3; i++){
        while(1){
            var index = Math.floor(Math.random() * Math.floor(GlobalMPT.numOfAddress));
            if(i == 0){
                if(CreatorIdx != index){
                    VoterIdx.push(index);
                    VoterAddr.push(GlobalMPT.account[index].address);
                    GlobalMPT.account[index].voter_bit = 1;
                    break;
                }
            }
            else if(i == 1){
                if(CreatorIdx != index && VoterIdx[i-1] != index){
                    VoterIdx.push(index);
                    VoterAddr.push(GlobalMPT.account[index].address);
                    GlobalMPT.account[index].voter_bit = 1;
                    break;
                }
            }
            else if(i == 2){
                if(CreatorIdx != index && VoterIdx[i-1] != index && VoterIdx[i-2] != index){
                    VoterIdx.push(index);
                    VoterAddr.push(GlobalMPT.account[index].address);
                    GlobalMPT.account[index].voter_bit = 1;
                    break;
                }
            }
        }
    }

    Creator = new _Creator(GlobalMPT, PendingTxPool);
    if(Creator.CreatorVerify(CreatorAddr, GlobalMPT) == 1) {
        CreatorMPT = Creator.CreatorCreate();
    } else {
        console.log("Creator Error\n");
    }

    // console.log(VoterAddr)

    Voted = true;
    for(var i = 0; i < VoterAddr.length; i++) {
        Voter = new _Voter(VoterAddr[i],GlobalMPT,CreatorMPT,PendingTxPool);

        if(Voter.IsVoter == 1) {
            Voted = Voter.Vote();
            if(Voted == false) {
                break;
            }
        } else {
            Voted = false;
            break;
        }
    }

    if(Voted == false) {
        console.log("Vote failed\n");
    } else {
        GlobalMPT = Creator.CreatorCalculate();
    }

    //console.log("Finished :)\n");
    GlobalMPT.createJSONFile(blockidx);
}