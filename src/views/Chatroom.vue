<template>
<div class="container chat-page">
<div class="self-container">
<Navbar></Navbar>
<Chatwindow></Chatwindow>
<Chatform></Chatform>
</div>

</div>
</template>

<script>
import Chatwindow from '../components/Chatwindow'
import Chatform from '../components/Chatform'
import { watch } from 'vue';
import Navbar from '../components/Navbar'
import { getUser } from '@/composable/Getuser';
import { useRouter } from 'vue-router';
export default {
  components: {
    Chatwindow,
    Chatform, Navbar },
  setup(){
    let {user} = getUser();
    let router = useRouter();
    watch(user,()=>{
      if(!user.value){
          router.push("/")
      }
    })
  }
}
</script>

<style scoped>

.chat-page {
  padding: 0;
  margin: 3% auto;
  overflow: hidden;
}

.self-container {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: var(--radius);
}

</style>