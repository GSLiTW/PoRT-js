#!/usr/bin/bash
for i in {3000..3157}
do
    echo "Starting port $i"
    npm run $i > tmp
done
rm tmp
