<template>
  <div class="container welcome-container">
    <div v-if="ToggelLoginForm">
      <Login @EnterChatRoom="EnterChatRoom"></Login>
      <p class="toggle-text">Don't have an account? <span class="toggle-link" @click="ToggelLoginForm = !ToggelLoginForm">Sign Up</span></p>
    </div>
    <div v-else>
      <SignUp @EnterChatRoom="EnterChatRoom"></SignUp>
      <p class="toggle-text">Already a member? <span class="toggle-link" @click="ToggelLoginForm = !ToggelLoginForm">Login</span></p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import Login from '../components/Login';
import SignUp from '../components/SignUp';
import { useRouter } from 'vue-router';
export default {
  components: {
    Login, SignUp },
      setup(){
        let ToggelLoginForm = ref (true)
        let router = useRouter();
        let EnterChatRoom=()=>{
          router.push({name:"Chatroom"})
        }
        return {ToggelLoginForm,EnterChatRoom}
      }
}
</script>

<style scoped>
.welcome-container {
  margin: 8vh auto;
}

.toggle-text {
  text-align: center;
  color: var(--color-text-muted);
  margin-top: 16px;
}

.toggle-link {
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
}

.toggle-link:hover {
  text-decoration: underline;
}
</style>