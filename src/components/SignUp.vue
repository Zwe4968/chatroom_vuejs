<template>
        <h1 style="text-align: center;">Sign Up</h1>
  <form @submit.prevent="signup">
    
    <input type="text" placeholder="first name" required v-model="firstname"><br>
    
    <input type="text" placeholder="last name" required v-model="lastname"> <br>

    <input type="text" placeholder="Display Name" required v-model="displayname"> <br>
   
    <input type="email" placeholder="example.com" required v-model="email"> <br>

    <input type="password" required v-model="password"><br>

    <div v-if="error" class="error">
        {{ error }}
    </div>
    <button >Sign Up</button>
  </form>
</template>

<script>
import { ref } from 'vue';
import {useSignup} from '@/composable/UseSignup'
export default {
        setup(props,context){
            let firstname = ref("")
            let lastname = ref("")
            let displayname = ref("")
            let email = ref("")
            let password = ref ("") 
            let {error,createAccount}= useSignup()
            let signup=async()=>{
              let res = await createAccount(email.value,password.value,displayname.value)
             if(res){
                context.emit("EnterChatRoom")
             }
             
            }
            return {firstname,lastname,displayname,email,password,signup, error}
        }
}
</script>

<style>

</style>