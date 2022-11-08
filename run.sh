for i in {3000..3014}
 do
     echo "Starting port $i"
     npm run $i > $i.out 
 done
