function CreatorCreate(ID, mappingTable){
    let Transactions = getTransaction();
    for(let i = 0; i < Transactions.length; i++){
        mappingTable.account[Transactions[i].sender].transactions.push(Transactions[i]);
        mappingTable.account[Transactions[i].sender].balance -= Transactions[i].value;
        mappingTable.account[Transactions[i].receiver].transactions.push(Transactions[i]);
        mappingTable.account[Transactions[i].receiver].balance += Transactions[i].value;
    }
    if(!Voter(mappingTable)){
        console.log("Voting failed!");
        return -1;
    }
    return mappingTable;
}

module.exports = CreatorCreate;