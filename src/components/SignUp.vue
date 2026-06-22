<template>
        <h1 class="auth-title">Sign Up</h1>
  <form @submit.prevent="signup">

    <input type="text" placeholder="First name" required v-model="firstname">

    <input type="text" placeholder="Last name" required v-model="lastname">

    <input type="text" placeholder="Display name" required v-model="displayname">

    <input type="email" placeholder="you@example.com" required v-model="email">

    <input type="password" placeholder="Password" required v-model="password">

    <div v-if="error" class="error">
        {{ error }}
    </div>
    <button class="submit-btn">Sign Up</button>
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

<style scoped>
.auth-title {
    text-align: center;
    margin-bottom: 24px;
}

form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 360px;
    margin: 0 auto;
}

input {
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.submit-btn {
    margin-top: 10px;
    width: 100%;
}
</style>