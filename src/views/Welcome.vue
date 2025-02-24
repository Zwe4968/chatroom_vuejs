<template>
  <div class="container" >
    <div v-if="ToggelLoginForm">
      <Login @EnterChatRoom="EnterChatRoom"></Login>
      <div class="acconut">
        <p> Have you an account? <span @click="ToggelLoginForm = !ToggelLoginForm">Sign Up</span></p>
      </div>
    </div>
    <div v-else>
      <SignUp @EnterChatRoom="EnterChatRoom"></SignUp>
      <div class="acconut">
        <p>Already member ? <span @click="ToggelLoginForm = !ToggelLoginForm"> Login Account</span></p>
      </div>
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

<style> 
form{
    text-align: center;
}
label{
    font-weight: bold;
}
input {
  width: 40%;
  padding: 20px;
  margin: 8px 0;
  box-sizing: border-box;
  border: 0;
  outline: none;
  border-radius: 20px;
  box-shadow: 8px 4px rgb(202, 200, 200);
}
.acconut{
  text-align: center;
}

p{
  color: rgb(29, 27, 27);
}
</style>