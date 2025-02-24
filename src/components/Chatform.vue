<template>
    <div class="chat-container">
    <form class="input-area">
        <textarea 
            placeholder="Type your message..." 
            v-model="message"
            @keypress.enter.prevent="submit"
        ></textarea>
        <button> Send</button>
    </form>
</div>
</template>

<script>
import { usecollection } from '@/composable/Collaction';
import { getUser } from '@/composable/Getuser';
import { timestamp } from '@/firebase/config';
import { ref } from 'vue';


export default {
    setup(){
        let message =ref("")
        let {user}=getUser();
        let {error,addDoc}=usecollection("messages")
        let submit= async ()=>{
            let chat = {
                message:message.value,
                name:user.value.displayName,
                userid:user.value.uid,
                created_at:timestamp()
            }
            await addDoc(chat)
            message.value="";
            
        }
        return{message,submit}
    }
}
</script>

<style scoped>

.input-area {
  display: flex;
  gap: 8px;
  padding: 15px;
  margin: 10px;
}

textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 25px;
  resize: none;
  font-size: 12px;
  min-height: 50px;
  max-height: 150px;
  transition: all 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #0084ff;
  box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
}

.send-button:hover {
  background: #0073e6;
  transform: scale(1.02);
}
</style>