#!/bin/bash
for i in {3000..3008}
do
    echo "Starting port $i"
    npm run $i > out$i 
done
