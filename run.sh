#!/bin/bash
for i in {3000..3001}
do
    echo "Starting port $i"
    npm run $i > $i.out 
done
