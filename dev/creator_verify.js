function mappingTableIsValid(mappingTable){
    if(mappingTable.account != null){
        return 1;
    }
    return -1;
}

function CreatorVerify(ID, mappingTable){
    if(!mappingTableIsValid(mappingTable)){
        console.log("Mapping Table is not valid!");
        return -1;
    }
    for(var i = 0; i < mappingTable.numOfAddress; i++){
        if(mappingTable.account[i].isCreator == 1 && mappingTable.account[i].address == ID){
            return 1;
        }
    }
    console.log("Creator error!");
    return -1;
}

module.exports = CreatorVerify;