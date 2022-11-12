//propose :
// know the relationship of the ports
//who is creator and voter then who makes which block 
const mockArgv = require("mock-argv");
let app;
let port=[];
for(i=3000;i<3014;i++)
    port.push(i);
port.forEach((port) => {   
    mockArgv([port], () => {
         app = require("../src/network");
        }).then(()=>{
            app.listen(port, function(){
                console.log("port"+{port})
        });
    });
});

