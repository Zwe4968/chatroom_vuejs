<template>
    <h1 class="auth-title">Login</h1>
<form @submit.prevent="login">
<label for="login-email">Email</label>
<input id="login-email" type="email" placeholder="you@example.com" required v-model="email">
<label for="login-password">Password</label>
<input id="login-password" type="password" required v-model="password">
<div class="error" v-if="error">
    {{ error }}
</div>
<button class="submit-btn">Login</button>
</form>
</template>

<script>
import { ref } from 'vue';
import { userlogin } from '@/composable/UseLogin';
export default {
    setup(props,context){
        let email = ref("")
        let password = ref ("")
        let {error,usersignin} = userlogin();
        let login=async()=>{
          
         let res = await usersignin(email.value,password.value)
            if(res){
                context.emit("EnterChatRoom")
            }
        }

        return {email,password,login,error}
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
    max-width: 360px;
    margin: 0 auto;
}

label {
    font-weight: 600;
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 12px 0 6px;
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
    margin-top: 20px;
    width: 100%;
}
</style>