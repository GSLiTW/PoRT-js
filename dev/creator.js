const mappingTable = require("./mapping_table.js");
const CreatorVerify = require("./creator_verify.js");
const CreatorCreate = require("./creator_create.js");

var newMappingTable;

function Creator(ID){
    if(!CreatorVerify(ID, mappingTable)){
        console.log("CreatorVerify failed!");
        return -1;
    }
    newMappingTable = CreatorCreate(ID, mappingTable);
}

module.exports = newMappingTable;