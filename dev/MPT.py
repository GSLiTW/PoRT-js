import hashlib
import sha3 
import rlp
import binascii

def SHA_3(Str):
    return sha3.keccak_256(Str.encode()).hexdigest()
'''

k = sha3.keccak_256()
k.update('age')
print k.hexdigest()
'''

class MPT:
    def __init__(self,root=False):
        self.mode = None
        self.key = None
        self.value = None
        self.next = None
        self.branch = [ None, None, None, None,
                        None, None, None, None,
                        None, None, None, None,
                        None, None, None, None ]
        self.Update_flag = None
        self.Update_value = None
        self.root = root
        
    def Display(self,level):
        if self.mode == None :
            return
        #print('\t' * level + self.mode)
        if self.mode == 'leaf' :
            prefix = '20' if len(self.key)%2==0 else '3'
            print(">" + '\t' * level + "leaf: (" + prefix +")" + self.key + ", " + self.value)
            return
        elif self.mode == 'extension' :
            prefix = '00' if len(self.key)%2==0 else '1'
            print(">" + '\t' * level + "extension: (" + prefix + ")" + self.key)
            self.next.Display(level+1)
        elif self.mode == 'branch' :
            print(">" + '\t' * level + "branch")
            j = 0
            for i in self.branch :
                if i != None :
                    print(">" + '\t' * level + "      " + hex(j)[2:] + ":")
                    i.Display(level+1)
                j += 1
    
    def Insert(self,key,value):
        if self.mode != None :
            if key == self.key :
                print(">Weird request. User already exist.")
                return


        if self.mode == None :
            self.mode = 'leaf'
            self.key = key
            self.value = value

        elif self.mode == 'branch' :
            if len(key) == 0 :
                self.value = value
            else :
                ch = int('0x' + key[0],16)
                if self.branch[ch] == None :
                    self.branch[ch] = MPT()

                self.branch[ch].Insert(key[1:],value)    
        elif self.mode == 'extension' :
            i = 0
            while key[i] == self.key[i] :
                i+=1
                if i == len(self.key) : break
            if i == 0 :
                self.mode = 'branch'
                if len(self.key) == 1 :
                    self.branch[int('0x' + key[0],16)] = MPT()
                    self.branch[int('0x' + key[0],16)].Insert(key[1:],value)
                    self.branch[int('0x' + self.key[0],16)] = self.next
                else :
                    self.branch[int('0x' + key[0],16)] = MPT()
                    self.branch[int('0x' + key[0],16)].Insert(key[1:],value)
                    NewNode = MPT()
                    NewNode.mode = 'extension'
                    NewNode.key = self.key[1:]
                    NewNode.next = self.next
                    self.branch[int('0x' + self.key[0],16)] = NewNode
            elif i==len(self.key) :
                self.next.Insert(key[i:],value)
            else :
                if i==len(self.key)-1 :
                    NewNode = MPT()
                    NewNode.mode = 'branch'
                    NewNode.branch[int('0x' + key[i],16)] = MPT()
                    NewNode.branch[int('0x' + key[i],16)].Insert(key[i+1:],value)
                    NewNode.branch[int('0x' + self.key[i],16)] = self.next
                    self.key = key[0:i]
                    self.next = NewNode
                else :
                    NewNode = MPT()
                    NewNode.mode = 'branch'
                    NewNode.branch[int('0x' + key[i],16)] = MPT()
                    NewNode.branch[int('0x' + key[i],16)].Insert(key[i+1:],value)
                    NewNode.branch[int('0x' + self.key[i],16)] = MPT()
                    NewNode.branch[int('0x' + self.key[i],16)].mode = 'extension'
                    NewNode.branch[int('0x' + self.key[i],16)].key = self.key[i+1:]
                    NewNode.branch[int('0x' + self.key[i],16)].next = self.next
                    self.key = key[0:i]
                    self.next = NewNode
        elif self.mode == 'leaf' :
            i = 0
            while key[i] == self.key[i]:
                i+=1
                if i == len(key) : break
            #print(i)
            if i == 0 :
                self.mode = 'branch'
                self.branch[int('0x' + key[0],16)] = MPT()
                self.branch[int('0x' + key[0],16)].Insert(key[1:],value)
                self.branch[int('0x' + self.key[0],16)] = MPT()
                self.branch[int('0x' + self.key[0],16)].Insert(self.key[1:],self.value)
            else :
                self.mode = 'extension'
                next_node = MPT()
                next_node.mode = 'branch'
                next_node.branch[int('0x' + key[i],16)] = MPT()
                next_node.branch[int('0x' + key[i],16)].Insert(key[i+1:],value)
                next_node.branch[int('0x' + self.key[i],16)] = MPT()
                next_node.branch[int('0x' + self.key[i],16)].Insert(self.key[i+1:],self.value)
                self.key = key[0:i]
                self.next = next_node
    def Search(self,key,Update_flag=None,Update_value=None):
        if self.mode == 'leaf' :
            
            if key == self.key :
                #print("leaf")
                if Update_flag == 1 :
                    #print("1")
                    if int(self.value) >= Update_value :
                        #print(Update_value)
                        self.value = str(int(self.value) - Update_value)
                        return self.value
                    else :
                        return None
                elif Update_flag == 2 :
                    #print("2")
                    self.value = str(int(self.value) + Update_value)
                    return self.value
                elif Update_flag == None :
                    #print("3")
                    return self.value
        elif self.mode == 'extension' :
            i = 0
            while(key[i] == self.key[i])  :
                i += 1
                #print(i,len(key),len(self.key))
                if i == len(self.key) :
                    break
            if i == len(self.key) :
                return self.next.Search(key[i:],Update_flag,Update_value)
            else :
                return None
        elif self.mode == 'branch' :
            if self.branch[int("0x" + key[0],16)] != None :
                return self.branch[int("0x" + key[0],16)].Search(key[1:],Update_flag,Update_value)
            else :
                return None
        else :
            return None
    def Update(self,user1,user2,value):
        value = int(value)
        if value <= 0 :
            print(">Weird request.")
            return

        k = self.Search(user1,1,value)
        if k == None :
            print(">Weird request.")
            return

        k = self.Search(user2,2,value)
        if k == None :
            print(">Weird request.")
            return

        print(">Update successfully.")
        return
    def _Cal_pack_nibble(self):
        #print(self.key)

        if self.mode == 'leaf' :            element = 2
        elif self.mode == 'extension' :     element = 0
        else :
            return
        
        odd = len(self.key) % 2
        element |= odd
        # print(element)
        
        if odd == 0 : # even
            print(bytes.fromhex(str(element) + "0" + self.key).hex())
            return bytes.fromhex(str(element) + "0" + self.key)
        else :
            print(bytes.fromhex(str(element) + self.key).hex())
            return bytes.fromhex(str(element) + self.key)
        
        
        
        
        
    def Cal_hash(self):
        
        
        if self.mode == None :
            return "not count. Tree is not built yet."
        elif self.mode == "leaf":
            
            Node = [self._Cal_pack_nibble(),bytes(self.value,"utf-8")]
            
        elif self.mode == "extension":
            
            Node = [self._Cal_pack_nibble(),self.next.Cal_hash()]

            
        elif self.mode == "branch":
            Node = []
            #j = 0
            for i in self.branch :
                if i == None :
                    Node.append(b'')
                else :
                    Node.append(i.Cal_hash())
            
            Node.append(b'')
            
        print(Node)
        if self.root == True :
            #print(Node)
            return sha3.keccak_256(rlp.encode(Node)).hexdigest()
        else :
            
            if len(rlp.encode(Node)) >= 32 :
                return sha3.keccak_256(rlp.encode(Node)).digest()
            else :
                return Node

Tree = MPT(True)
Tree.Insert('a711355','45')
Tree.Insert('a77d337','1')
Tree.Insert('a7f9365','2')
Tree.Insert('a77d397','12')
Tree.Display(0)
print(Tree.Cal_hash())


# TreeList = {}
# Tree = None
# while(True):
#     Request = input("Create a Tree or Enter a Tree:")
#     Requests = Request.split()
#     if len(Requests) == 2 :
#         if Requests[0] == 'Create' :
#             if Requests[1] in TreeList :
#                 print("Tree already exists.")
#             else :
#                 TreeList[Requests[1]] = MPT(True)
#         elif Requests[0] == 'Enter' :
#             if Requests[1] not in TreeList :
#                  print("Tree not exist.")
#             else :
#                 Tree = TreeList[Requests[1]]
#                 while(True):
#                     op = input("(" + Requests[1] + ")>")
#                     Ops = op.split()
#                     if Ops[0] == 'display'  :
#                         if len(Ops) != 1 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             Tree.Display(0)
#                     elif Ops[0] == 'search' :
#                         if len(Ops) != 2 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             Val = Tree.Search(Ops[1])
#                             if Val == None :
#                                 print(">Error. This ID does not exist.")
#                             else :
#                                 print(">" + Ops[1] + "'s balance is " + Val)
#                     elif Ops[0] == 'insert' :
#                         if len(Ops) != 3 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             Tree.Insert(Ops[1],Ops[2])
                            
#                     elif Ops[0] == 'update' :
#                         if len(Ops) != 4 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             Tree.Update(Ops[1],Ops[2],Ops[3])
#                     elif Ops[0] == "root" :
#                         if len(Ops) != 1 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             print(">hash root is " + Tree.Cal_hash())
#                     elif Ops[0] == 'leave' :
#                         if len(Ops) != 1 : print(">Weird requset. Arguments number is wrong.")
#                         else :
#                             TreeList[Requests[1]] = Tree
#                             break
#                     else :
#                             print(">There is no such operation.")
#         else :
#             print("Weird request.")
#     else :
#         print("Weird request.")
    
#     #print(Ops)
#     #print(Ops[0])
#     #print(len(Ops))

                        
#     #'construct' 'display' 'search' 'insert'  'update' 


