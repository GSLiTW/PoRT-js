#!/bin/bash

for i in {3000..3008}
do
    echo "Killing port $i"
    kill $(lsof -t -i:$i)
done

killall /usr/local/bin/node
rm *.out
 
