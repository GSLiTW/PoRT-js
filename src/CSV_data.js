const fs = require('fs');
/**
 * Generate & Initialize CSV_data Class
 * @class This class is used to manipulate CSV data
 */
function CSV_data() {
  this.data = null;
};
/**
 * Manipulate data from csv files
 * @param  {Number} num
 * @return {string[][]} data derived from csv files
 */
CSV_data.prototype.getData = function(num) {
  if (num == 1 || num == 2 || num == 3) {
    return this.readCSV(num);
  } else console.log('block DNE');
};

CSV_data.prototype.readCSV = (num) =>{
  this.data = fs.readFileSync(`./data/block${num}.csv`)
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array
  return this.data;
};

module.exports = CSV_data;
