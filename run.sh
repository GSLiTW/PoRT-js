for i in {3000..3009}
 do
     echo "Starting port $i"
     npm run $i > $i.out 
 done
