# PoRT-js
A doubly-linked PoRT Blockchain approach

# Usage
1. Use Node.js version >= v14.
2. run ```npm i``` first.
3. run ```./run.sh``` to start running.
4. run ```./kill.sh``` to stop testing.

# Run some test
**實驗環境**

由於有可能沒有辦法執行以下腳本
```
#!/bin/bash
for i in {3000..3008}
do
    echo "Starting port $i"
    npm run $i > out$i 
done
```

可以另外寫以下腳本來同時開啟3000-3008的port

```
#!/bin/bash
npm run 3000 > out3000 &
npm run 3001 > out3001 &
npm run 3002 > out3002 &
npm run 3003 > out3003 &
npm run 3004 > out3004 &
npm run 3005 > out3005 &
npm run 3006 > out3006 &
npm run 3007 > out3007 &
npm run 3008 > out3008 
```

**實驗操作**

1.在執行腳本後，可以先開啟3000這個port來查看blockchain是否成功建立:
(http://localhost:3000/blockchain)
在成功建立的blockchain裡會存放genesis block(block 0)
![](https://i.imgur.com/IKlXtQi.png)


2.首先我在MPT裡指派了3002這個port來當作C2，以及3004、3006、3008這3個port來當作V2，接著透過(http://localhost:3002/Creator)
讓3002這個port去create block 2，同時3004、3006、3008這3個port也會去verify block 1，接著當block 2 create成功後，3002會把block 2 broadcast出去，每個node在收到block 2後會把block 1(temporary block)上鍊，最後把block 2設為新的temporary block

3.此時可以再透過(http://localhost:3000/blockchain)
來查看目前的區塊鍊，這時候鍊上應該要有2個block(block0、block1)!
[](https://i.imgur.com/LgYxta3.png)

4.接著執行下一輪，下一輪的creator和voter為C3、V3，也就是block 1裡面紀錄的next creator和next voter，而在這裡我把C3設定成port 3001，V3設定成3003、3005、3007，因此現在可以透過(http://localhost:3001/Creator)
讓3001 create block 3，同時3003、3005、3007會verify block 2，接著3001把block 3 broadcast出去後，每個node便會把block 2上鍊並將temporary block設為block 3

5.再執行一次(http://localhost:3000/blockchain)
可以發現目前區塊鍊上確實有3個block了!
[](https://i.imgur.com/qEtTAMU.png)

6.接著再下一輪的C4、V4是block 2裡面紀錄的next creator和next voter，這裡我查表的結果是C4是3149這個port，而V4分別為3141、3139、3022這3個port，但因為我目前電腦無法同時開啟這麼多port，因此我沒有繼續做這一輪。

在每次實驗後，我們會透過執行kill.sh腳本來把所有port關掉。

**實驗環境**

我們在新的版本中處理了Voter掉線的問題，測試方法一開始一樣是透過
```
./run.sh
```
來開啟這些PORT。而在開啟後，我們會透過CMD把3004這個PORT(Voter之一)關掉，並透過和以上一樣的流程來檢查少了一個Voter後是否還能正常運作。
