<template>
    <div class="chat-window">
  <div class="messages" ref="msgbox" >
    
    <div class="message-box"  v-for="message in calucate_data" :key="message.id" :class="message.userid === currentUserid ? 'sent' : 'received'">
        <span class="created-at">{{ message.created_at }}</span><br>
        <span class="name">{{ message.name }}</span>
        <span class="message-content">  {{ message.message }}</span>
   
    </div>
  </div>
</div>
  
</template>

<script>
import { getUser } from '@/composable/Getuser';
import { db } from '@/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { computed, onUpdated, ref, watch } from 'vue';

export default {

        
        setup(){
            let messages = ref ([]);
            let msgbox = ref(null)
            let {user} = getUser();
            let currentUserid = ref(user.value? user.value.uid :null);
            watch (user,(newUser)=>{
              if(newUser){
                currentUserid.value = newUser.uid;
              }
            })
            onUpdated(()=>{
              if(msgbox.value){
                msgbox.value.scrollTop = msgbox.value.scrollHeight;
              }
                })
            let calucate_data = computed(()=>{
                return messages.value.map((msg)=>{
                    let formeat_time = formatDistanceToNow(msg.created_at.toDate())
                    return {...msg,created_at: formeat_time}
                })
            })
            db.collection("messages").orderBy("created_at").onSnapshot((snap)=>{
                let result = [];
                snap.docs.forEach((doc)=>{
                    let document={...doc.data(),id:doc.id}
                    doc.data().created_at && result.push(document)
                })
                messages.value = result;
                
            })
            return {messages,calucate_data,msgbox,currentUserid}
        }
}
</script>

<style>
.messages {
  display: flex;
  flex-direction: column;
  gap: 12px; 
  padding: 16px;
  overflow-y: auto;
  max-height: 500px; 
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
}

.message-box {
  
  max-width: 60%;
  padding: 2%;
  margin: 8px 0;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  color: #333;
  display: inline-block;
  text-align: left;
  gap: 2px;
}

.name {
  color: rgb(66, 57, 57);
  display: block;
  padding-top: 5px;
}
.created-at {
  font-size: 10px;
  color: #666;
  display: inline-block;
}


.message-content {
  display: block;
  margin-top: 5px;
  line-height: 1.4;
  color: #060606;
}


.sent {
  background: #7ff1f0;
  align-self: flex-end;
  
}


.received {
  align-self: flex-start;
  
}


@media screen and (max-width: 600px) {
  .message-box {
    max-width: 90%;
  }
}

span{
  font-weight: bold;
  color: rgb(7, 198, 179);
}
</style>