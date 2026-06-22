<template>
    <div class="chat-container">
    <form class="input-area" @submit.prevent="submit">
        <textarea
            placeholder="Type your message..."
            v-model="message"
            @keypress.enter.prevent="submit"
        ></textarea>
        <button class="send-button" type="submit">Send</button>
    </form>
</div>
</template>

<script>
import { usecollection } from '@/composable/Collaction';
import { ref } from 'vue';


export default {
    setup(){
        let message =ref("")
        let {error,addDoc}=usecollection("messages")
        let submit= async ()=>{
            await addDoc({message:message.value})
            message.value="";

        }
        return{message,submit}
    }
}
</script>

<style scoped>

.chat-container {
  border-top: 1px solid var(--color-border);
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 16px;
}

textarea {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  min-height: 44px;
  max-height: 150px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.send-button {
  flex-shrink: 0;
}
</style>