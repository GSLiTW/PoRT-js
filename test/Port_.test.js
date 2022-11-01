//propose :
// know the relationship of the ports
//who is creator and voter then who makes which block 

const process = require("process");
const mockArgv = require("mock-argv");
const port = [3000];
port.forEach((port) => {   
    mockArgv([port], async () => {
        const app = require("../src/network");
        console.log(process.argv);
        });
        
    test("#PORT_test: func", () => {
        // app.listen(port, () => console.log("port running in " + { port }));
        });

});
