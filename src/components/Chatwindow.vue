<template>
    <div class="chat-window">
  <div class="messages" ref="msgbox" >

    <div class="message-row" v-for="message in calucate_data" :key="message.id" :class="message.userid === currentUserid ? 'sent-row' : 'received-row'">
        <img v-if="avatarFor(message)" :src="avatarFor(message)" class="message-avatar" alt="Avatar">
        <div v-else class="message-avatar avatar-placeholder">{{ initialsFor(message.name) }}</div>
        <div class="message-box" :class="message.userid === currentUserid ? 'sent' : 'received'">
            <span class="created-at">{{ message.created_at }}</span><br>
            <span class="name">{{ message.name }}</span>
            <span class="message-content">  {{ message.message }}</span>
        </div>
    </div>
  </div>
</div>

</template>

<script>
import api from '@/api/config';
import { getSocket } from '@/socket';
import { getUser } from '@/composable/Getuser';
import { formatDistanceToNow } from 'date-fns';
import { computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';

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
                    let formeat_time = formatDistanceToNow(new Date(msg.created_at))
                    return {...msg,created_at: formeat_time}
                })
            })

            let onNewMessage = (msg)=>{
                messages.value.push(msg)
            }

            let initialsFor = (name)=>{
                if(!name) return "";
                return name.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
            }

            let avatarFor = (message)=>{
                return message.avatarUrl ? process.env.VUE_APP_API_URL + message.avatarUrl : null;
            }

            onMounted(async ()=>{
                let res = await api.get("/api/messages")
                messages.value = res.data
                getSocket().on("message:new", onNewMessage)
            })

            onUnmounted(()=>{
                getSocket().off("message:new", onNewMessage)
            })

            return {messages,calucate_data,msgbox,currentUserid,initialsFor,avatarFor}
        }
}
</script>

<style scoped>
.chat-window {
  background: #ffffff;
}

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

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.received-row {
  justify-content: flex-start;
}

.sent-row {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  background: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
}

.message-box {
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 14px;
  position: relative;
  word-wrap: break-word;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  display: inline-block;
  text-align: left;
}

.name {
  display: block;
  font-weight: 700;
  font-size: 12px;
}

.created-at {
  font-size: 10px;
  display: inline-block;
  opacity: 0.7;
}

.message-content {
  display: block;
  margin-top: 4px;
  line-height: 1.4;
}

.received {
  background: #eef0f3;
  color: #1f2937;
}

.received .name {
  color: var(--color-primary);
}

.received .created-at {
  color: #6b7280;
}

.sent {
  background: var(--color-primary);
  color: #ffffff;
}

.sent .name {
  color: #ffffff;
}

.sent .created-at {
  color: rgba(255, 255, 255, 0.75);
}

@media screen and (max-width: 600px) {
  .message-box {
    max-width: 90%;
  }
}
</style>